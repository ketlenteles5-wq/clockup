import express, { Application, Request, Response, NextFunction } from 'express';
import routes from './routes';

const app: Application = express();

// Middleware de parsing de JSON
app.use(express.json());

// Middleware de CORS manual (evita a necessidade de pacotes externos)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Rotas da API
app.use('/api', routes);

// Middleware global de tratamento de erros
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Ocorreu um erro interno no servidor.',
    message: err.message,
  });
});

export default app;
