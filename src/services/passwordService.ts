/**
 * Serviço para geração de senhas seguras
 */

export interface PasswordConfig {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

const DEFAULT_CONFIG: PasswordConfig = {
  length: 12,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
};

// Caracteres disponíveis (evitando ambíguos como 0, O, l, I)
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnpqrstuvwxyz';
const NUMBERS = '23456789';
const SYMBOLS = '!@#$%&*+-=?';

/**
 * Gera uma senha segura baseada na configuração fornecida
 */
export function generateSecurePassword(config: Partial<PasswordConfig> = {}): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  let charset = '';
  let requiredChars = '';
  
  if (finalConfig.includeUppercase) {
    charset += UPPERCASE;
    requiredChars += getRandomChar(UPPERCASE);
  }
  
  if (finalConfig.includeLowercase) {
    charset += LOWERCASE;
    requiredChars += getRandomChar(LOWERCASE);
  }
  
  if (finalConfig.includeNumbers) {
    charset += NUMBERS;
    requiredChars += getRandomChar(NUMBERS);
  }
  
  if (finalConfig.includeSymbols) {
    charset += SYMBOLS;
    requiredChars += getRandomChar(SYMBOLS);
  }
  
  if (charset.length === 0) {
    throw new Error('Pelo menos um tipo de caractere deve ser incluído');
  }
  
  // Gerar caracteres restantes
  const remainingLength = finalConfig.length - requiredChars.length;
  let password = requiredChars;
  
  for (let i = 0; i < remainingLength; i++) {
    password += getRandomChar(charset);
  }
  
  // Embaralhar a senha para evitar padrões previsíveis
  return shuffleString(password);
}

/**
 * Obtém um caractere aleatório de uma string usando crypto.getRandomValues
 */
function getRandomChar(str: string): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return str[array[0] % str.length];
}

/**
 * Embaralha uma string usando algoritmo Fisher-Yates
 */
function shuffleString(str: string): string {
  const array = str.split('');
  
  for (let i = array.length - 1; i > 0; i--) {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const j = randomArray[0] % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array.join('');
}

/**
 * Valida se uma senha atende aos critérios mínimos de segurança
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
    feedback.push('Senha deve ter pelo menos 12 caracteres para máxima segurança');
  } else {
    feedback.push('Senha muito curta (mínimo 8 caracteres)');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos uma letra maiúscula');
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos uma letra minúscula');
  }
  
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos um número');
  }
  
  if (/[!@#$%&*+\-=?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos um símbolo');
  }
  
  return {
    isValid: score >= 4,
    score,
    feedback,
  };
}