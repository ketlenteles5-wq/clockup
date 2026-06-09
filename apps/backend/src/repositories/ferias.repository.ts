import { pool } from '../config/database';
import { SolicitacaoFerias } from '../models/types';

export class FeriasRepository {
  async create(data: {
    funcionario_id: string;
    data_inicio: string; // YYYY-MM-DD
    data_fim: string; // YYYY-MM-DD
    dias: number;
    vender_dias: boolean;
    dias_vender: number;
    observacao?: string;
  }): Promise<SolicitacaoFerias> {
    const result = await pool.query(
      `INSERT INTO solicitacoes_ferias (funcionario_id, data_inicio, data_fim, dias, vender_dias, dias_vender, observacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, funcionario_id, data_inicio, data_fim, dias, vender_dias, dias_vender, observacao, status, created_at`,
      [
        data.funcionario_id,
        data.data_inicio,
        data.data_fim,
        data.dias,
        data.vender_dias,
        data.dias_vender,
        data.observacao || null,
      ]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<SolicitacaoFerias | null> {
    const result = await pool.query('SELECT * FROM solicitacoes_ferias WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByFuncionarioId(funcionarioId: string): Promise<SolicitacaoFerias[]> {
    const result = await pool.query(
      `SELECT * FROM solicitacoes_ferias 
       WHERE funcionario_id = $1 
       ORDER BY created_at DESC`,
      [funcionarioId]
    );
    return result.rows;
  }

  async findAllByEmpresaId(empresaId: string, status?: string): Promise<(SolicitacaoFerias & { funcionario_nome: string; funcionario_cargo: string })[]> {
    let query = `
      SELECT sf.*, f.nome as funcionario_nome, f.cargo as funcionario_cargo
      FROM solicitacoes_ferias sf
      JOIN funcionarios f ON sf.funcionario_id = f.id
      WHERE f.empresa_id = $1
    `;
    const params: any[] = [empresaId];

    if (status) {
      query += ` AND sf.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY sf.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async findOverlappingNotRejected(
    funcionarioId: string,
    inicio: string,
    fim: string,
  ): Promise<SolicitacaoFerias | null> {
    const result = await pool.query(
      `SELECT * FROM solicitacoes_ferias
       WHERE funcionario_id = $1
         AND status <> 'Reprovado'
         AND NOT (data_fim < $2 OR data_inicio > $3)
       LIMIT 1`,
      [funcionarioId, inicio, fim],
    );
    return result.rows[0] || null;
  }

  async updateStatus(
    id: string,
    empresaId: string,
    status: string,
  ): Promise<SolicitacaoFerias | null> {
    const result = await pool.query(
      `UPDATE solicitacoes_ferias
       SET status = $1
       WHERE id = $2
         AND funcionario_id IN (SELECT id FROM funcionarios WHERE empresa_id = $3)
       RETURNING *`,
      [status, id, empresaId]
    );
    return result.rows[0] || null;
  }
}
