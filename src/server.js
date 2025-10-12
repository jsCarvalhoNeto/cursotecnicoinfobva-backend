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

// Configurações do CORS
const allowedOrigins = [
  'http://localhost:3000', // React dev server
  'http://localhost:4002', // dev local
  'http://localhost:5173', // Vite dev server
  'http://localhost:8080', // possível frontend
  process.env.CORS_ORIGIN, // Variável de ambiente adicional
  'https://cursotecnicobva.up.railway.app', // Domínio do frontend no Railway
  'https://cursotecnicobva-backend-production.up.railway.app' // Domínio do backend no Railway
].filter(Boolean); // Remove undefined values

console.log('🌐 CORS - Origens permitidas:', allowedOrigins);

// Middleware CORS mais permissivo para produção
app.use(cors({
  origin: (origin, callback) => {
    console.log('🔍 CORS - Verificando origem:', origin);
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      console.log('✅ CORS - Permitindo requisição sem origem');
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
    
    // Permitir qualquer subdomínio railway.app em produção
    if (process.env.NODE_ENV === 'production' && (origin.includes('.railway.app') || origin.includes('railway.app'))) {
      console.log('✅ CORS - Permitindo subdomínio Railway em produção:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS - Origem não permitida:', origin);
    console.log('📋 CORS - Origens válidas:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie', 'Content-Length', 'Content-Type', 'X-Requested-With']
}));

// Middleware para parsing JSON e cookies
app.use(express.json());
app.use(cookieParser());

// Servir arquivos estáticos da pasta public
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Middleware de conexão com banco de dados
app.use(dbConnectionMiddleware);
app.use(transactionMiddleware);

// Rotas
app.use('/api', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api', contactRoutes);

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
