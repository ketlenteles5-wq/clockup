export interface Registro {
  id: string;
  tipo: "entrada" | "saida_intervalo" | "retorno_intervalo" | "saida";
  horario: string;
  data: string;
  modalidade: "Presencial" | "Remoto" | "Pausa";
}

export interface DiaTrabalho {
  data: string;
  diaSemana: string;
  registros: Registro[];
  horasTrabalhadas: string;
  status: "completo" | "em_andamento" | "atraso";
}

export interface ResumoMes {
  pontualidade: number;
  horasTrabalhadas: string;
  bancoHoras: string;
}

export interface SolicitacaoFerias {
  id: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
  status: "Aprovado" | "Pendente" | "Reprovado";
}

export interface SaldoFerias {
  diasDisponiveis: number;
  periodoAquisitivo: string;
  venceEm: string;
  abono: number;
  solicitacoes: SolicitacaoFerias[];
}

export interface Atestado {
  paciente: string;
  cid: string;
  periodoInicio: string;
  periodoFim: string;
  medico: string | null;
}

export interface Usuario {
  nome: string;
  cargo: string;
}
