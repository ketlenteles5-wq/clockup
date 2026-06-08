export interface Empresa {
  id: string;
  cnpj: string;
  razao_social: string;
  senha?: string;
  created_at: Date;
}

export interface Funcionario {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  cpf: string;
  cargo: string;
  senha?: string;
  data_admissao: Date;
  status: 'Presente' | 'Ausente' | 'Férias';
  created_at: Date;
}

export type PontoTipo = 'entrada' | 'saida_intervalo' | 'retorno_intervalo' | 'saida';
export type PontoModalidade = 'Presencial' | 'Remoto' | 'Pausa';

export interface RegistroPonto {
  id: string;
  funcionario_id: string;
  tipo: PontoTipo;
  horario: string; // "HH:MM"
  data: Date;
  modalidade: PontoModalidade;
  latitude: number;
  longitude: number;
  created_at: Date;
}

export type StatusSolicitacao = 'Pendente' | 'Aprovado' | 'Reprovado';

export interface SolicitacaoFerias {
  id: string;
  funcionario_id: string;
  data_inicio: Date;
  data_fim: Date;
  dias: number;
  vender_dias: boolean;
  dias_vender: number;
  observacao?: string;
  status: StatusSolicitacao;
  created_at: Date;
}

export interface Atestado {
  id: string;
  funcionario_id: string;
  arquivo_url: string;
  data_consulta: Date;
  dias_afastamento: number;
  observacao?: string;
  status: StatusSolicitacao;
  motivo_reprovacao?: string;
  created_at: Date;
}

export type StatusContestacao = 'Pendente' | 'Aceita' | 'Recusada';

export interface Contestacao {
  id: string;
  funcionario_id: string;
  data_falta: Date;
  turno: string; // "Manhã", "Tarde", "Dia Inteiro"
  motivo: string;
  descricao: string;
  evidencias?: string[];
  status: StatusContestacao;
  motivo_recusa?: string;
  created_at: Date;
}

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface DecodedToken {
  id: string;
  role: UserRole;
  empresaId?: string;
}
