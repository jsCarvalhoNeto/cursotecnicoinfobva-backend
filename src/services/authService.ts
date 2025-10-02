/**
 * Serviço para autenticação de usuários (usando API real)
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
  studentRegistration?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  };
  error?: string;
}

export interface SignUpResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  };
  error?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  full_name: string;
}

/**
 * Faz login de usuário usando a API real
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    // Primeiro, vamos tentar autenticar com o backend
    const response = await fetch('http://localhost:4002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies de sessão
      body: JSON.stringify(credentials)
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        user: result.user
      };
    } else {
      return {
        success: false,
        error: result.error || 'Erro de autenticação. Por favor, verifique suas credenciais e tente novamente.'
      };
    }
  } catch (error) {
    console.error('Erro de conexão com o servidor de autenticação:', error);
    return {
      success: false,
      error: 'Erro de conexão com o servidor'
    };
  }
}

/**
 * Faz cadastro de novo usuário usando a API real
 */
export async function signUp(credentials: SignUpCredentials): Promise<SignUpResponse> {
  try {
    const response = await fetch('http://localhost:4002/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Inclui cookies de sessão
      body: JSON.stringify(credentials)
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        user: result.user
      };
    } else {
      return {
        success: false,
        error: result.error || 'Erro ao criar conta'
      };
    }
  } catch (error) {
    console.error('Erro de conexão com o servidor de autenticação:', error);
    return {
      success: false,
      error: 'Erro de conexão com o servidor'
    };
  }
}

/**
 * Faz logout de usuário
 */
export async function logout(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:4002/api/auth/logout', {
      method: 'POST',
      credentials: 'include' // Inclui cookies de sessão
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return false;
  }
}

/**
 * Obtém o perfil do usuário atual
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const response = await fetch('http://localhost:4002/api/auth/me', {
      method: 'GET',
      credentials: 'include' // Inclui cookies de sessão
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
 }
}
