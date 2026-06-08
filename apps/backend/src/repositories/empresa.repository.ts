import { pool } from '../config/database';
import { Empresa } from '../models/types';

export class EmpresaRepository {
  async findById(id: string): Promise<Empresa | null> {
    const result = await pool.query('SELECT * FROM empresas WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByCnpj(cnpj: string): Promise<Empresa | null> {
    const result = await pool.query('SELECT * FROM empresas WHERE cnpj = $1', [cnpj]);
    return result.rows[0] || null;
  }

  async create(cnpj: string, razaoSocial: string, senhaHash: string): Promise<Empresa> {
    const result = await pool.query(
      `INSERT INTO empresas (cnpj, razao_social, senha) 
       VALUES ($1, $2, $3) 
       RETURNING id, cnpj, razao_social, created_at`,
      [cnpj, razaoSocial, senhaHash]
    );
    return result.rows[0];
  }
}
