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

  nombrePaciente: string;
  nss: string;
  curp: string;
  fechaNacimiento: string; 

    // 🔥 AGREGA ESTOS
  dxPrincipal?: string;
  dxDescripcion?: string;
  observaciones?: string;
  receta?: string;

  presionArterial?: string;
  frecuenciaCardiaca?: number;
  temperatura?: number;
  peso?: number;
  estatura?: number;

  medico?: any;

}


