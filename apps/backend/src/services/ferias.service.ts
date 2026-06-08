import { FeriasRepository } from '../repositories/ferias.repository';
import { FuncionarioRepository } from '../repositories/funcionario.repository';
import { SolicitacaoFerias } from '../models/types';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIAS_POR_PERIODO = 30;
const MAX_ABONO = 10;
const ANTECEDENCIA_MINIMA_DIAS = 30;

function formatarMmmAno(d: Date): string {
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatarDdMmm(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]?.toLowerCase() ?? ''}`;
}

function formatarDdMmmAno(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]?.toLowerCase() ?? ''} ${d.getUTCFullYear()}`;
}

function todayLocalIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function periodoAquisitivoAtual(dataAdmissao: Date, hoje: Date) {
  // Periodo aquisitivo = 12 meses contados da admissão; encontra o ciclo onde "hoje" está.
  const adm = new Date(dataAdmissao);
  let inicio = new Date(adm);
  let fim = new Date(adm);
  fim.setFullYear(fim.getFullYear() + 1);
  while (fim < hoje) {
    inicio = new Date(fim);
    fim = new Date(inicio);
    fim.setFullYear(fim.getFullYear() + 1);
  }
  // Periodo concessivo: 12 meses após o fim do aquisitivo.
  const concessivoFim = new Date(fim);
  concessivoFim.setFullYear(concessivoFim.getFullYear() + 1);
  return { inicio, fim, concessivoFim };
}

function mesesEntre(a: Date, b: Date): number {
  return Math.max(
    0,
    Math.round(
      (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
    )
  );
}

export class FeriasService {
  private feriasRepo = new FeriasRepository();
  private funcionarioRepo = new FuncionarioRepository();

  async solicitarFerias(data: {
    funcionario_id: string;
    dataInicio: string;
    dataFim: string;
    venderDias: boolean;
    diasVender: number;
    observacao?: string;
  }) {
    // 1. Validações básicas de datas
    if (!data.dataInicio || !/^\d{4}-\d{2}-\d{2}$/.test(data.dataInicio)) {
      throw new Error('A data de início é obrigatória e deve estar no formato AAAA-MM-DD.');
    }
    if (!data.dataFim || !/^\d{4}-\d{2}-\d{2}$/.test(data.dataFim)) {
      throw new Error('A data de fim é obrigatória e deve estar no formato AAAA-MM-DD.');
    }

    const start = new Date(data.dataInicio + 'T00:00:00');
    const end = new Date(data.dataFim + 'T00:00:00');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('As datas fornecidas são inválidas.');
    }

    if (end < start) {
      throw new Error('A data de fim não pode ser anterior à data de início.');
    }

    // Regra: férias não podem começar no passado.
    const hojeIso = todayLocalIso();
    if (data.dataInicio < hojeIso) {
      throw new Error('A data de início das férias não pode estar no passado.');
    }

    // Regra CLT (Art. 135): aviso prévio mínimo de 30 dias.
    const minimoInicio = new Date();
    minimoInicio.setHours(0, 0, 0, 0);
    minimoInicio.setDate(minimoInicio.getDate() + ANTECEDENCIA_MINIMA_DIAS);
    const minimoIso = `${minimoInicio.getFullYear()}-${String(minimoInicio.getMonth() + 1).padStart(2, '0')}-${String(minimoInicio.getDate()).padStart(2, '0')}`;
    if (data.dataInicio < minimoIso) {
      throw new Error(
        `A solicitação deve ser feita com pelo menos ${ANTECEDENCIA_MINIMA_DIAS} dias de antecedência (CLT, Art. 135). A data mais próxima permitida é ${minimoIso.split('-').reverse().join('/')}.`
      );
    }

    // Cálculo da quantidade de dias de férias (inclusivo)
    const diffTime = end.getTime() - start.getTime();
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Regra CLT: máximo 30 dias por solicitação.
    if (dias > DIAS_POR_PERIODO) {
      throw new Error(`O período máximo de férias é de ${DIAS_POR_PERIODO} dias por solicitação.`);
    }

    let diasVender = 0;
    if (data.venderDias) {
      diasVender = Number(data.diasVender);
      if (isNaN(diasVender) || diasVender <= 0) {
        throw new Error('A quantidade de dias a vender deve ser um número maior que zero.');
      }
      
      // Regra de negócio: limite máximo de dias para vender é 10
      if (diasVender > 10) {
        throw new Error('O limite máximo de dias para vender é 10.');
      }

      if (diasVender > dias) {
        throw new Error('A quantidade de dias a vender não pode ser maior que o período total de férias solicitado.');
      }
    }

    // Regra: respeitar saldo do período aquisitivo (30 − já solicitados não-reprovados nesse período).
    const funcionario = await this.funcionarioRepo.findById(data.funcionario_id);
    if (!funcionario) {
      throw new Error('Funcionário não encontrado.');
    }
    const periodo = periodoAquisitivoAtual(new Date(funcionario.data_admissao), start);
    const todasDoFuncionario = await this.feriasRepo.findByFuncionarioId(data.funcionario_id);
    const naoReprovadasDoPeriodo = todasDoFuncionario.filter((s) => {
      if (s.status === 'Reprovado') return false;
      const ini = new Date(s.data_inicio);
      return ini >= periodo.inicio && ini < periodo.fim;
    });
    const diasJaSolicitados = naoReprovadasDoPeriodo.reduce((acc, s) => acc + (s.dias || 0), 0);
    const disponivel = DIAS_POR_PERIODO - diasJaSolicitados;
    if (dias > disponivel) {
      throw new Error(
        `Saldo insuficiente para o período aquisitivo atual: você tem ${disponivel} dia(s) restantes.`
      );
    }

    // Regra: não sobrepor outra solicitação não-reprovada do mesmo funcionário.
    const overlap = await this.feriasRepo.findOverlappingNotRejected(
      data.funcionario_id,
      data.dataInicio,
      data.dataFim,
    );
    if (overlap) {
      throw new Error('Já existe uma solicitação de férias que se sobrepõe a esse período.');
    }

    // 2. Salvar no banco de dados
    const solicitacao = await this.feriasRepo.create({
      funcionario_id: data.funcionario_id,
      data_inicio: data.dataInicio,
      data_fim: data.dataFim,
      dias,
      vender_dias: !!data.venderDias,
      dias_vender: diasVender,
      observacao: data.observacao,
    });

    return {
      id: solicitacao.id,
      status: solicitacao.status,
      message: 'Solicitação de férias enviada com sucesso.',
    };
  }

  async listarPropriasComSaldo(funcionarioId: string) {
    const funcionario = await this.funcionarioRepo.findById(funcionarioId);
    if (!funcionario) {
      throw new Error('Funcionário não encontrado.');
    }

    const hoje = new Date();
    const periodo = periodoAquisitivoAtual(new Date(funcionario.data_admissao), hoje);

    const todas = await this.feriasRepo.findByFuncionarioId(funcionarioId);

    // Para o saldo: somar dias aprovados dentro do periodo aquisitivo atual.
    const aprovadasDoPeriodo = todas.filter((s) => {
      const ini = new Date(s.data_inicio);
      return s.status === 'Aprovado' && ini >= periodo.inicio && ini < periodo.fim;
    });
    const diasUsados = aprovadasDoPeriodo.reduce((acc, s) => acc + (s.dias || 0), 0);
    const diasDisponiveis = Math.max(0, DIAS_POR_PERIODO - diasUsados);

    const venceEmMeses = mesesEntre(hoje, periodo.concessivoFim);
    const venceEm = venceEmMeses === 1 ? '1 mês' : `${venceEmMeses} meses`;

    const solicitacoes = todas.map((s: SolicitacaoFerias) => {
      const ini = new Date(s.data_inicio);
      const fim = new Date(s.data_fim);
      return {
        id: s.id,
        dataInicio: formatarDdMmm(ini),
        dataFim: formatarDdMmmAno(fim),
        dias: s.dias,
        venderDias: s.vender_dias,
        diasVender: s.dias_vender,
        observacao: s.observacao || '',
        status: s.status,
      };
    });

    return {
      saldo: {
        diasDisponiveis,
        periodoAquisitivo: `${formatarMmmAno(periodo.inicio)} - ${formatarMmmAno(periodo.fim)}`,
        venceEm,
        abono: MAX_ABONO,
      },
      solicitacoes,
    };
  }
}
