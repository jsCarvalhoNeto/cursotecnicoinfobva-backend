
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

// Middleware GLOBAL para lidar com requisições proxy do Railway - deve ser o PRIMEIRO
app.use((req, res, next) => {
  const originalUrl = req.originalUrl;
  const forwardedHost = req.get('X-Forwarded-Host');
  const realHost = req.get('Host');
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  
  console.log('🔄 Proxy Global - Host original:', realHost);
  console.log('🔄 Proxy Global - X-Forwarded-Host:', forwardedHost);
  console.log('🔄 Proxy Global - URL original:', originalUrl);
  console.log('🔄 Proxy Global - URL completa:', fullUrl);
  
  // Apenas aplicar correções específicas para os padrões conhecidos problemáticos
  // e apenas para rotas de autenticação que estão com problemas específicos
  if (originalUrl.includes('infobva.up.railway.app') && originalUrl.includes('cursotecnicoinfobva-backend-production.up.railway.app')) {
    console.log('🔄 Detectado padrão de proxy do Railway com domínios combinados:', originalUrl);
    
    // Extrair a rota real de autenticação
    const authMatch = originalUrl.match(/\/auth\/(login|logout|register|me)/);
    if (authMatch) {
      const authEndpoint = authMatch[0];
      console.log('🔄 Detectada rota de autenticação mal formada:', authEndpoint);
      
      // Corrigir a URL para o formato correto /api/auth/endpoint
      const correctedUrl = '/api' + authEndpoint;
      console.log('🔄 URL corrigida para:', correctedUrl);
      
      // Atualizar a URL da requisição e continuar normalmente
      // Isso permite que o middleware de banco de dados seja aplicado
      req.url = correctedUrl;
      req.originalUrl = correctedUrl;
      next();
      return;
    }
  }
  
  next();
});

// Middleware para parsing JSON e cookies
app.use(express.json());
app.use(cookieParser());

// Servir arquivos estáticos da pasta public
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Aplicar middleware de banco de dados para todas as rotas, exceto autenticação
app.use(dbConnectionMiddleware);
app.use(transactionMiddleware);

// Rotas de autenticação (com middleware de banco de dados, mas sem transação)
// O middleware de conexão agora detecta rotas de autenticação e não inicia transação
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);


// Rotas de fallback para lidar com URLs mal formadas do proxy do Railway
app.all('/cursotecnicoinfobva-backend-production.up.railway.app/*', (req, res) => {
  console.log('🔄 Rota de fallback acionada para:', req.originalUrl);
  
  // Extrair a rota real da URL mal formada
  const pathMatch = req.originalUrl.match(/\/cursotecnicoinfobva-backend-production\.up\.railway\.app(\/.*)$/);
  if (pathMatch) {
    const realPath = pathMatch[1];
    console.log('🔄 Redirecionando para rota real:', realPath);
    
    // Determinar o método correto encaminhar para a rota apropriada
    if (realPath.startsWith('/api/auth/')) {
      // É uma rota de autenticação
      if (req.method === 'POST' && realPath.includes('/auth/login')) {
        authRoutes(req, res);
      } else if (req.method === 'POST' && realPath.includes('/auth/logout')) {
        authRoutes(req, res);
      } else if (req.method === 'POST' && realPath.includes('/auth/register')) {
        authRoutes(req, res);
      } else if (req.method === 'GET' && realPath.includes('/auth/me')) {
        authRoutes(req, res);
      } else {
        res.status(404).json({ error: 'Rota não encontrada' });
      }
    } else {
      // Para outras rotas, tentar determinar o tipo
      if (realPath.startsWith('/api/students/')) {
        studentRoutes(req, res);
      } else if (realPath.startsWith('/api/teachers/')) {
        teacherRoutes(req, res);
      } else if (realPath.startsWith('/api/subjects/')) {
        subjectRoutes(req, res);
      } else if (realPath.startsWith('/api/users/')) {
        userRoutes(req, res);
      } else if (realPath.startsWith('/api/activities/')) {
        activityRoutes(req, res);
      } else if (realPath.startsWith('/api/content/')) {
        contentRoutes(req, res);
      } else if (realPath.startsWith('/api/resources/')) {
        resourceRoutes(req, res);
      } else if (realPath.startsWith('/api/contacts/')) {
        contactRoutes(req, res);
      } else {
        res.status(404).json({ error: 'Rota não encontrada' });
      }
    }
  } else {
    res.status(404).json({ error: 'Rota não encontrada' });
  }
});

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
