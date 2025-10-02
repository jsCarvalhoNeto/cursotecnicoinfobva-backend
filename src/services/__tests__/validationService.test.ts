/**
 * Testes para o serviço de validação
 */

import { 
  validateEmail, 
  validateStudentRegistration, 
  validateFullName,
  sanitizeStudentData 
} from '../validationService';

describe('ValidationService', () => {
  describe('validateEmail', () => {
    it('deve validar emails corretos', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('deve rejeitar emails inválidos', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..name@domain.com',
        'user@domain..com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('deve tratar espaços em branco', () => {
      expect(validateEmail('  test@example.com  ')).toBe(true);
      expect(validateEmail('   ')).toBe(false);
    });
  });

  describe('validateStudentRegistration', () => {
    it('deve validar matrículas corretas', () => {
      const validRegistrations = [
        'EST2024001',
        'ABC123',
        'STUDENT2024',
        '123456789012345678901' // 20 caracteres
      ];

      validRegistrations.forEach(registration => {
        expect(validateStudentRegistration(registration)).toBe(true);
      });
    });

    it('deve rejeitar matrículas inválidas', () => {
      const invalidRegistrations = [
        'ABC12', // Muito curta (5 caracteres)
        'ABC123456789012345678901', // Muito longa (21+ caracteres)
        'ABC-123', // Contém hífen
        'ABC 123', // Contém espaço
        'ABC@123', // Contém símbolo
        ''
      ];

      invalidRegistrations.forEach(registration => {
        expect(validateStudentRegistration(registration)).toBe(false);
      });
    });

    it('deve tratar espaços em branco', () => {
      expect(validateStudentRegistration('  EST2024001  ')).toBe(true);
      expect(validateStudentRegistration('   ')).toBe(false);
    });
  });

  describe('validateFullName', () => {
    it('deve validar nomes corretos', () => {
      const validNames = [
        'João Silva',
        'Maria da Silva Santos',
        'José',
        'Ana Beatriz de Oliveira e Silva'
      ];

      validNames.forEach(name => {
        expect(validateFullName(name)).toBe(true);
      });
    });

    it('deve rejeitar nomes inválidos', () => {
      const invalidNames = [
        'A', // Muito curto
        '', // Vazio
        'A'.repeat(101), // Muito longo (101 caracteres)
      ];

      invalidNames.forEach(name => {
        expect(validateFullName(name)).toBe(false);
      });
    });

    it('deve tratar espaços em branco', () => {
      expect(validateFullName('  João Silva  ')).toBe(true);
      expect(validateFullName('   ')).toBe(false);
    });
  });

  describe('sanitizeStudentData', () => {
    it('deve sanitizar dados corretamente', () => {
      const input = {
        fullName: '  João Silva  ',
        email: '  JOAO@EXAMPLE.COM  ',
        studentRegistration: '  est2024001  '
      };

      const result = sanitizeStudentData(input);

      expect(result).toEqual({
        fullName: 'João Silva',
        email: 'joao@example.com',
        studentRegistration: 'EST2024001'
      });
    });

    it('deve manter dados já limpos inalterados', () => {
      const input = {
        fullName: 'João Silva',
        email: 'joao@example.com',
        studentRegistration: 'EST2024001'
      };

      const result = sanitizeStudentData(input);
      expect(result).toEqual(input);
    });
  });
});

// Função auxiliar para executar testes manuais (sem framework)
export function runValidationServiceTests() {
  console.log('🧪 Executando testes do ValidationService...');
  
  try {
    // Teste 1: Validação de email
    console.assert(validateEmail('test@example.com') === true, 'Email válido deve passar');
    console.assert(validateEmail('invalid-email') === false, 'Email inválido deve falhar');
    
    // Teste 2: Validação de matrícula
    console.assert(validateStudentRegistration('EST2024001') === true, 'Matrícula válida deve passar');
    console.assert(validateStudentRegistration('ABC12') === false, 'Matrícula muito curta deve falhar');
    
    // Teste 3: Validação de nome
    console.assert(validateFullName('João Silva') === true, 'Nome válido deve passar');
    console.assert(validateFullName('A') === false, 'Nome muito curto deve falhar');
    
    // Teste 4: Sanitização
    const sanitized = sanitizeStudentData({
      fullName: '  João  ',
      email: '  JOAO@TEST.COM  ',
      studentRegistration: '  est123  '
    });
    
    console.assert(sanitized.fullName === 'João', 'Nome deve ser trimmed');
    console.assert(sanitized.email === 'joao@test.com', 'Email deve ser lowercase e trimmed');
    console.assert(sanitized.studentRegistration === 'EST123', 'Matrícula deve ser uppercase e trimmed');
    
    console.log('✅ Todos os testes do ValidationService passaram!');
    return true;
  } catch (error) {
    console.error('❌ Erro nos testes do ValidationService:', error);
    return false;
  }
}