import { ContestacaoRepository } from '../repositories/contestacao.repository';

function todayLocalIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export class ContestacaoService {
  private contestacaoRepo = new ContestacaoRepository();

  async criarContestacao(data: {
    funcionario_id: string;
    dataFalta: string;
    turno: string;
    motivo: string;
    descricao: string;
    evidencias?: string[];
  }) {
    // Validações básicas de regra de negócio
    if (!data.dataFalta) {
      throw new Error('A data da falta/inconsistência é obrigatória.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dataFalta)) {
      throw new Error('A data da falta deve estar no formato AAAA-MM-DD.');
    }
    if (data.dataFalta > todayLocalIso()) {
      throw new Error('A data da falta não pode estar no futuro.');
    }
    if (!data.turno) {
      throw new Error('O turno afetado é obrigatório.');
    }
    if (!data.motivo) {
      throw new Error('O motivo da contestação é obrigatório.');
    }
    if (!data.descricao) {
      throw new Error('A descrição detalhada da contestação é obrigatória.');
    }

    const contestacao = await this.contestacaoRepo.create({
      funcionario_id: data.funcionario_id,
      data_falta: data.dataFalta,
      turno: data.turno,
      motivo: data.motivo,
      descricao: data.descricao,
      evidencias: data.evidencias || [],
    });

    return {
      id: contestacao.id,
      status: contestacao.status,
      message: 'Contestação enviada ao seu gestor!',
    };
  }
}
