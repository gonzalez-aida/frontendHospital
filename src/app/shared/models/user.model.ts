export interface User {
  idUsuario: number;
  correo: string;
  rol: 'MEDICO' | 'PACIENTE' | 'ADMIN';
  token?: string;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  authenticated: boolean;
  username: string;
  sessionId: string;
}

export interface ExchangeResponse {
  rol: 'MEDICO' | 'PACIENTE' | 'ADMIN';
  idUsuario: number;
  correo: string;
  accessToken?: string;
}