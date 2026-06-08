import { Router } from 'express';
import { PontoController } from '../controllers/ponto.controller';
import { ContestacaoController } from '../controllers/contestacao.controller';
import { FeriasController } from '../controllers/ferias.controller';
import { AtestadoController } from '../controllers/atestado.controller';

const router = Router();
const pontoController = new PontoController();
const contestacaoController = new ContestacaoController();
const feriasController = new FeriasController();
const atestadoController = new AtestadoController();

// POST /ponto/registrar - Registrar ponto
router.post('/ponto/registrar', pontoController.registrar);

// GET /ponto/registros - Espelho de ponto (agrupado por dia)
router.get('/ponto/registros', pontoController.visualizarEspelho);

// POST /ponto/contestar - Abrir contestação de ponto
router.post('/ponto/contestar', contestacaoController.criar);

// POST /ferias/solicitar - Solicitar férias
router.post('/ferias/solicitar', feriasController.solicitar);

// GET /ferias - Saldo + histórico das próprias férias
router.get('/ferias', feriasController.listarProprias);

// POST /atestados/enviar - Enviar atestado médico
router.post('/atestados/enviar', atestadoController.enviar);

// GET /atestados - Histórico próprio de atestados
router.get('/atestados', atestadoController.listarProprios);

export default router;
