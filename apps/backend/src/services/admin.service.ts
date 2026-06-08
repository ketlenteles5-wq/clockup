import bcrypt from 'bcryptjs';
import { FuncionarioRepository } from '../repositories/funcionario.repository';
import { FeriasRepository } from '../repositories/ferias.repository';
import { AtestadoRepository } from '../repositories/atestado.repository';
import { ContestacaoRepository } from '../repositories/contestacao.repository';
import { PontoRepository } from '../repositories/ponto.repository';
import { RegistroPonto } from '../models/types';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const EXPECTED_MINUTES_PER_BUSINESS_DAY = 480; // 8h

function dateKeyFromDbValue(value: Date | string): string {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value).split('T')[0] || '';
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function workedMinutesFromDay(registros: RegistroPonto[]): number {
  let total = 0;
  for (let i = 0; i + 1 < registros.length; i += 2) {
    const start = timeToMinutes(registros[i].horario);
    const end = timeToMinutes(registros[i + 1].horario);
    if (end > start) total += end - start;
  }
  return total;
}

function formatWorkedHours(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h${String(m).padStart(2, '0')}`;
}

function formatBancoHoras(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  return `${sign}${h}h`;
}

function businessDaysElapsedInMonth(year: number, month0: number, today: Date): number {
  const last = today.getMonth() === month0 && today.getFullYear() === year ? today.getDate() : new Date(year, month0 + 1, 0).getDate();
  let count = 0;
  for (let day = 1; day <= last; day++) {
    const dow = new Date(year, month0, day).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

interface DayGroup {
  data: string; // "Seg, 14 Abr"
  dataISO: string; // "2026-04-14"
  diaSemana: string;
  horasTrabalhadas: string;
  minutos: number;
  status: 'completo' | 'atraso' | 'em_andamento';
  registros: {
    id: string;
    tipo: RegistroPonto['tipo'];
    horario: string;
    modalidade: RegistroPonto['modalidade'];
    latitude: number;
    longitude: number;
  }[];
}

function groupRegistrosByDay(registros: RegistroPonto[], reference: Date): DayGroup[] {
  const groups = new Map<string, RegistroPonto[]>();
  for (const r of registros) {
    const key = dateKeyFromDbValue(r.data);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const todayKey = `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}-${String(reference.getDate()).padStart(2, '0')}`;

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, dayPoints]) => {
      const minutos = workedMinutesFromDay(dayPoints);
      let status: DayGroup['status'] = 'completo';
      if (minutos < EXPECTED_MINUTES_PER_BUSINESS_DAY) {
        status = key === todayKey ? 'em_andamento' : 'atraso';
      }

      const [y, mo, dy] = key.split('-').map(Number);
      const dateObj = y && mo && dy ? new Date(y, mo - 1, dy) : new Date();
      const diaSemana = DAYS_OF_WEEK[dateObj.getDay()] || '';
      const mesNome = MONTHS[dateObj.getMonth()] || '';

      return {
        data: `${diaSemana}, ${dateObj.getDate()} ${mesNome}`,
        dataISO: key,
        diaSemana,
        horasTrabalhadas: formatWorkedHours(minutos),
        minutos,
        status,
        registros: dayPoints.map((p) => ({
          id: p.id,
          tipo: p.tipo,
          horario: p.horario,
          modalidade: p.modalidade,
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
        })),
      };
    });
}

export class AdminService {
  private funcionarioRepo = new FuncionarioRepository();
  private feriasRepo = new FeriasRepository();
  private atestadoRepo = new AtestadoRepository();
  private contestacaoRepo = new ContestacaoRepository();
  private pontoRepo = new PontoRepository();

  // Auxiliar para gerar iniciais do avatar
  private getAvatarInitials(nome: string): string {
    const parts = nome.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const firstChar = parts[0][0] || '';
    const lastChar = parts[parts.length - 1][0] || '';
    return (firstChar + lastChar).toUpperCase();
  }

  // Auxiliar para formatar datas como dd/mm/aaaa a partir de strings/Date do banco
  private formatDate(dateVal: any): string {
    if (!dateVal) return '';
    const dateObj = new Date(dateVal);
    if (isNaN(dateObj.getTime())) return String(dateVal);
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const year = dateObj.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  async cadastrarFuncionario(data: {
    empresaId: string;
    nome: string;
    email: string;
    cpf: string;
    cargo: string;
    senha?: string;
    dataAdmissao: string;
  }) {
    if (!data.nome || data.nome.trim() === '') {
      throw new Error('O nome é obrigatório.');
    }
    if (!data.email || data.email.trim() === '') {
      throw new Error('O e-mail é obrigatório.');
    }
    if (!data.cpf || data.cpf.trim() === '') {
      throw new Error('O CPF é obrigatório.');
    }
    if (!data.cargo || data.cargo.trim() === '') {
      throw new Error('O cargo é obrigatório.');
    }
    if (!data.senha || data.senha.trim() === '') {
      throw new Error('A senha é obrigatória.');
    }
    if (!data.dataAdmissao || data.dataAdmissao.trim() === '') {
      throw new Error('A data de admissão é obrigatória.');
    }

    const funcionarioExistente = await this.funcionarioRepo.findByCpf(data.cpf);
    if (funcionarioExistente) {
      throw new Error('Já existe um funcionário cadastrado com este CPF.');
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);

    const funcionario = await this.funcionarioRepo.create({
      empresa_id: data.empresaId,
      nome: data.nome,
      email: data.email,
      cpf: data.cpf,
      cargo: data.cargo,
      senhaHash,
      data_admissao: new Date(data.dataAdmissao + 'T00:00:00'),
    });

    return {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      message: 'Funcionário cadastrado com sucesso!',
    };
  }

  async getFuncionarioDetail(empresaId: string, funcionarioId: string) {
    const funcionario = await this.funcionarioRepo.findById(funcionarioId);
    if (!funcionario || funcionario.empresa_id !== empresaId) {
      throw new Error('Funcionário não encontrado.');
    }

    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const registrosMes = await this.pontoRepo.findByFuncionarioIdAndMonthYear(
      funcionarioId,
      month,
      year,
    );
    const diasMes = groupRegistrosByDay(registrosMes, today);
    const minutosTrabalhadosMes = diasMes.reduce((acc, d) => acc + d.minutos, 0);
    const diasUteisDecorridos = businessDaysElapsedInMonth(year, month - 1, today);
    const minutosEsperadosMes = diasUteisDecorridos * EXPECTED_MINUTES_PER_BUSINESS_DAY;
    const bancoMinutos = minutosTrabalhadosMes - minutosEsperadosMes;
    const diasComRegistro = diasMes.length;
    const diasCompletos = diasMes.filter((d) => d.status === 'completo').length;
    const pontualidade =
      diasComRegistro > 0
        ? Math.round((diasCompletos / diasComRegistro) * 100)
        : 0;

    return {
      id: funcionario.id,
      nome: funcionario.nome,
      cargo: funcionario.cargo,
      email: funcionario.email,
      cpf: funcionario.cpf,
      status: funcionario.status || 'Ausente',
      avatar: this.getAvatarInitials(funcionario.nome),
      dataAdmissao: this.formatDate(funcionario.data_admissao),
      resumoMes: {
        horasTrabalhadas: formatWorkedHours(minutosTrabalhadosMes),
        bancoHoras: formatBancoHoras(bancoMinutos),
        pontualidade,
      },
    };
  }

  async getFuncionarioPontoRange(
    empresaId: string,
    funcionarioId: string,
    inicio: string,
    fim: string,
  ) {
    const funcionario = await this.funcionarioRepo.findById(funcionarioId);
    if (!funcionario || funcionario.empresa_id !== empresaId) {
      throw new Error('Funcionário não encontrado.');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(inicio) || !dateRegex.test(fim)) {
      throw new Error('Datas inválidas. Use o formato YYYY-MM-DD.');
    }
    if (inicio > fim) {
      throw new Error('Data inicial não pode ser maior que a final.');
    }

    const registros = await this.pontoRepo.findByFuncionarioIdAndDateRange(
      funcionarioId,
      inicio,
      fim,
    );
    const dias = groupRegistrosByDay(registros, new Date());
    const totalMinutos = dias.reduce((acc, d) => acc + d.minutos, 0);

    return {
      inicio,
      fim,
      totalMinutos,
      totalFormatado: formatWorkedHours(totalMinutos),
      dias,
    };
  }

  async listarFuncionarios(empresaId: string, search?: string) {
    const funcionarios = await this.funcionarioRepo.findAllByEmpresaId(empresaId, search);

    return funcionarios.map((f) => {
      return {
        id: f.id,
        nome: f.nome,
        cargo: f.cargo,
        email: f.email,
        cpf: f.cpf,
        status: f.status || 'Ausente',
        avatar: this.getAvatarInitials(f.nome),
        horasTrabalhadas: '0h',
        pontualidade: 100,
      };
    });
  }

  // --- MÉTODOS DE SOLICITAÇÃO DE FÉRIAS ---
  async listarFerias(empresaId: string, statusFilter?: string) {
    // Normalizar filtros que venham da query string (Ex: 'Todos' -> undefined)
    const status = (statusFilter === 'Todos' || !statusFilter) ? undefined : statusFilter;
    const list = await this.feriasRepo.findAllByEmpresaId(empresaId, status);

    return list.map((sf) => ({
      id: sf.id,
      funcionario: sf.funcionario_nome,
      avatar: this.getAvatarInitials(sf.funcionario_nome),
      cargo: sf.funcionario_cargo,
      dataInicio: this.formatDate(sf.data_inicio),
      dataFim: this.formatDate(sf.data_fim),
      dias: sf.dias,
      abono: sf.vender_dias,
      diasAbono: sf.dias_vender,
      observacao: sf.observacao || '',
      status: sf.status,
    }));
  }

  async atualizarStatusFerias(id: string, status: string) {
    const statusPermitidos = ['Aprovado', 'Reprovado', 'Pendente'];
    if (!statusPermitidos.includes(status)) {
      throw new Error(`Status inválido. Escolha entre: ${statusPermitidos.join(', ')}`);
    }

    const updated = await this.feriasRepo.updateStatus(id, status);
    if (!updated) {
      throw new Error('Solicitação de férias não encontrada.');
    }

    return {
      id: updated.id,
      status: updated.status,
      message: `Férias ${status === 'Aprovado' ? 'aprovadas' : 'reprovadas'} e funcionário notificado.`,
    };
  }

  // --- MÉTODOS DE ATESTADOS MÉDICOS ---
  async listarAtestados(empresaId: string, statusFilter?: string) {
    const status = (statusFilter === 'Todos' || !statusFilter) ? undefined : statusFilter;
    const list = await this.atestadoRepo.findAllByEmpresaId(empresaId, status);

    return list.map((a) => {
      const start = new Date(a.data_consulta);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + a.dias_afastamento - 1);

      return {
        id: a.id,
        funcionario: a.funcionario_nome,
        avatar: this.getAvatarInitials(a.funcionario_nome),
        cargo: a.funcionario_cargo,
        periodoInicio: this.formatDate(a.data_consulta),
        periodoFim: this.formatDate(end),
        diasAfastamento: a.dias_afastamento,
        dataEnvio: this.formatDate(a.created_at),
        observacao: a.observacao || '',
        status: a.status,
      };
    });
  }

  async atualizarStatusAtestado(id: string, status: string, motivoReprovacao?: string) {
    const statusPermitidos = ['Aprovado', 'Reprovado', 'Pendente'];
    if (!statusPermitidos.includes(status)) {
      throw new Error(`Status inválido. Escolha entre: ${statusPermitidos.join(', ')}`);
    }

    if (status === 'Reprovado' && (!motivoReprovacao || motivoReprovacao.trim() === '')) {
      throw new Error('O motivo da reprovação é obrigatório ao reprovar um atestado.');
    }

    const updated = await this.atestadoRepo.updateStatus(id, status, motivoReprovacao);
    if (!updated) {
      throw new Error('Atestado médico não encontrado.');
    }

    return {
      id: updated.id,
      status: updated.status,
      motivoReprovacao: updated.motivo_reprovacao,
    };
  }

  // --- MÉTODOS DE CONTESTAÇÃO DE PONTO ---
  async listarContestacoes(empresaId: string, statusFilter?: string) {
    // Para contestação, o status em backend_architecture.md é 'Todos', 'Pendente', 'Aceita', 'Recusada'
    const status = (statusFilter === 'Todos' || !statusFilter) ? undefined : statusFilter;
    const list = await this.contestacaoRepo.findAllByEmpresaId(empresaId, status);

    return list.map((c) => {
      const now = new Date();
      const created = new Date(c.created_at);
      const diffMs = now.getTime() - created.getTime();
      const diasAbertos = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      return {
        id: c.id,
        funcionario: c.funcionario_nome,
        avatar: this.getAvatarInitials(c.funcionario_nome),
        cargo: c.funcionario_cargo,
        dataFalta: this.formatDate(c.data_falta),
        turno: c.turno,
        motivo: c.motivo,
        descricao: c.descricao,
        evidencias: c.evidencias || [],
        dataAbertura: this.formatDate(c.created_at),
        diasAbertos,
        status: c.status,
      };
    });
  }

  async atualizarStatusContestacao(id: string, status: string, motivoRecusa?: string) {
    const statusPermitidos = ['Aceita', 'Recusada', 'Pendente'];
    if (!statusPermitidos.includes(status)) {
      throw new Error(`Status inválido. Escolha entre: ${statusPermitidos.join(', ')}`);
    }

    if (status === 'Recusada' && (!motivoRecusa || motivoRecusa.trim() === '')) {
      throw new Error('O motivo da recusa é obrigatório ao recusar uma contestação.');
    }

    const updated = await this.contestacaoRepo.updateStatus(id, status, motivoRecusa);
    if (!updated) {
      throw new Error('Contestação não encontrada.');
    }

    return {
      id: updated.id,
      status: updated.status,
      motivoRecusa: updated.motivo_recusa,
    };
  }
}
