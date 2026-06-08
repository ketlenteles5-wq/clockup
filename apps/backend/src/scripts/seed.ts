import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

async function run() {
  const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('> Aplicando schema...');
  await pool.query(schemaSql);

  console.log('> Inserindo empresa inicial...');
  const senhaEmpresaHash = await bcrypt.hash('admin123', 10);
  const empresa = await pool.query(
    `INSERT INTO empresas (cnpj, razao_social, senha)
     VALUES ($1, $2, $3)
     ON CONFLICT (cnpj) DO UPDATE SET senha = EXCLUDED.senha
     RETURNING id, cnpj, razao_social`,
    ['12345678000190', 'Empresa Teste LTDA', senhaEmpresaHash],
  );
  console.log('  empresa:', empresa.rows[0]);

  console.log('\nAcesso da empresa:');
  console.log('  CNPJ: 12.345.678/0001-90  |  Senha: admin123');
  console.log('\nCadastre os funcionários pela tela do admin.');

  await pool.end();
}

run().catch((err) => {
  console.error('Seed falhou:', err);
  pool.end();
  process.exit(1);
});
