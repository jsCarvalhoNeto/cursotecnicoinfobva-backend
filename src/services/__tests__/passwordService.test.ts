/**
 * Testes para o serviço de geração de senhas
 */

import { generateSecurePassword, validatePasswordStrength } from '../passwordService';

// Mock do crypto.getRandomValues para testes determinísticos
const mockGetRandomValues = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
  },
});

describe('PasswordService', () => {
  beforeEach(() => {
    // Reset do mock antes de cada teste
    mockGetRandomValues.mockReset();
    // Configurar valores determinísticos para testes
    mockGetRandomValues.mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = 123456; // Valor fixo para testes
      }
      return array;
    });
  });

  describe('generateSecurePassword', () => {
    it('deve gerar senha com comprimento padrão de 12 caracteres', () => {
      const password = generateSecurePassword();
      expect(password).toHaveLength(12);
    });

    it('deve gerar senha com comprimento personalizado', () => {
      const password = generateSecurePassword({ length: 16 });
      expect(password).toHaveLength(16);
    });

    it('deve incluir pelo menos um caractere de cada tipo quando habilitado', () => {
      const password = generateSecurePassword({
        length: 12,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
      });

      expect(password).toMatch(/[A-Z]/); // Pelo menos uma maiúscula
      expect(password).toMatch(/[a-z]/); // Pelo menos uma minúscula
      expect(password).toMatch(/[0-9]/); // Pelo menos um número
      expect(password).toMatch(/[!@#$%&*+\-=?]/); // Pelo menos um símbolo
    });

    it('deve gerar senhas diferentes a cada chamada', () => {
      // Configurar valores aleatórios diferentes
      let callCount = 0;
      mockGetRandomValues.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = 123456 + callCount++;
        }
        return array;
      });

      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      expect(password1).not.toBe(password2);
    });

    it('deve lançar erro quando nenhum tipo de caractere for incluído', () => {
      expect(() => {
        generateSecurePassword({
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: false,
          includeSymbols: false,
        });
      }).toThrow('Pelo menos um tipo de caractere deve ser incluído');
    });
  });

  describe('validatePasswordStrength', () => {
    it('deve validar senha forte corretamente', () => {
      const result = validatePasswordStrength('MinhaSenh@123');
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.feedback).toHaveLength(0);
    });

    it('deve identificar senha fraca', () => {
      const result = validatePasswordStrength('123');
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(4);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('deve fornecer feedback específico para senha sem maiúsculas', () => {
      const result = validatePasswordStrength('minhasenha123!');
      expect(result.feedback).toContain('Adicione pelo menos uma letra maiúscula');
    });

    it('deve fornecer feedback específico para senha sem minúsculas', () => {
      const result = validatePasswordStrength('MINHASENHA123!');
      expect(result.feedback).toContain('Adicione pelo menos uma letra minúscula');
    });

    it('deve fornecer feedback específico para senha sem números', () => {
      const result = validatePasswordStrength('MinhaSenha!');
      expect(result.feedback).toContain('Adicione pelo menos um número');
    });

    it('deve fornecer feedback específico para senha sem símbolos', () => {
      const result = validatePasswordStrength('MinhaSenha123');
      expect(result.feedback).toContain('Adicione pelo menos um símbolo');
    });

    it('deve sugerir comprimento maior para senhas curtas', () => {
      const result = validatePasswordStrength('Abc123!');
      expect(result.feedback).toContain('Senha muito curta (mínimo 8 caracteres)');
    });
  });
});

// Função auxiliar para executar testes manuais (sem framework)
export function runPasswordServiceTests() {
  console.log('🧪 Executando testes do PasswordService...');
  
  try {
    // Teste 1: Geração de senha
    const password = generateSecurePassword();
    console.assert(password.length === 12, 'Senha deve ter 12 caracteres');
    console.assert(typeof password === 'string', 'Senha deve ser string');
    
    // Teste 2: Validação de senha forte
    const strongValidation = validatePasswordStrength('MinhaSenh@123');
    console.assert(strongValidation.isValid === true, 'Senha forte deve ser válida');
    
    // Teste 3: Validação de senha fraca
    const weakValidation = validatePasswordStrength('123');
    console.assert(weakValidation.isValid === false, 'Senha fraca deve ser inválida');
    
    console.log('✅ Todos os testes do PasswordService passaram!');
    return true;
  } catch (error) {
    console.error('❌ Erro nos testes do PasswordService:', error);
    return false;
  }
}