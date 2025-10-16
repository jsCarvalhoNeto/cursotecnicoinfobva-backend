// Função para parsear a DATABASE_URL e extrair os componentes
export function parseDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: url.port || '3306', // MySQL default port
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1) // Remove the leading '/'
    };
  } catch (error) {
    console.error('Erro ao parsear DATABASE_URL:', error);
    throw new Error('Formato inválido de DATABASE_URL');
  }
}
