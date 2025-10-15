// Serviço de cache em memória para otimizar consultas frequentes
class CacheService {
  constructor() {
    this.cache = new Map();
    this.timers = new Map(); // Para gerenciar timeouts de expiração
  }

  /**
   * Armazena um valor no cache com tempo de expiração
   * @param {string} key - Chave para identificar o valor
   * @param {*} value - Valor a ser armazenado
   * @param {number} ttl - Tempo de vida em milissegundos (padrão: 5 minutos)
   */
  set(key, value, ttl = 5 * 60 * 1000) { // 5 minutos padrão
    // Remove o timeout anterior se existir
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    // Armazena o valor
    this.cache.set(key, value);

    // Define o timeout para expiração
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  /**
   * Recupera um valor do cache
   * @param {string} key - Chave para identificar o valor
   * @returns {*} Valor armazenado ou undefined se não existir ou expirado
   */
  get(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    return undefined;
  }

  /**
   * Remove um valor do cache
   * @param {string} key - Chave para identificar o valor
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }

  /**
   * Verifica se uma chave existe no cache
   * @param {string} key - Chave para verificar
   * @returns {boolean} true se existir, false caso contrário
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Retorna o tamanho do cache
   * @returns {number} Número de itens no cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Retorna estatísticas do cache
   * @returns {Object} Estatísticas do cache
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timers: this.timers.size
    };
  }
}

// Instância singleton do cache
const cacheService = new CacheService();

// Função para criar chave de cache baseada em parâmetros
function createCacheKey(prefix, params = {}) {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${prefix}:${paramString}`;
}

// Função para adicionar cache a uma função de banco de dados
async function withCache(key, fetchFunction, ttl = 5 * 60 * 1000) {
  const cachedValue = cacheService.get(key);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const value = await fetchFunction();
  cacheService.set(key, value, ttl);
  return value;
}

export { cacheService, createCacheKey, withCache };
export default cacheService;
