import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import subjectRoutes from './routes/subjects.js';
import userRoutes from './routes/users.js';
import activityRoutes from './routes/activities.js';
import contentRoutes from './routes/content.js';
import resourceRoutes from './routes/resources.js';
import contactRoutes from './routes/contacts.js';

import { errorHandler } from './middleware/errorHandler.js';
import { dbConnectionMiddleware, transactionMiddleware } from './middleware/database.js';

dotenv.config();

// Obter o diretório atual (equivalente ao __dirname do CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4002;

// Configurações do CORS - mais flexíveis para produção no Railway
const allowedOrigins = [
  'http://localhost:3000', // React dev server
  'http://localhost:4002', // dev local
  'http://localhost:5173', // Vite dev server
  'http://localhost:8080', // possível frontend
  process.env.CORS_ORIGIN, // Variável de ambiente adicional
  'https://cursotecnicoinfobva.up.railway.app', // Domínio do frontend no Railway (antigo)
  'https://infobva.up.railway.app', // Domínio do frontend no Railway (novo)
  'https://cursotecnicoinfobva-backend-production.up.railway.app', // Domínio do backend no Railway
  'https://cursotecnicoinfobva-frontend-production.up.railway.app', // Domínio do frontend no Railway (corrigido)
  'https://*.railway.app', // Permitir qualquer subdomínio do Railway
  'https://*.up.railway.app' // Permitir qualquer subdomínio up.railway.app
].filter(Boolean); // Remove undefined values

console.log('🌐 CORS - Origens permitidas:', allowedOrigins);

// Middleware CORS mais permissivo para produção
app.use(cors({
  origin: (origin, callback) => {
    console.log('🔍 CORS - Verificando origem:', origin);
    
    // Allow requests with no origin (mobile apps, curl, etc.) or when NODE_ENV is not set properly
    if (!origin || origin === 'null' || origin === 'undefined') {
      console.log('✅ CORS - Permitindo requisição sem origem (possivelmente requisição direta ou proxy)');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS - Origem permitida:', origin);
      return callback(null, true);
    }
    
    // For development, be more permissive with localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      console.log('✅ CORS - Permitindo localhost em desenvolvimento:', origin);
      return callback(null, true);
    }
    
    // Allow Railway domains (production) - mais flexível
    if (origin.includes('railway.app') || origin.includes('up.railway.app')) {
      console.log('✅ CORS - Permitindo domínio Railway:', origin);
      return callback(null, true);
    }
    
    // Verificar se é uma requisição proxy (como parece estar acontecendo no Railway)
    if (origin.includes('infobva.up.railway.app') && origin.includes('cursotecnicoinfobva-backend-production.up.railway.app')) {
      console.log('✅ CORS - Permitindo requisição proxy Railway:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS - Origem não permitida:', origin);
    console.log('📋 CORS - Origens válidas:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'X-Forwarded-Host', 'X-Real-IP'],
  exposedHeaders: ['Set-Cookie', 'Content-Length', 'Content-Type', 'X-Requested-With', 'Location'],
  optionsSuccessStatus: 200
}));

// Middleware para lidar com requisições proxy do Railway
app.use((req, res, next) => {
  // Verificar se é uma requisição proxy
  const forwardedHost = req.get('X-Forwarded-Host');
  const realHost = req.get('Host');
  const originalUrl = req.originalUrl;
  
  console.log('🔄 Proxy - Host original:', realHost);
  console.log('🔄 Proxy - X-Forwarded-Host:', forwardedHost);
  console.log('🔄 Proxy - URL original:', originalUrl);
  
  // Se houver problema de proxy, tentar corrigir
  if (forwardedHost && originalUrl.includes('cursotecnicoinfobva-backend-production.up.railway.app')) {
    // Remover o domínio do backend da URL original se estiver incorretamente incluído
    const correctedUrl = originalUrl.replace(/cursotecnicoinfobva-backend-production\.up\.railway\.app/, '');
    if (correctedUrl !== originalUrl) {
      console.log('🔄 Proxy - URL corrigida:', correctedUrl);
      req.originalUrl = correctedUrl;
      req.url = correctedUrl;
    }
  }
  
  next();
});

// Middleware para parsing JSON e cookies
app.use(express.json());
app.use(cookieParser());

// Servir arquivos estáticos da pasta public
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Middleware de conexão com banco de dados - aplicar apenas após rotas de autenticação
// para evitar problemas com transações em operações de login/logout

// Rotas de autenticação (sem middleware de transação)
app.use('/api/auth', authRoutes);

// Aplicar middleware de banco de dados para outras rotas
app.use(dbConnectionMiddleware);
app.use(transactionMiddleware);

// Outras rotas (com middleware de transação)
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/contacts', contactRoutes);

// Rota de contato também sem transação (como antes)
app.use('/api', contactRoutes); // Mantém esta para compatibilidade

// Rota de teste
app.get('/api', (req, res) => {
  res.send('API do Portal do Curso Técnico está funcionando!');
});

// Middleware de tratamento de erros
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

export default app;
