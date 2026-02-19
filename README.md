# STRIDE Analyzer - Backend API

API backend para análise de ameaças STRIDE utilizando Inteligência Artificial (OpenAI GPT-4 Vision).

## 📋 Visão Geral

O backend do STRIDE Analyzer é uma API RESTful construída em Node.js que processa diagramas de arquitetura e realiza análises de segurança automatizadas usando a metodologia STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).

## 🏗️ Arquitetura

```
stride_backend/
├── src/
│   ├── server.js              # Servidor Express e configuração
│   ├── cleanup.js             # Script de limpeza do banco de dados
│   ├── database/
│   │   └── db.js              # Configuração do SQLite
│   ├── routes/
│   │   └── analysis.js        # Rotas da API
│   └── services/
│       ├── diagramAnalyzer.js # Análise de diagramas com IA
│       ├── threatAnalyzer.js  # Análise de ameaças STRIDE
│       ├── jobProcessor.js    # Processamento assíncrono
│       ├── jobService.js      # Gerenciamento de jobs
│       └── openaiClient.js    # Cliente OpenAI
├── data/                      # Banco de dados SQLite
├── uploads/                   # Diagramas enviados
└── package.json
```

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Better-SQLite3** - Banco de dados SQLite
- **OpenAI API** - Análise com GPT-4 Vision
- **Multer** - Upload de arquivos
- **UUID** - Geração de IDs únicos
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Gerenciamento de variáveis de ambiente

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ instalado
- Chave de API da OpenAI
- npm ou yarn

### Passos

1. Clone o repositório e navegue até a pasta do backend:
```bash
cd stride_backend
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto:
```env
# OpenAI Configuration
OPENAI_API_KEY=sua-chave-api-aqui
OPENAI_MODEL=gpt-4o

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_PATH=./data/jobs.db
```

4. Inicie o servidor:

**Desenvolvimento (com hot-reload):**
```bash
npm run dev
```

**Produção:**
```bash
npm start
```

O servidor estará disponível em `http://localhost:3001`

## 🔌 API Endpoints

### 1. Health Check
```http
GET /api/health
```
Verifica se a API está funcionando.

**Resposta:**
```json
{
  "status": "ok",
  "message": "STRIDE Analyzer API is running",
  "timestamp": "2026-02-12T10:30:00.000Z"
}
```

### 2. Criar Análise
```http
POST /api/analysis/analyze
Content-Type: multipart/form-data
```

**Parâmetros:**
- `diagram` (file) - Imagem do diagrama (PNG, JPG, GIF)
- `systemName` (string) - Nome do sistema

**Resposta:**
```json
{
  "jobId": "uuid-do-job",
  "message": "Analysis job created successfully"
}
```

### 3. Consultar Status do Job
```http
GET /api/analysis/job/:jobId
```

**Resposta (Processing):**
```json
{
  "status": "processing",
  "jobId": "uuid-do-job",
  "systemName": "Nome do Sistema",
  "createdAt": 1707734400000
}
```

**Resposta (Completed):**
```json
{
  "status": "completed",
  "jobId": "uuid-do-job",
  "systemName": "Nome do Sistema",
  "data": {
    "system_name": "Nome do Sistema",
    "architecture": {
      "description": "...",
      "components": [...],
      "data_flows": [...],
      "trust_boundaries": [...]
    },
    "threats": [...],
    "summary": "...",
    "diagram_image": "data:image/png;base64,..."
  }
}
```

### 4. Listar Jobs
```http
GET /api/analysis/jobs?limit=50
```

**Resposta:**
```json
{
  "jobs": [
    {
      "jobId": "uuid",
      "systemName": "Sistema",
      "status": "completed",
      "createdAt": 1707734400000,
      "updatedAt": 1707734500000
    }
  ]
}
```

## 🔄 Fluxo de Processamento

1. **Upload**: Cliente envia diagrama via POST `/api/analysis/analyze`
2. **Job Creation**: Sistema cria um job com status "pending"
3. **Processamento Assíncrono**:
   - Status muda para "processing"
   - IA analisa o diagrama e identifica componentes
   - IA realiza análise STRIDE das ameaças
   - Resultados são salvos no banco de dados
4. **Conclusão**: Status muda para "completed" ou "failed"
5. **Polling**: Cliente consulta status periodicamente via GET `/api/analysis/job/:jobId`

## 🤖 Serviços de IA

### DiagramAnalyzer
Usa GPT-4 Vision para:
- Identificar componentes da arquitetura
- Detectar fluxos de dados
- Identificar limites de confiança (trust boundaries)

### ThreatAnalyzer
Aplica a metodologia STRIDE:
- **S**poofing (Falsificação de Identidade)
- **T**ampering (Adulteração)
- **R**epudiation (Repúdio)
- **I**nformation Disclosure (Divulgação de Informações)
- **D**enial of Service (Negação de Serviço)
- **E**levation of Privilege (Elevação de Privilégios)

Para cada ameaça identifica:
- Severidade (Critical, High, Medium, Low)
- Componentes afetados
- Cenário de ataque
- Estratégias de mitigação
- Referências

## 🗄️ Banco de Dados

### Tabela: jobs

| Campo         | Tipo    | Descrição                          |
|---------------|---------|-------------------------------------|
| id            | TEXT    | UUID do job (PK)                   |
| system_name   | TEXT    | Nome do sistema                     |
| status        | TEXT    | pending/processing/completed/failed |
| created_at    | INTEGER | Timestamp de criação                |
| updated_at    | INTEGER | Timestamp de atualização            |
| image_path    | TEXT    | Caminho do arquivo de imagem        |
| result_data   | TEXT    | JSON com resultados (quando completed) |
| error_message | TEXT    | Mensagem de erro (quando failed)    |

## 🧹 Manutenção

### Limpar Jobs Antigos
```bash
npm run cleanup
```

Este script:
- Remove jobs com mais de 7 dias
- Deleta arquivos de imagem órfãos
- Mantém o banco de dados otimizado

## 🔒 Segurança

- Validação de uploads (tipo e tamanho de arquivo)
- Sanitização de inputs
- CORS configurável
- Rate limiting recomendado para produção
- Armazenamento seguro de chaves API via variáveis de ambiente

## 🐛 Debug e Logs

O servidor emite logs detalhados:
```
🚀 Server running on port 3001
🔗 API available at http://localhost:3001
🏥 Health check: http://localhost:3001/api/health
✅ Database initialized at: /path/to/jobs.db
📝 Job created: abc-123
🚀 Starting background processing for job: abc-123
✅ Job abc-123 completed successfully
```

## 📝 Variáveis de Ambiente

| Variável      | Padrão                | Descrição                     |
|---------------|-----------------------|-------------------------------|
| OPENAI_API_KEY| (obrigatório)        | Chave da API OpenAI           |
| OPENAI_MODEL  | gpt-4o               | Modelo GPT a ser usado         |
| PORT          | 3001                 | Porta do servidor              |
| CORS_ORIGIN   | http://localhost:3000| Origem permitida para CORS     |
| DATABASE_PATH | ./data/jobs.db       | Caminho do banco de dados      |

## 🚨 Troubleshooting

### Erro: "OpenAI API key not configured"
Verifique se a variável `OPENAI_API_KEY` está configurada no arquivo `.env`

### Erro: "ENOENT: no such file or directory"
Execute `mkdir -p data uploads` para criar os diretórios necessários

### Jobs ficam em "processing" indefinidamente
- Verifique os logs do servidor
- Confirme se a API da OpenAI está respondendo
- Reinicie o servidor

