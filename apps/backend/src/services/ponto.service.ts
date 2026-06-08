import { PontoRepository } from '../repositories/ponto.repository';
import { PontoTipo, PontoModalidade, RegistroPonto } from '../models/types';

// Coordenadas da sede/filial oficial da empresa para a cerca virtual
const OFFICIAL_LAT = -26.9195;
const OFFICIAL_LNG = -49.0661;
const VIRTUAL_FENCE_RADIUS_METERS = 100;

export class PontoService {
  private pontoRepo = new PontoRepository();

  async registrarPonto(data: {
    funcionario_id: string;
    tipo: PontoTipo;
    modalidade: PontoModalidade;
    latitude: number;
    longitude: number;
  }) {
    // 1. Validações básicas de tipo e modalidade
    const tiposPermitidos: PontoTipo[] = ['entrada', 'saida_intervalo', 'retorno_intervalo', 'saida'];
    const modalidadesPermitidas: PontoModalidade[] = ['Presencial', 'Remoto', 'Pausa'];

    if (!tiposPermitidos.includes(data.tipo)) {
      throw new Error(`Tipo de ponto inválido. Valores aceitos: ${tiposPermitidos.join(', ')}`);
    }

    if (!modalidadesPermitidas.includes(data.modalidade)) {
      throw new Error(`Modalidade de ponto inválida. Valores aceitos: ${modalidadesPermitidas.join(', ')}`);
    }

    // 2. Validação de geolocalização por cerca virtual (Cerca Virtual de 100 metros para Presencial)
    if (data.modalidade === 'Presencial') {
      const distancia = this.calculateDistance(
        data.latitude,
        data.longitude,
        OFFICIAL_LAT,
        OFFICIAL_LNG
      );

      if (distancia > VIRTUAL_FENCE_RADIUS_METERS) {
        throw new Error(
          `Registro de ponto bloqueado: Você está fora da cerca virtual (Distância atual: ${Math.round(distancia)}m). Limite de ${VIRTUAL_FENCE_RADIUS_METERS}m para pontos presenciais.`
        );
      }
    }

    // 3. Captura do horário e data do servidor
    const now = new Date();
    
    // Formato de hora HH:MM (ex: "08:02")
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const horarioString = `${horas}:${minutos}`;

    // Formato de data YYYY-MM-DD para salvar no banco
    const ano = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const dia = String(now.getDate()).padStart(2, '0');
    const dataIsoString = `${ano}-${mes}-${dia}`;

    // 4. Salvar registro no repositório
    const registro = await this.pontoRepo.create({
      funcionario_id: data.funcionario_id,
      tipo: data.tipo,
      horario: horarioString,
      data: dataIsoString,
      modalidade: data.modalidade,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    // 5. Formatação da data de resposta ("13 de Abr")
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
      .format(now)
      .replace('.', ''); // Remove o ponto abreviativo (ex: "abr." -> "abr")

    const parts = formattedDate.split(' ');
    if (parts[2]) {
      // Capitaliza o mês (ex: "abr" -> "Abr")
      parts[2] = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
    }
    const dataResponse = parts.join(' ');

    return {
      id: registro.id,
      tipo: registro.tipo,
      horario: registro.horario,
      data: dataResponse,
      modalidade: registro.modalidade,
      status: 'sucesso',
    };
  }

  /**
   * Calcula a distância entre duas coordenadas geográficas usando a fórmula de Haversine
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Raio da Terra em metros
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  }

  async getRegistrosEspelho(funcionarioId: string, inputMonth?: number, inputYear?: number) {
    const now = new Date();
    const month = inputMonth || (now.getMonth() + 1);
    const year = inputYear || now.getFullYear();

    const registros = await this.pontoRepo.findByFuncionarioIdAndMonthYear(funcionarioId, month, year);

    // Agrupar registros por string de data (YYYY-MM-DD)
    const groups: { [key: string]: RegistroPonto[] } = {};
    for (const r of registros) {
      let dateKey = '';
      if (r.data instanceof Date) {
        const y = r.data.getFullYear();
        const m = String(r.data.getMonth() + 1).padStart(2, '0');
        const d = String(r.data.getDate()).padStart(2, '0');
        dateKey = `${y}-${m}-${d}`;
      } else {
        dateKey = String(r.data).split('T')[0] || '';
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(r);
    }

    // Formatar cada grupo de registros diários
    const result = Object.keys(groups).map((dateKey) => {
      const dayPoints = groups[dateKey]!;
      
      const timeToMinutes = (timeStr: string): number => {
        const [h, m] = timeStr.split(':').map(Number);
        return (h ?? 0) * 60 + (m ?? 0);
      };

      let totalMinutes = 0;
      for (let i = 0; i < dayPoints.length - 1; i += 2) {
        const start = timeToMinutes(dayPoints[i].horario);
        const end = timeToMinutes(dayPoints[i + 1].horario);
        if (end > start) {
          totalMinutes += (end - start);
        }
      }

      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const horasTrabalhadas = `${hrs}h${String(mins).padStart(2, '0')}`;

      // Status do dia: completo se totalMinutes >= 480 (8 horas).
      // Se for menor, se for hoje é 'em_andamento', se for dia anterior é 'atraso'.
      let status: 'completo' | 'atraso' | 'em_andamento' = 'completo';
      
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      if (totalMinutes < 480) {
        if (dateKey === todayStr) {
          status = 'em_andamento';
        } else {
          status = 'atraso';
        }
      }

      // Formatar as datas no formato do espelho (ex: "Seg, 14 Abr")
      const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      const [y, mo, dy] = dateKey.split('-').map(Number);
      const dateObj = (y && mo && dy) ? new Date(y, mo - 1, dy) : new Date();
      
      const diaSemana = daysOfWeek[dateObj.getDay()] || '';
      const dia = dateObj.getDate();
      const mesNome = months[dateObj.getMonth()] || '';
      const dataStr = `${diaSemana}, ${dia} ${mesNome}`;
      const formattedDiaMes = `${dia} ${mesNome}`;

      return {
        data: dataStr,
        diaSemana,
        status,
        horasTrabalhadas,
        registros: dayPoints.map((p) => ({
          id: p.id,
          tipo: p.tipo,
          horario: p.horario,
          data: formattedDiaMes,
          modalidade: p.modalidade,
        })),
      };
    });

    return result;
  }
}
