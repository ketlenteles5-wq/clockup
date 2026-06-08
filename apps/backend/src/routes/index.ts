import { Router } from 'express';
import authRoutes from './auth.routes';
import { authMiddleware, roleMiddleware } from '../middlewares/auth';

import funcionarioRoutes from './funcionario.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Rota de status para verificar se a API está online
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Rotas públicas de autenticação
router.use('/auth', authRoutes);

// Rotas restritas para Funcionários (pode ser acessada via /funcionario ou /employee)
router.use('/funcionario', authMiddleware, roleMiddleware(['EMPLOYEE']), funcionarioRoutes);
router.use('/employee', authMiddleware, roleMiddleware(['EMPLOYEE']), funcionarioRoutes);

// Rotas restritas para Administradores
router.use('/admin', authMiddleware, roleMiddleware(['ADMIN']), adminRoutes);

export default router;
