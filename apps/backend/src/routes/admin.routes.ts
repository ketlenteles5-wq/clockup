import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const adminController = new AdminController();

// --- ROTAS DE FUNCIONÁRIOS ---
// POST /funcionarios - Cadastrar novo funcionário
router.post('/funcionarios', adminController.cadastrar);

// GET /funcionarios - Listar funcionários (opcionalmente com busca)
router.get('/funcionarios', adminController.listar);

// GET /funcionarios/:id - Detalhes do funcionário + resumo do mês
router.get('/funcionarios/:id', adminController.detalhar);

// GET /funcionarios/:id/ponto?inicio=YYYY-MM-DD&fim=YYYY-MM-DD - Registros por período
router.get('/funcionarios/:id/ponto', adminController.pontoFuncionario);

// --- ROTAS DE SOLICITAÇÃO DE FÉRIAS ---
// GET /ferias - Listar solicitações de férias
router.get('/ferias', adminController.listarFerias);

// PUT /ferias/:id/status - Atualizar status da solicitação de férias (Formato A)
router.put('/ferias/:id/status', adminController.atualizarStatusFerias);

// PUT /ferias/:id - Atualizar status da solicitação de férias (Formato B)
router.put('/ferias/:id', adminController.atualizarStatusFerias);

// --- ROTAS DE ATESTADOS MÉDICOS ---
// GET /atestados - Listar atestados médicos
router.get('/atestados', adminController.listarAtestados);

// PUT /atestados/:id/status - Atualizar status de atestado médico (Formato A)
router.put('/atestados/:id/status', adminController.atualizarStatusAtestado);

// PUT /atestados/:id - Atualizar status de atestado médico (Formato B)
router.put('/atestados/:id', adminController.atualizarStatusAtestado);

// --- ROTAS DE CONTESTAÇÕES DE PONTO ---
// GET /contestacoes - Listar contestações de ponto
router.get('/contestacoes', adminController.listarContestacoes);

// PUT /contestacoes/:id/status - Atualizar status de contestação de ponto (Formato A)
router.put('/contestacoes/:id/status', adminController.atualizarStatusContestacao);

// PUT /contestacoes/:id - Atualizar status de contestação de ponto (Formato B)
router.put('/contestacoes/:id', adminController.atualizarStatusContestacao);

export default router;
