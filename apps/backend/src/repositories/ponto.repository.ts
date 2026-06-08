import { pool } from '../config/database';
import { RegistroPonto, PontoTipo, PontoModalidade } from '../models/types';

export class PontoRepository {
  async create(data: {
    funcionario_id: string;
    tipo: PontoTipo;
    horario: string;
    data: string; // YYYY-MM-DD
    modalidade: PontoModalidade;
    latitude: number;
    longitude: number;
  }): Promise<RegistroPonto> {
    const result = await pool.query(
      `INSERT INTO registros_ponto (funcionario_id, tipo, horario, data, modalidade, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, funcionario_id, tipo, horario, data, modalidade, latitude, longitude, created_at`,
      [
        data.funcionario_id,
        data.tipo,
        data.horario,
        data.data,
        data.modalidade,
        data.latitude,
        data.longitude,
      ]
    );
    return result.rows[0];
  }

  async findByFuncionarioIdAndDate(funcionarioId: string, date: string): Promise<RegistroPonto[]> {
    const result = await pool.query(
      `SELECT * FROM registros_ponto 
       WHERE funcionario_id = $1 AND data = $2
       ORDER BY created_at ASC`,
      [funcionarioId, date]
    );
    return result.rows;
  }

  async findByFuncionarioIdAndMonthYear(
    funcionarioId: string,
    month: number,
    year: number
  ): Promise<RegistroPonto[]> {
    const result = await pool.query(
      `SELECT * FROM registros_ponto
       WHERE funcionario_id = $1
         AND EXTRACT(MONTH FROM data) = $2
         AND EXTRACT(YEAR FROM data) = $3
       ORDER BY data ASC, horario ASC`,
      [funcionarioId, month, year]
    );
    return result.rows;
  }

  async findByFuncionarioIdAndDateRange(
    funcionarioId: string,
    inicio: string,
    fim: string
  ): Promise<RegistroPonto[]> {
    const result = await pool.query(
      `SELECT * FROM registros_ponto
       WHERE funcionario_id = $1
         AND data BETWEEN $2 AND $3
       ORDER BY data ASC, horario ASC`,
      [funcionarioId, inicio, fim]
    );
    return result.rows;
  }
}
