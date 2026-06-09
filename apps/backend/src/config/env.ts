import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

const JWT_SECRET = required('JWT_SECRET');
if (JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET deve ter ao menos 32 caracteres. Gere uma string forte (ex: openssl rand -base64 48).',
  );
}

export const env = {
  PORT: process.env.PORT || '3000',
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
};
