import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService = new AuthService();

  loginFuncionario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cpf, senha } = req.body;
      if (!cpf || !senha) {
        res.status(400).json({ error: 'CPF e senha são obrigatórios.' });
        return;
      }

      const result = await this.authService.loginFuncionario(cpf, senha);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Erro de autenticação' });
    }
  };

  loginEmpresa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cnpj, senha } = req.body;
      if (!cnpj || !senha) {
        res.status(400).json({ error: 'CNPJ e senha são obrigatórios.' });
        return;
      }

      const result = await this.authService.loginEmpresa(cnpj, senha);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Erro de autenticação' });
    }
  };
}
