import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || '3000',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/clockup',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
};
