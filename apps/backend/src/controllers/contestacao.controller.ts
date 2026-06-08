import { Response, NextFunction } from 'express';
import { ContestacaoService } from '../services/contestacao.service';
import { AuthenticatedRequest } from '../middlewares/auth';

export class ContestacaoController {
  private contestacaoService = new ContestacaoService();

  criar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'EMPLOYEE') {
        res.status(401).json({ error: 'Acesso restrito para funcionários.' });
        return;
      }

      const { dataFalta, turno, motivo, descricao, evidencias } = req.body;

      const result = await this.contestacaoService.criarContestacao({
        funcionario_id: req.user.id,
        dataFalta,
        turno,
        motivo,
        descricao,
        evidencias,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao abrir contestação.' });
    }
  };
}
