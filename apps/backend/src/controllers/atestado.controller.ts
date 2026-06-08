import { Response, NextFunction } from 'express';
import { AtestadoService } from '../services/atestado.service';
import { AuthenticatedRequest } from '../middlewares/auth';

export class AtestadoController {
  private atestadoService = new AtestadoService();

  enviar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'EMPLOYEE') {
        res.status(401).json({ error: 'Acesso restrito para funcionários.' });
        return;
      }

      const { dataConsulta, diasAfastamento, observacao, arquivo, arquivoUrl } = req.body;

      const fileUrl = arquivoUrl || arquivo;

      const result = await this.atestadoService.enviarAtestado({
        funcionario_id: req.user.id,
        dataConsulta,
        diasAfastamento: diasAfastamento !== undefined ? Number(diasAfastamento) : 0,
        observacao,
        arquivoUrl: fileUrl,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao enviar atestado médico.' });
    }
  };

  listarProprios = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'EMPLOYEE') {
        res.status(401).json({ error: 'Acesso restrito para funcionários.' });
        return;
      }
      const result = await this.atestadoService.listarProprios(req.user.id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar atestados.' });
    }
  };
}
