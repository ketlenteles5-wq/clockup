import { Response, NextFunction } from 'express';
import { FeriasService } from '../services/ferias.service';
import { AuthenticatedRequest } from '../middlewares/auth';

export class FeriasController {
  private feriasService = new FeriasService();

  solicitar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'EMPLOYEE') {
        res.status(401).json({ error: 'Acesso restrito para funcionários.' });
        return;
      }

      const { dataInicio, dataFim, venderDias, diasVender, observacao } = req.body;

      const result = await this.feriasService.solicitarFerias({
        funcionario_id: req.user.id,
        dataInicio,
        dataFim,
        venderDias: !!venderDias,
        diasVender: diasVender !== undefined ? Number(diasVender) : 0,
        observacao,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao solicitar férias.' });
    }
  };

  listarProprias = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'EMPLOYEE') {
        res.status(401).json({ error: 'Acesso restrito para funcionários.' });
        return;
      }
      const result = await this.feriasService.listarPropriasComSaldo(req.user.id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar férias.' });
    }
  };
}
