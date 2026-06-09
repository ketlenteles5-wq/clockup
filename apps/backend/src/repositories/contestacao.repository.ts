import { pool } from '../config/database';
import { Contestacao } from '../models/types';

export class ContestacaoRepository {
  async create(data: {
    funcionario_id: string;
    data_falta: string; // YYYY-MM-DD
    turno: string;
    motivo: string;
    descricao: string;
    evidencias: string[];
  }): Promise<Contestacao> {
    const result = await pool.query(
      `INSERT INTO contestacoes (funcionario_id, data_falta, turno, motivo, descricao, evidencias)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, funcionario_id, data_falta, turno, motivo, descricao, evidencias, status, created_at`,
      [
        data.funcionario_id,
        data.data_falta,
        data.turno,
        data.motivo,
        data.descricao,
        data.evidencias || [],
      ]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Contestacao | null> {
    const result = await pool.query('SELECT * FROM contestacoes WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByFuncionarioId(funcionarioId: string): Promise<Contestacao[]> {
    const result = await pool.query(
      `SELECT * FROM contestacoes 
       WHERE funcionario_id = $1 
       ORDER BY created_at DESC`,
      [funcionarioId]
    );
    return result.rows;
  }

  async findAllByEmpresaId(empresaId: string, status?: string): Promise<(Contestacao & { funcionario_nome: string; funcionario_cargo: string })[]> {
    let query = `
      SELECT c.*, f.nome as funcionario_nome, f.cargo as funcionario_cargo
      FROM contestacoes c
      JOIN funcionarios f ON c.funcionario_id = f.id
      WHERE f.empresa_id = $1
    `;
    const params: any[] = [empresaId];

    if (status) {
      query += ` AND c.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateStatus(
    id: string,
    empresaId: string,
    status: string,
    motivoRecusa?: string,
  ): Promise<Contestacao | null> {
    const result = await pool.query(
      `UPDATE contestacoes
       SET status = $1, motivo_recusa = $2
       WHERE id = $3
         AND funcionario_id IN (SELECT id FROM funcionarios WHERE empresa_id = $4)
       RETURNING *`,
      [status, motivoRecusa || null, id, empresaId]
    );
    return result.rows[0] || null;
  }
}
