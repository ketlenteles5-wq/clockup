import { Response, NextFunction } from 'express';
import { PontoService } from '../services/ponto.service';
import { AuthenticatedRequest } from '../middlewares/auth';

export class PontoController {
  private pontoService = new PontoService();

  registrar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'EMPLOYEE') {
        res.status(401).json({ error: 'Acesso restrito para funcionários.' });
        return;
      }

      const { tipo, modalidade, latitude, longitude } = req.body;

      // Validação rápida de campos obrigatórios no payload
      if (!tipo || !modalidade || latitude === undefined || longitude === undefined) {
        res.status(400).json({
          error: 'Os campos tipo, modalidade, latitude e longitude são obrigatórios.',
        });
        return;
      }

      const result = await this.pontoService.registrarPonto({
        funcionario_id: req.user.id,
        tipo,
        modalidade,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao registrar ponto.' });
    }
  };

  visualizarEspelho = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'EMPLOYEE') {
        res.status(401).json({ error: 'Acesso restrito para funcionários.' });
        return;
      }

      const { mes, ano } = req.query;
      const monthNumber = mes ? Number(mes) : undefined;
      const yearNumber = ano ? Number(ano) : undefined;

      const result = await this.pontoService.getRegistrosEspelho(
        req.user.id,
        monthNumber,
        yearNumber
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao visualizar registros de ponto.' });
    }
  };
}
