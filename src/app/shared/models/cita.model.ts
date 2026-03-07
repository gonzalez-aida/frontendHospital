export interface Paciente {
  idPaciente: number;
  nombre: string;
  apPaterno: string;
  apMaterno: string;
  nss: string;
  fechaNacimiento: string;
}

export interface Cita {
  idCita: number;
  folio: string;
  fecha: string;
  hora: string;
  tipo: string;
  motivo: string;
  estado: string;
  paciente: Paciente;
}