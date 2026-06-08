import { pool } from '../config/database';
import { Atestado } from '../models/types';

export class AtestadoRepository {
  async create(data: {
    funcionario_id: string;
    arquivo_url: string;
    data_consulta: string; // YYYY-MM-DD
    dias_afastamento: number;
    observacao?: string;
  }): Promise<Atestado> {
    const result = await pool.query(
      `INSERT INTO atestados (funcionario_id, arquivo_url, data_consulta, dias_afastamento, observacao)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, funcionario_id, arquivo_url, data_consulta, dias_afastamento, observacao, status, motivo_reprovacao, created_at`,
      [
        data.funcionario_id,
        data.arquivo_url,
        data.data_consulta,
        data.dias_afastamento,
        data.observacao || null,
      ]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Atestado | null> {
    const result = await pool.query('SELECT * FROM atestados WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByFuncionarioId(funcionarioId: string): Promise<Atestado[]> {
    const result = await pool.query(
      `SELECT * FROM atestados 
       WHERE funcionario_id = $1 
       ORDER BY created_at DESC`,
      [funcionarioId]
    );
    return result.rows;
  }

  async findAllByEmpresaId(empresaId: string, status?: string): Promise<(Atestado & { funcionario_nome: string; funcionario_cargo: string })[]> {
    let query = `
      SELECT a.*, f.nome as funcionario_nome, f.cargo as funcionario_cargo
      FROM atestados a
      JOIN funcionarios f ON a.funcionario_id = f.id
      WHERE f.empresa_id = $1
    `;
    const params: any[] = [empresaId];

    if (status) {
      query += ` AND a.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY a.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async updateStatus(id: string, status: string, motivoReprovacao?: string): Promise<Atestado | null> {
    const result = await pool.query(
      `UPDATE atestados
       SET status = $1, motivo_reprovacao = $2
       WHERE id = $3
       RETURNING *`,
      [status, motivoReprovacao || null, id]
    );
    return result.rows[0] || null;
  }
}
