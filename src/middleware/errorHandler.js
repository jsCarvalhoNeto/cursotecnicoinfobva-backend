// Middleware de tratamento de erros
export const errorHandler = (err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  // Log mais detalhado para debugging
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  // Determinar status code apropriado
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    error: {
      message: err.message || 'Erro interno do servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
