# Documentação de Arquitetura e Especificação do Backend — ClockUp

Esta documentação foi elaborada com base no mapeamento da aplicação frontend React + TypeScript contida no projeto ClockUp. Ela descreve as rotas do frontend, a especificação dos endpoints da API, a estrutura do banco de dados e as diretrizes para a implementação do backend.

---

## 1. Arquitetura Geral & Tecnologias Recomendadas

O backend deve ser construído seguindo o modelo **RESTful API**, com comunicação em JSON e autenticação via **JWT (JSON Web Tokens)** baseada em perfis de acesso (Roles): `ADMIN` (Empresa) e `EMPLOYEE` (Funcionário).

### Stack Tecnológica Sugerida:

- **Linguagem/Framework**: Node.js com Express (ou NestJS para maior escalabilidade) ou Python com FastAPI.
- **Banco de Dados**: PostgreSQL (recomendado pela consistência relacional e suporte nativo a dados geográficos se necessário) ou MySQL.
- **Armazenamento de Arquivos**: AWS S3, Google Cloud Storage ou armazenamento em disco local configurado no backend (para PDFs/Imagens de Atestados e Evidências).
- **Autenticação**: JWT com expiração curta + Refresh Token (opcional para maior segurança).

---

## 2. Modelagem do Banco de Dados (Entidades)

### Tabela: `empresas` (Empresas/Admins)

Armazena as informações das empresas clientes que gerenciam a plataforma.
| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Identificador único |
| `cnpj` | VARCHAR(18) | Unique, Not Null | CNPJ da empresa (ex: `12.345.678/0001-90`) |
| `razao_social`| VARCHAR(255) | Not Null | Razão social ou nome fantasia |
| `senha` | VARCHAR(255) | Not Null | Senha criptografada (ex: bcrypt/argon2) |
| `created_at` | TIMESTAMP | Default NOW() | Data de cadastro |

### Tabela: `funcionarios` (Funcionários)

Pertence a uma empresa e possui dados de login baseados em CPF.
| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Identificador único |
| `empresa_id` | UUID | Foreign Key | ID da empresa à qual o funcionário pertence |
| `nome` | VARCHAR(255) | Not Null | Nome completo |
| `email` | VARCHAR(255) | Unique, Not Null | E-mail corporativo |
| `cpf` | VARCHAR(14) | Unique, Not Null | CPF formatado (ex: `123.456.789-00`) |
| `cargo` | VARCHAR(100) | Not Null | Cargo do funcionário (ex: `Desenvolvedora`) |
| `senha` | VARCHAR(255) | Not Null | Senha criptografada |
| `data_admissao`| DATE | Not Null | Data de admissão |
| `status` | VARCHAR(20) | Default 'Ausente' | Status atual (`Presente`, `Ausente`, `Férias`) |
| `created_at` | TIMESTAMP | Default NOW() | Data de cadastro |

### Tabela: `registros_ponto` (Registros de Ponto)

Registra as entradas, saídas e pausas diárias dos funcionários com sua geolocalização.
| Campo | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Identificador único |
| `funcionario_id`| UUID | Foreign Key | Referência ao funcionário |
| `tipo` | VARCHAR(30) | Not Null | `entrada`, `saida_intervalo`, `retorno_intervalo`, `saida` |
| `horario` | TIME | Not Null | Horário exato do ponto (ex: `08:02`) |
| `data` | DATE | Not Null | Data do registro (ex: `2026-04-14`) |
| `modalidade` | VARCHAR(20) | Not Null | `Presencial`, `Remoto`, `Pausa` |
| `latitude` | DECIMAL(10, 8)| Not Null | Latitude capturada pelo GPS |
| `longitude` | DECIMAL(11, 8)| Not Null | Longitude capturada pelo GPS |
| `created_at` | TIMESTAMP | Default NOW() | Registro do servidor |

### Tabela: `solicitacoes_ferias` (Solicitações de Férias)

| Campo            | Tipo        | Restrições         | Descrição                                          |
| :--------------- | :---------- | :----------------- | :------------------------------------------------- |
| `id`             | UUID        | Primary Key        | Identificador único                                |
| `funcionario_id` | UUID        | Foreign Key        | Referência ao funcionário                          |
| `data_inicio`    | DATE        | Not Null           | Primeiro dia de férias                             |
| `data_fim`       | DATE        | Not Null           | Último dia de férias                               |
| `dias`           | INT         | Not Null           | Duração (data_fim - data_inicio + 1)               |
| `vender_dias`    | BOOLEAN     | Default FALSE      | Se vendeu dias (abono pecuniário)                  |
| `dias_vender`    | INT         | Default 0          | Quantidade de dias vendidos (máx 10)               |
| `observacao`     | TEXT        | Nullable           | Observação do funcionário (ex: "Viagem")           |
| `status`         | VARCHAR(20) | Default 'Pendente' | Estado atual (`Pendente`, `Aprovado`, `Reprovado`) |
| `created_at`     | TIMESTAMP   | Default NOW()      | Data de envio da solicitação                       |

### Tabela: `atestados` (Atestados Médicos)

| Campo               | Tipo         | Restrições         | Descrição                                          |
| :------------------ | :----------- | :----------------- | :------------------------------------------------- |
| `id`                | UUID         | Primary Key        | Identificador único                                |
| `funcionario_id`    | UUID         | Foreign Key        | Referência ao funcionário                          |
| `arquivo_url`       | VARCHAR(255) | Not Null           | Link de acesso ao arquivo (PDF/Imagem)             |
| `data_consulta`     | DATE         | Not Null           | Data do atendimento médico                         |
| `dias_afastamento`  | INT          | Not Null           | Quantidade de dias de afastamento                  |
| `observacao`        | TEXT         | Nullable           | Detalhes/Observações adicionais                    |
| `status`            | VARCHAR(20)  | Default 'Pendente' | Estado atual (`Pendente`, `Aprovado`, `Reprovado`) |
| `motivo_reprovacao` | TEXT         | Nullable           | Preenchido em caso de reprovação                   |
| `created_at`        | TIMESTAMP    | Default NOW()      | Data de envio                                      |

### Tabela: `contestacoes` (Ajustes de Ponto)

| Campo            | Tipo          | Restrições         | Descrição                                           |
| :--------------- | :------------ | :----------------- | :-------------------------------------------------- |
| `id`             | UUID          | Primary Key        | Identificador único                                 |
| `funcionario_id` | UUID          | Foreign Key        | Referência ao funcionário                           |
| `data_falta`     | DATE          | Not Null           | Data do dia que necessita de ajuste/justificativa   |
| `turno`          | VARCHAR(50)   | Not Null           | Turno afetado (ex: `Manhã`, `Tarde`, `Dia Inteiro`) |
| `motivo`         | VARCHAR(255)  | Not Null           | Categoria do motivo (ex: `Problema no transporte`)  |
| `descricao`      | TEXT          | Not Null           | Explicação textual detalhada                        |
| `evidencias`     | JSON / TEXT[] | Nullable           | Lista de URLs dos arquivos de comprovação anexados  |
| `status`         | VARCHAR(20)   | Default 'Pendente' | Estado atual (`Pendente`, `Aceita`, `Recusada`)     |
| `motivo_recusa`  | TEXT          | Nullable           | Obrigatório se a contestação for `Recusada`         |
| `created_at`     | TIMESTAMP     | Default NOW()      | Data de abertura                                    |

---

## 3. Mapeamento de Rotas do Frontend

O frontend se comunica por meio de rotas específicas. O backend deve suportar os dados exibidos e processados nas seguintes páginas:

### Perfis de Acesso Comuns e Públicos (Auth)

- **`/login`**: Escolha do perfil de entrada (Funcionário vs. Empresa).
- **`/login/funcionario`**: Login do funcionário com CPF e Senha.
- **`/login/empresa`**: Login da empresa (Administrador) com CNPJ e Senha.

### Painel do Funcionário (Employee)

- **`/home`**: Exibe resumo estatístico mensal (pontualidade, horas trabalhadas, saldo de banco de horas) e atalhos.
- **`/ponto`**: Tela de registro do ponto com relógio atualizado, mapa de geolocalização e lista dos últimos pontos batidos no dia.
- **`/espelho`**: Consulta detalhada de registros agrupados por dia em um mês específico, saldo de horas e botão para solicitar contestação/ajuste.
- **`/ferias`**: Visualização do saldo de férias (dias a vencer, período aquisitivo) e histórico de solicitações de férias do funcionário.
- **`/ferias/solicitar`**: Formulário de solicitação de novas férias com cálculo de dias e opção de abono pecuniário (venda de dias).
- **`/atestado`**: Upload de atestado médico com data, quantidade de dias e visualização de arquivos enviados com o respectivo status.

### Painel Administrativo (Admin)

- **`/admin`**: Dashboard geral. Exibe números de funcionários ativos, presentes hoje, pendências gerais e contestações em aberto.
- **`/admin/funcionarios`**: Lista todos os funcionários cadastrados com busca por nome/cargo e status em tempo real.
- **`/admin/funcionarios/:id`**: Detalhes individuais do funcionário, resumo de horas do mês, filtro de registros por período e visualização geográfica dos pontos no mapa.
- **`/admin/ferias`**: Gestão e aprovação/reprovação de férias solicitadas por funcionários.
- **`/admin/atestados`**: Gestão e aprovação/reprovação de atestados médicos recebidos.
- **`/admin/contestacoes`**: Análise de pedidos de ajuste de ponto (aceitar ou recusar com motivo).
- **`/admin/cadastrar`**: Cadastro de novos funcionários informando nome, email, CPF, cargo e senha padrão.

---

## 4. Especificação dos Endpoints da API (API Endpoints)

Todos os endpoints privados exigem o cabeçalho: `Authorization: Bearer <JWT_TOKEN>`.

### 4.1. Autenticação (Auth)

#### `POST /api/auth/login/funcionario`

- **Acesso**: Público
- **Requisição (Body)**:
  ```json
  {
    "cpf": "123.456.789-00",
    "senha": "senha_funcionario"
  }
  ```
- **Resposta (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "uuid-func-123",
      "nome": "Nicole Ferreira",
      "cpf": "123.456.789-00",
      "cargo": "Desenvolvedora",
      "role": "EMPLOYEE"
    }
  }
  ```

#### `POST /api/auth/login/empresa`

- **Acesso**: Público
- **Requisição (Body)**:
  ```json
  {
    "cnpj": "12.345.678/0001-90",
    "senha": "senha_empresa"
  }
  ```
- **Resposta (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "empresa": {
      "id": "uuid-empresa-123",
      "cnpj": "12.345.678/0001-90",
      "razao_social": "ClockUp S.A.",
      "role": "ADMIN"
    }
  }
  ```

---

### 4.2. Módulos do Funcionário (Employee Only)

#### `GET /api/funcionario/resumo`

- **Acesso**: Restrito (`EMPLOYEE`)
- **Descrição**: Retorna os totais estatísticos consolidados para o mês atual.
- **Resposta (200 OK)**:
  ```json
  {
    "pontualidade": 97,
    "horasTrabalhadas": "72h",
    "bancoHoras": "+3h"
  }
  ```

#### `GET /api/funcionario/ponto/registros`

- **Acesso**: Restrito (`EMPLOYEE`)
- **Parâmetros de Consulta (Query Params)**: `mes` (1-12, opcional), `ano` (opcional)
- **Resposta (200 OK)**:
  ```json
  [
    {
      "data": "Seg, 14 Abr",
      "diaSemana": "Seg",
      "status": "completo",
      "horasTrabalhadas": "8h02",
      "registros": [
        {
          "id": "1",
          "tipo": "entrada",
          "horario": "08:00",
          "data": "14 Abr",
          "modalidade": "Presencial"
        },
        {
          "id": "2",
          "tipo": "saida_intervalo",
          "horario": "12:05",
          "data": "14 Abr",
          "modalidade": "Pausa"
        },
        {
          "id": "3",
          "tipo": "retorno_intervalo",
          "horario": "13:06",
          "data": "14 Abr",
          "modalidade": "Presencial"
        },
        {
          "id": "4",
          "tipo": "saida",
          "horario": "17:01",
          "data": "14 Abr",
          "modalidade": "Presencial"
        }
      ]
    }
  ]
  ```

#### `POST /api/funcionario/ponto/registrar`

- **Acesso**: Restrito (`EMPLOYEE`)
- **Descrição**: Cria um novo registro de ponto com hora do servidor, geolocalização e modalidade.
- **Requisição (Body)**:
  ```json
  {
    "tipo": "entrada",
    "modalidade": "Presencial",
    "latitude": -26.9195,
    "longitude": -49.0661
  }
  ```
- **Resposta (201 Created)**:
  ```json
  {
    "id": "uuid-ponto-999",
    "tipo": "entrada",
    "horario": "08:02",
    "data": "13 de Abr",
    "modalidade": "Presencial",
    "status": "sucesso"
  }
  ```

#### `POST /api/funcionario/ponto/contestar`

- **Acesso**: Restrito (`EMPLOYEE`)
- **Descrição**: Abre um chamado de ajuste de falha ou esquecimento no ponto.
- **Requisição (Body)**:
  ```json
  {
    "dataFalta": "2026-05-10",
    "turno": "Manhã",
    "motivo": "Problema no transporte",
    "descricao": "O ônibus quebrou e atrasei para registrar a entrada.",
    "evidencias": ["url_comprovante_transporte.pdf"]
  }
  ```
- **Resposta (201 Created)**:
  ```json
  {
    "id": "uuid-contestacao-001",
    "status": "Pendente",
    "message": "Contestação enviada ao seu gestor!"
  }
  ```

#### `GET /api/funcionario/ferias/saldo`

- **Acesso**: Restrito (`EMPLOYEE`)
- **Descrição**: Obtém saldo de dias restantes e períodos aquisitivos de férias.
- **Resposta (200 OK)**:
  ```json
  {
    "diasDisponiveis": 30,
    "periodoAquisitivo": "Jan 2025 - Jan 2026",
    "venceEm": "8 meses",
    "abono": 10,
    "solicitacoes": [
      {
        "id": "1",
        "dataInicio": "01 jul",
        "dataFim": "20 jul 2025",
        "dias": 20,
        "status": "Aprovado"
      }
    ]
  }
  ```

#### `POST /api/funcionario/ferias/solicitar`

- **Acesso**: Restrito (`EMPLOYEE`)
- **Requisição (Body)**:
  ```json
  {
    "dataInicio": "2026-07-01",
    "dataFim": "2026-07-20",
    "venderDias": true,
    "diasVender": 10,
    "observacao": "Viagem marcada com família."
  }
  ```
- **Resposta (201 Created)**:
  ```json
  {
    "id": "uuid-solicitacao-ferias-2",
    "status": "Pendente",
    "message": "Solicitação de férias enviada com sucesso."
  }
  ```

#### `POST /api/funcionario/atestados/enviar`

- **Acesso**: Restrito (`EMPLOYEE`)
- **Descrição**: Envia um atestado médico (usualmente via Multipart Form Data).
- **Requisição (Multipart/Form-Data)**:
  - `arquivo`: Arquivo (PDF ou Imagem)
  - `dataConsulta`: "2026-04-22"
  - `diasAfastamento`: "2"
  - `observacao`: "Dor de cabeça e sinusite."
- **Resposta (201 Created)**:
  ```json
  {
    "id": "uuid-atestado-777",
    "arquivo": "atestado_consulta.jpg",
    "dataConsulta": "2026-04-22",
    "diasAfastamento": 2,
    "observacao": "Dor de cabeça e sinusite.",
    "status": "Pendente",
    "dataEnvio": "22/04/2026"
  }
  ```

---

### 4.3. Módulos Administrativos (Admin Only)

#### `GET /api/admin/resumo`

- **Acesso**: Restrito (`ADMIN`)
- **Descrição**: Informações gerais sobre o dia e pendências para o painel inicial.
- **Resposta (200 OK)**:
  ```json
  {
    "totalFuncionarios": 4,
    "presentesHoje": 3,
    "pendenciasAprovar": 2,
    "contestacoesAberto": 1
  }
  ```

#### `GET /api/admin/funcionarios`

- **Acesso**: Restrito (`ADMIN`)
- **Parâmetros de Consulta (Query Params)**: `busca` (para filtrar nome/cargo)
- **Resposta (200 OK)**:
  ```json
  [
    {
      "id": "1",
      "nome": "Nicole Ferreira",
      "cargo": "Desenvolvedora",
      "email": "nicole@empresa.com",
      "cpf": "123.456.789-00",
      "status": "Presente",
      "avatar": "NF",
      "horasTrabalhadas": "72h",
      "pontualidade": 97
    }
  ]
  ```

#### `POST /api/admin/funcionarios`

- **Acesso**: Restrito (`ADMIN`)
- **Descrição**: Cadastro de um novo colaborador na empresa vinculada.
- **Requisição (Body)**:
  ```json
  {
    "nome": "João da Silva",
    "email": "joao@empresa.com",
    "cpf": "000.000.000-00",
    "cargo": "Desenvolvedor",
    "senha": "senha_provisoria"
  }
  ```
- **Resposta (201 Created)**:
  ```json
  {
    "id": "uuid-joao-789",
    "nome": "João da Silva",
    "email": "joao@empresa.com",
    "message": "Funcionário cadastrado com sucesso!"
  }
  ```

#### `GET /api/admin/funcionarios/:id`

- **Acesso**: Restrito (`ADMIN`)
- **Descrição**: Detalhes completos de um funcionário específico, incluindo resumo e registros de ponto no período fornecido.
- **Parâmetros de Consulta (Query Params)**: `dataInicio` (ex: `2026-04-14`), `dataFim` (ex: `2026-04-22`)
- **Resposta (200 OK)**:
  ```json
  {
    "id": "1",
    "nome": "Nicole Ferreira",
    "cargo": "Desenvolvedora",
    "email": "nicole@empresa.com",
    "cpf": "123.456.789-00",
    "status": "Presente",
    "avatar": "NF",
    "pontualidade": 97,
    "bancoHoras": "+3h",
    "admissao": "01/03/2024",
    "horasTrabalhadas": "72h",
    "registros": [
      {
        "data": "Seg, 14 Abr",
        "dataISO": "2026-04-14",
        "horas": "8h02",
        "status": "completo",
        "lat": -26.9195,
        "lng": -49.0661,
        "pontos": [
          "08:00 entrada",
          "12:05 pausa",
          "13:06 retorno",
          "17:01 saída"
        ]
      }
    ]
  }
  ```

#### `GET /api/admin/ferias`

- **Acesso**: Restrito (`ADMIN`)
- **Parâmetros de Consulta (Query Params)**: `filtro` (`Todos`, `Pendente`, `Aprovado`, `Reprovado`)
- **Resposta (200 OK)**:
  ```json
  [
    {
      "id": "1",
      "funcionario": "Nicole Ferreira",
      "avatar": "NF",
      "cargo": "Desenvolvedora",
      "dataInicio": "01/07/2026",
      "dataFim": "20/07/2026",
      "dias": 20,
      "abono": true,
      "diasAbono": 10,
      "observacao": "Viagem marcada",
      "status": "Pendente"
    }
  ]
  ```

#### `PUT /api/admin/ferias/:id`

- **Acesso**: Restrito (`ADMIN`)
- **Descrição**: Altera o status da solicitação de férias.
- **Requisição (Body)**:
  ```json
  {
    "status": "Aprovado" // ou "Reprovado"
  }
  ```
- **Resposta (200 OK)**:
  ```json
  {
    "id": "1",
    "status": "Aprovado",
    "message": "Férias aprovadas e funcionário notificado."
  }
  ```

#### `GET /api/admin/atestados`

- **Acesso**: Restrito (`ADMIN`)
- **Parâmetros de Consulta (Query Params)**: `filtro` (`Todos`, `Pendente`, `Aprovado`, `Reprovado`)
- **Resposta (200 OK)**:
  ```json
  [
    {
      "id": "1",
      "funcionario": "Nicole Ferreira",
      "avatar": "NF",
      "cargo": "Analista de RH",
      "periodoInicio": "16/04/2026",
      "periodoFim": "17/04/2026",
      "diasAfastamento": 2,
      "dataEnvio": "16/04/2026",
      "observacao": "Gripe forte com febre",
      "status": "Pendente"
    }
  ]
  ```

#### `PUT /api/admin/atestados/:id`

- **Acesso**: Restrito (`ADMIN`)
- **Descrição**: Altera o status da solicitação de atestado médico.
- **Requisição (Body)**:
  ```json
  {
    "status": "Reprovado",
    "motivoReprovacao": "Consulta de rotina não justifica afastamento." // Obrigatório se status for Reprovado
  }
  ```
- **Resposta (200 OK)**:
  ```json
  {
    "id": "1",
    "status": "Reprovado",
    "motivoReprovacao": "Consulta de rotina não justifica afastamento."
  }
  ```

#### `GET /api/admin/contestacoes`

- **Acesso**: Restrito (`ADMIN`)
- **Parâmetros de Consulta (Query Params)**: `filtro` (`Todos`, `Pendente`, `Aceita`, `Recusada`)
- **Resposta (200 OK)**:
  ```json
  [
    {
      "id": "1",
      "funcionario": "Lucas Andrade",
      "avatar": "LA",
      "cargo": "Técnico de TI",
      "dataFalta": "10/05/2026",
      "turno": "Manhã",
      "motivo": "Problema no transporte",
      "descricao": "O ônibus da linha 301 não circulou por conta de greve.",
      "evidencias": ["url_do_arquivo.pdf"],
      "dataAbertura": "11/05/2026",
      "diasAbertos": 1,
      "status": "Pendente"
    }
  ]
  ```

#### `PUT /api/admin/contestacoes/:id`

- **Acesso**: Restrito (`ADMIN`)
- **Descrição**: Aceita ou recusa a contestação do funcionário.
- **Requisição (Body)**:
  ```json
  {
    "status": "Recusada",
    "motivoRecusa": "Falta de comprovante válido para o dia selecionado." // Obrigatório se status for Recusada
  }
  ```
- **Resposta (200 OK)**:
  ```json
  {
    "id": "1",
    "status": "Recusada",
    "motivoRecusa": "Falta de comprovante válido para o dia selecionado."
  }
  ```

---

## 5. Regras de Negócio Importantes (Backend Logic)

1. **Jornada de Trabalho e Horas Trabalhadas**:

   - O backend deve implementar uma rotina para calcular a diferença de tempo entre os registros diários (ex: `entrada` -> `saida_intervalo` e `retorno_intervalo` -> `saida`).
   - O tempo trabalhado além da jornada cadastrada deve ir para o **Banco de Horas** do funcionário. O atraso ou horas negativas devem ser deduzidos desse saldo.
   - O cálculo do status do dia (`completo`, `atraso`, `em_andamento`) deve ser automatizado conforme o cumprimento da jornada diária definida.

2. **Validação de Ponto por Geolocalização**:

   - Ao bater ponto, o backend deve comparar as coordenadas enviadas (`latitude` e `longitude`) com a localização oficial cadastrada para o funcionário ou filial (opcional, dependendo do modelo de cerca virtual).
   - Se o ponto for em modalidade "Presencial" e fora da cerca virtual (ex: raio de 100 metros), o backend pode levantar um aviso ou impedir o registro. Se for "Remoto", o registro é livre, registrando as coordenadas reais do momento.

3. **Validação de Solicitação de Férias**:

   - O funcionário só pode solicitar férias se tiver saldo acumulado suficiente (`diasDisponiveis`).
   - O abono pecuniário (venda de dias de férias) é limitado por lei a no máximo 1/3 do período que tem direito (máximo de 10 dias).

4. **Gerenciamento de Arquivos**:
   - Os endpoints de upload de Atestado e Evidências de contestação devem receber o arquivo, armazená-lo em nuvem/disco e salvar a URL permanente na tabela correspondente.
   - É recomendável limitar o tamanho máximo a 10MB por arquivo e validar os formatos (`PDF`, `JPG`, `PNG`).
