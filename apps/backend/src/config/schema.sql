-- Habilita extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela: empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: funcionarios
CREATE TABLE IF NOT EXISTS funcionarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_admissao DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Ausente',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: registros_ponto
CREATE TABLE IF NOT EXISTS registros_ponto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL,
    horario VARCHAR(10) NOT NULL, -- "HH:MM" ou TIME. O repositório salva como string/TIME
    data DATE NOT NULL,
    modalidade VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: solicitacoes_ferias
CREATE TABLE IF NOT EXISTS solicitacoes_ferias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    dias INT NOT NULL,
    vender_dias BOOLEAN DEFAULT FALSE,
    dias_vender INT DEFAULT 0,
    observacao TEXT,
    status VARCHAR(20) DEFAULT 'Pendente',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: atestados
CREATE TABLE IF NOT EXISTS atestados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    arquivo_url VARCHAR(255) NOT NULL,
    data_consulta DATE NOT NULL,
    dias_afastamento INT NOT NULL,
    observacao TEXT,
    status VARCHAR(20) DEFAULT 'Pendente',
    motivo_reprovacao TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: contestacoes
CREATE TABLE IF NOT EXISTS contestacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
    data_falta DATE NOT NULL,
    turno VARCHAR(50) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    evidencias TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'Pendente',
    motivo_recusa TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
