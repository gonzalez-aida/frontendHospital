export interface Medico {
  idMedico: number;
  numEmpleado: string;
  cedulaProfesional: string;
  nombre: string;
  apPaterno: string;
  apMaterno: string;
  especialidad: string;
  turno: string;
  consultorio: string;
  activo: boolean;

  usuario?: {
    idUsuario: number;
    correo: string;
    estado: string;
  };

  unidadMedica?: {
    idUm: number;
    clave: string;
    nombre: string;
    nivel: number;
    delegacion: string;
    municipio: string;
    estado: string;
  };
}