import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// POST /api/auth/login/funcionario
router.post('/login/funcionario', authController.loginFuncionario);

// POST /api/auth/login/empresa
router.post('/login/empresa', authController.loginEmpresa);

export default router;
