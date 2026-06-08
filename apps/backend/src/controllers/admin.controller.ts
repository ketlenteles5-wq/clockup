import { Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { AuthenticatedRequest } from '../middlewares/auth';

export class AdminController {
  private adminService = new AdminService();

  // --- CONTROLADORES DE FUNCIONÁRIOS ---
  cadastrar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso negado. Apenas administradores podem cadastrar funcionários.' });
        return;
      }

      const { nome, email, cpf, cargo, senha, dataAdmissao, data_admissao } = req.body;

      const result = await this.adminService.cadastrarFuncionario({
        empresaId: req.user.id,
        nome,
        email,
        cpf,
        cargo,
        senha,
        dataAdmissao: dataAdmissao || data_admissao,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao cadastrar funcionário.' });
    }
  };

  detalhar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso negado.' });
        return;
      }
      const { id } = req.params;
      const result = await this.adminService.getFuncionarioDetail(req.user.id, id as string);
      res.status(200).json(result);
    } catch (error: any) {
      const msg = error.message || 'Erro ao buscar funcionário.';
      const status = msg.includes('não encontrado') ? 404 : 400;
      res.status(status).json({ error: msg });
    }
  };

  pontoFuncionario = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso negado.' });
        return;
      }
      const { id } = req.params;
      const { inicio, fim } = req.query as { inicio?: string; fim?: string };
      if (!inicio || !fim) {
        res.status(400).json({ error: 'Os parâmetros inicio e fim são obrigatórios.' });
        return;
      }
      const result = await this.adminService.getFuncionarioPontoRange(
        req.user.id,
        id as string,
        inicio,
        fim,
      );
      res.status(200).json(result);
    } catch (error: any) {
      const msg = error.message || 'Erro ao buscar registros de ponto.';
      const status = msg.includes('não encontrado') ? 404 : 400;
      res.status(status).json({ error: msg });
    }
  };

  listar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso negado. Apenas administradores podem listar funcionários.' });
        return;
      }

      const search = (req.query.busca || req.query.search) as string | undefined;

      const result = await this.adminService.listarFuncionarios(req.user.id, search);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar funcionários.' });
    }
  };

  // --- CONTROLADORES DE FÉRIAS ---
  listarFerias = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso negado.' });
        return;
      }

      const filtro = (req.query.filtro || req.query.status) as string | undefined;
      const result = await this.adminService.listarFerias(req.user.id, filtro);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar solicitações de férias.' });
    }
  };

  atualizarStatusFerias = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso negado.' });
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

      const result = await this.adminService.atualizarStatusFerias(id as string, status as string);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao atualizar status de férias.' });
    }
  };

  // --- CONTROLADORES DE ATESTADOS ---
  listarAtestados = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso negado.' });
        return;
      }

      const filtro = (req.query.filtro || req.query.status) as string | undefined;
      const result = await this.adminService.listarAtestados(req.user.id, filtro);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar atestados médicos.' });
    }
  };

  atualizarStatusAtestado = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso negado.' });
        return;
      }

      const { id } = req.params;
      const { status, motivoReprovacao, motivo_reprovacao } = req.body;

      const result = await this.adminService.atualizarStatusAtestado(
        id as string,
        status as string,
        (motivoReprovacao || motivo_reprovacao) as string | undefined
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao atualizar status do atestado médico.' });
    }
  };

  // --- CONTROLADORES DE CONTESTAÇÕES ---
  listarContestacoes = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso negado.' });
        return;
      }

      const filtro = (req.query.filtro || req.query.status) as string | undefined;
      const result = await this.adminService.listarContestacoes(req.user.id, filtro);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao listar contestações.' });
    }
  };

  atualizarStatusContestacao = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Acesso negado.' });
        return;
      }

      const { id } = req.params;
      const { status, motivoRecusa, motivo_recusa } = req.body;

      const result = await this.adminService.atualizarStatusContestacao(
        id as string,
        status as string,
        (motivoRecusa || motivo_recusa) as string | undefined
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erro ao atualizar status da contestação.' });
    }
  };
}
