import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { EmpresaRepository } from '../repositories/empresa.repository';
import { FuncionarioRepository } from '../repositories/funcionario.repository';
import { UserRole } from '../models/types';

export class AuthService {
  private empresaRepo = new EmpresaRepository();
  private funcionarioRepo = new FuncionarioRepository();

  async loginFuncionario(cpf: string, senhaInserida: string) {
    const funcionario = await this.funcionarioRepo.findByCpf(cpf);
    if (!funcionario || !funcionario.senha) {
      throw new Error('Credenciais inválidas');
    }

    const senhaValida = await bcrypt.compare(senhaInserida, funcionario.senha);
    if (!senhaValida) {
      throw new Error('Credenciais inválidas');
    }

    const token = jwt.sign(
      { id: funcionario.id, role: 'EMPLOYEE' as UserRole, empresaId: funcionario.empresa_id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: {
        id: funcionario.id,
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        cargo: funcionario.cargo,
        dataAdmissao: funcionario.data_admissao,
        role: 'EMPLOYEE' as UserRole,
      },
    };
  }

  async loginEmpresa(cnpj: string, senhaInserida: string) {
    const empresa = await this.empresaRepo.findByCnpj(cnpj);
    if (!empresa || !empresa.senha) {
      throw new Error('Credenciais inválidas');
    }

    const senhaValida = await bcrypt.compare(senhaInserida, empresa.senha);
    if (!senhaValida) {
      throw new Error('Credenciais inválidas');
    }

    const token = jwt.sign(
      { id: empresa.id, role: 'ADMIN' as UserRole },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return {
      token,
      empresa: {
        id: empresa.id,
        cnpj: empresa.cnpj,
        razao_social: empresa.razao_social,
        role: 'ADMIN' as UserRole,
      },
    };
  }
}
