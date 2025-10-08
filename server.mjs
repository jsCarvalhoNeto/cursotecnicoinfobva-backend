import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4002; // Porta local configurada para 4002

// Middleware para Content Security Policy
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://r2cdn.perplexity.ai https://fonts.gstatic.com https://fonts.googleapis.com https://*.gstatic.com; connect-src 'self' https:; frame-src 'self'; object-src 'none';");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Configurações do CORS para permitir requisições do seu frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Servir arquivos estáticos do diretório dist (build do frontend)
app.use(express.static(path.join(__dirname, '../dist')));

// Rota para servir o index.html para todas as rotas que não são API
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    // Se for uma rota da API, continue normalmente
    next();
  } else {
    // Para todas as outras rotas, sirva o index.html
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  }
});

// Configuração da conexão com o banco de dados
console.log('Banco de dados configurado:', process.env.DB_NAME);
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Senha vazia para phpMyAdmin
  database: process.env.DB_NAME || 'josedo64_sisctibalbina',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Rota de teste
app.get('/api', (req, res) => {
  res.send('API do Portal do Curso Técnico está funcionando!');
});

// Remover as rotas antigas que agora estão nos módulos
// As rotas de subjects, students, teachers, users e activities agora são gerenciadas pelos arquivos de rotas modulares

// Importar middlewares e controllers
import { transactionMiddleware } from './src/middleware/database.js';
import { requireAuth, requireStudent, requireTeacher } from './src/middleware/auth.js';
import { authController } from './src/controllers/authController.js';
import { getActivitiesByStudent, getActivitiesBySubject, createActivity, getActivityById, getActivitiesByTeacher, updateActivity, deleteActivity, submitStudentActivity, getActivityGrades, deleteActivityGrade, updateActivityGrade, createActivityGrade, getActivityGradesByStudent } from './src/controllers/activityController.js';


// Rotas de atividades
app.get('/api/activities/student', requireAuth, requireStudent, getActivitiesByStudent);
app.get('/api/activities/teacher/:teacherId', requireAuth, requireTeacher, getActivitiesByTeacher);
app.get('/api/activities/subject/:subjectId', requireAuth, getActivitiesBySubject);
app.get('/api/activities/:id/grades', requireAuth, requireTeacher, getActivityGrades);
app.get('/api/activities/:id', requireAuth, getActivityById);
app.post('/api/activities', requireAuth, requireTeacher, transactionMiddleware, createActivity);
app.put('/api/activities/:id', requireAuth, requireTeacher, transactionMiddleware, updateActivity);
app.delete('/api/activities/:id', requireAuth, requireTeacher, transactionMiddleware, deleteActivity);
app.post('/api/activities/student-activities', requireAuth, requireStudent, transactionMiddleware, submitStudentActivity);
app.put('/api/activities/activity-grades/:id', requireAuth, requireTeacher, transactionMiddleware, updateActivityGrade);
app.post('/api/activities/activity-grades', requireAuth, requireTeacher, transactionMiddleware, createActivityGrade);
app.delete('/api/activities/activity-grades/:id', requireAuth, requireTeacher, transactionMiddleware, deleteActivityGrade);
app.get('/api/activities/student/grades', requireAuth, requireStudent, getActivityGradesByStudent);

// Importar rotas modulares
import subjectRoutes from './src/routes/subjects.js';
import studentRoutes from './src/routes/students.js';
import teacherRoutes from './src/routes/teachers.js';
import userRoutes from './src/routes/users.js';
import activityRoutes from './src/routes/activities.js';
import authRoutes from './src/routes/auth.js';

// Usar rotas modulares
app.use('/api/subjects', requireAuth, subjectRoutes);
app.use('/api/students', requireAuth, studentRoutes);
app.use('/api/teachers', requireAuth, teacherRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/activities', requireAuth, activityRoutes);
app.use('/api', authRoutes);

// Middleware para verificar autenticação (opcional) - mantido para compatibilidade
// Agora usamos o middleware do src/middleware/auth.js que está sendo importado acima
// Este middleware duplicado será removido pois já está definido em auth.js

// Aplicar middleware de autenticação às rotas que precisam de login
// app.use('/api/protected', requireAuth); // Exemplo de uso

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
