import { pool } from '../config/database';
import { Funcionario } from '../models/types';

export class FuncionarioRepository {
  async findById(id: string): Promise<Funcionario | null> {
    const result = await pool.query('SELECT * FROM funcionarios WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByCpf(cpf: string): Promise<Funcionario | null> {
    const result = await pool.query('SELECT * FROM funcionarios WHERE cpf = $1', [cpf]);
    return result.rows[0] || null;
  }

  async create(data: Omit<Funcionario, 'id' | 'created_at' | 'status'> & { senhaHash: string }): Promise<Funcionario> {
    const result = await pool.query(
      `INSERT INTO funcionarios (empresa_id, nome, email, cpf, cargo, senha, data_admissao) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, empresa_id, nome, email, cpf, cargo, data_admissao, status, created_at`,
      [
        data.empresa_id,
        data.nome,
        data.email,
        data.cpf,
        data.cargo,
        data.senhaHash,
        data.data_admissao,
      ]
    );
    return result.rows[0];
  }

  async findAllByEmpresaId(empresaId: string, search?: string): Promise<Funcionario[]> {
    let query = 'SELECT id, empresa_id, nome, email, cpf, cargo, data_admissao, status, created_at FROM funcionarios WHERE empresa_id = $1';
    const params: any[] = [empresaId];

    if (search) {
      query += ' AND (nome ILIKE $2 OR cargo ILIKE $2)';
      params.push(`%${search}%`);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }
}
