import { AtestadoRepository } from '../repositories/atestado.repository';
import { Atestado } from '../models/types';

const MAX_DIAS_AFASTAMENTO = 180;

function todayLocalIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateToYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ddmmaaaa(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, '0');
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const y = d.getUTCFullYear();
  return `${day}/${m}/${y}`;
}

export class AtestadoService {
  private atestadoRepo = new AtestadoRepository();

  async enviarAtestado(data: {
    funcionario_id: string;
    dataConsulta: string;
    diasAfastamento: number;
    observacao?: string;
    arquivoUrl: string;
  }) {
    // 1. Validações básicas
    if (!data.dataConsulta || !/^\d{4}-\d{2}-\d{2}$/.test(data.dataConsulta)) {
      throw new Error('A data da consulta é obrigatória e deve estar no formato AAAA-MM-DD.');
    }

    const consultaDate = new Date(data.dataConsulta + 'T00:00:00');
    if (isNaN(consultaDate.getTime())) {
      throw new Error('A data da consulta fornecida é inválida.');
    }

    // Regra: data da consulta pode ser passada (justifica ausência), mas não futura.
    const hojeIso = todayLocalIso();
    if (data.dataConsulta > hojeIso) {
      throw new Error('A data da consulta não pode estar no futuro.');
    }

    const dias = Number(data.diasAfastamento);
    if (isNaN(dias) || dias <= 0) {
      throw new Error('A quantidade de dias de afastamento é obrigatória e deve ser maior que zero.');
    }

    if (dias > MAX_DIAS_AFASTAMENTO) {
      throw new Error(`Dias de afastamento acima de ${MAX_DIAS_AFASTAMENTO} não são aceitos pelo app. Procure o RH.`);
    }

    if (!data.arquivoUrl || typeof data.arquivoUrl !== 'string' || data.arquivoUrl.trim() === '') {
      throw new Error('O arquivo ou URL do atestado é obrigatório.');
    }

    // 2. Criar no banco de dados
    const atestado = await this.atestadoRepo.create({
      funcionario_id: data.funcionario_id,
      arquivo_url: data.arquivoUrl,
      data_consulta: data.dataConsulta,
      dias_afastamento: dias,
      observacao: data.observacao,
    });

    // Formatação da data de envio/criado em português (dd/mm/aaaa) para a resposta
    const now = new Date(atestado.created_at || new Date());
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    const dataEnvioFormatada = `${dia}/${mes}/${ano}`;

    // Formatação da data da consulta de Date para String "YYYY-MM-DD" caso venha como objeto Date do banco
    let dataConsultaStr = atestado.data_consulta.toString();
    if (atestado.data_consulta instanceof Date) {
      const cy = atestado.data_consulta.getFullYear();
      const cm = String(atestado.data_consulta.getMonth() + 1).padStart(2, '0');
      const cd = String(atestado.data_consulta.getDate()).padStart(2, '0');
      dataConsultaStr = `${cy}-${cm}-${cd}`;
    } else if (dataConsultaStr.includes('T')) {
      dataConsultaStr = dataConsultaStr.split('T')[0];
    }

    return {
      id: atestado.id,
      arquivo: atestado.arquivo_url,
      dataConsulta: dataConsultaStr,
      diasAfastamento: atestado.dias_afastamento,
      observacao: atestado.observacao,
      status: atestado.status,
      dataEnvio: dataEnvioFormatada,
    };
  }

  async listarProprios(funcionarioId: string) {
    const lista = await this.atestadoRepo.findByFuncionarioId(funcionarioId);
    return lista.map((a: Atestado) => {
      const dataConsulta = a.data_consulta instanceof Date
        ? dateToYmd(a.data_consulta)
        : String(a.data_consulta).split('T')[0];
      const dataEnvio = a.created_at instanceof Date
        ? ddmmaaaa(a.created_at)
        : '';
      return {
        id: a.id,
        arquivo: a.arquivo_url,
        dataConsulta,
        diasAfastamento: a.dias_afastamento,
        observacao: a.observacao || '',
        status: a.status,
        dataEnvio,
        motivoReprovacao: a.motivo_reprovacao || null,
      };
    });
  }
}
