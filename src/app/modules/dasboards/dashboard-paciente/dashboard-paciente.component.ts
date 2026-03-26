import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { PatientService } from '../../../core/services/patient.service';
import { CitaService } from '../../../core/services/cita.service';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard-paciente',
  templateUrl: './dashboard-paciente.component.html',
  styleUrls: ['./dashboard-paciente.component.scss']
})
export class DashboardPacienteComponent implements OnInit {

  // ================= UI =================
  selectedSection: string = 'perfil';
  darkMode: boolean = false;
  tituloSeccion: string = 'Mi Perfil';

  // ================= DATOS =================
  paciente: any = {};
  expediente: any = {};

  citas: any[] = [];
  historial: any[] = [];

  constructor(
    private authService: AuthService,
    public connectivityService: ConnectivityService,
    private patientService: PatientService,
    private citaService: CitaService
  ) {}

  ngOnInit(): void {
    this.cargarPerfilPaciente();
  }

  // ================= PERFIL =================

cargarPerfilPaciente() {
  this.authService.obtenerPerfilPaciente().subscribe({
    next: (data: any) => {
      this.paciente = data;

      // 🔥 IMPORTANTE
      this.cargarHistorial(); 
      this.cargarCitas();
    },
    error: (err) => console.error('Error al obtener perfil paciente', err)
  });
}


cargarCitas() {
  this.citaService.obtenerCitasPorPaciente(this.paciente.idPaciente)
    .subscribe({
      next: (data: any[]) => {
        this.citas = data;
        console.log('Citas cargadas:', this.citas);
      },
      error: (err) => console.error('Error al cargar citas', err)
    });
}


cargarHistorial() {

  if (!this.paciente?.idPaciente) {
    console.log('Paciente aún no cargado');
    return;
  }

  this.citaService.obtenerCitasPorPaciente(this.paciente.idPaciente)
    .subscribe({
      next: (data: any[]) => {
        this.historial = data.map(c => ({
          ...c,
          expandida: false
        }));

        console.log('Historial cargado:', this.historial);
      },
      error: (err) => console.error('Error al cargar historial', err)
    });
}


// ================= EXPEDIENTE PACIENTE =================
expedientePaciente: any = null;
descargasRestantes: number = 3;
bloqueadoDescarga: boolean = false;


// ================= EXPEDIENTE =================

cargarExpediente() {

  if (!this.paciente?.idPaciente) {
    console.log('Paciente aún no cargado');
    return;
  }

  this.patientService.getExpedientesByPaciente(this.paciente.idPaciente)
    .subscribe({
      next: (data: any) => {
        this.expediente = data;
        console.log('Expediente cargado:', this.expediente);
      },
      error: (err) => console.error('Error al cargar expediente', err)
    });
}


// Descargar expediente como PDF simple (frontend)
descargarMiExpediente() {

  if (this.bloqueadoDescarga) return;

  if (!this.expedientePaciente) return;

  if (this.descargasRestantes <= 0) {
    this.bloqueadoDescarga = true;

    Swal.fire({
      icon: 'warning',
      title: 'Límite alcanzado',
      text: 'Has alcanzado el límite máximo de descargas (3).'
    });

    return;
  }

  this.generarPDFPaciente(this.expedientePaciente);

  this.descargasRestantes--;

  Swal.fire({
    icon: 'info',
    title: 'Descarga realizada',
    text: `Te quedan ${this.descargasRestantes} descargas disponibles. Guarda bien tu copia.`,
    timer: 3000,
    showConfirmButton: false
  });

  if (this.descargasRestantes === 0) {
    this.bloqueadoDescarga = true;
  }

}

cargarMiExpediente() {

  if (!this.paciente?.idPaciente) return;

  this.patientService.getExpedientesByPaciente(this.paciente.idPaciente)
    .subscribe({

      next: (resp: any) => {

        const lista = resp?.data ?? [];

        if (!lista.length) {
          Swal.fire(
            'Sin expediente',
            'Aún no cuentas con un expediente clínico.',
            'info'
          );
          return;
        }

        this.expedientePaciente = lista[0];
      },

      error: () => {
        Swal.fire(
          'Error',
          'No se pudo cargar tu expediente.',
          'error'
        );
      }

    });

}

generarPDFPaciente(exp: any) {

  const doc = new jsPDF();

  const safe = (v: any) => v ? v : 'No especificado';

  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MI EXPEDIENTE CLÍNICO', 20, y);

  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Paciente: ${this.paciente.nombre} ${this.paciente.apPaterno} ${this.paciente.apMaterno}`, 20, y);

  y += 10;

  const campo = (label: string, value: any) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(safe(value), 70, y);
    y += 8;
  };

  campo('Alergias:', exp.ant_alergicos);
  campo('Enfermedades Crónicas:', exp.enf_cronicas);
  campo('Heredofamiliares:', exp.ant_heredofamiliares);
  campo('Observaciones:', exp.observaciones);

  window.open(doc.output('bloburl').toString());
}


// ================= NUEVA CITA =================
// ================= NUEVA CITA =================
nuevaCita = {
  fecha: '',
  hora: '',
  motivo: '',
  tipo: 'PRIMERA VEZ'
};

ultimaCitaAgendada: any = null;

confirmarCita() {
  const { fecha, hora, motivo, tipo } = this.nuevaCita;

  // 1️⃣ Validar que todos los campos estén llenos
  if (!fecha || !hora || !motivo || !tipo) {
    alert('Por favor completa todos los campos de la cita.');
    return;
  }

  // 2️⃣ Mapear los tipos de frontend a los enums del backend
  const tipoMap: Record<string, string> = {
    "PRIMERA VEZ": "primera_vez",
    "SUBSECUENTE": "subsecuente",
    "URGENCIA": "urgencia",
    "REFERIDA": "referida",
    "ARCHIVADA": "archivada"
  };

  const tipoBackend = tipoMap[tipo];
  if (!tipoBackend) {
    alert('Tipo de cita inválido.');
    return;
  }

  // 3️⃣ Construir payload (no enviar idPaciente)
const citaPayload = {
  fecha: this.nuevaCita.fecha,      // "yyyy-MM-dd"
  hora: this.nuevaCita.hora + ":00", // "HH:mm:ss" necesario para Java
  motivo: this.nuevaCita.motivo,
  tipo: tipoBackend
};

  console.log("Enviando datos JSON:", JSON.stringify(citaPayload));

  // 4️⃣ Llamada al servicio para agendar cita
  this.citaService.agendarCita(citaPayload).subscribe({
    next: (cita) => {
      console.log("Cita agendada:", cita);
      this.ultimaCitaAgendada = cita;
      this.citas.push(cita);

      Swal.fire({
        icon: 'success',
        title: 'Cita confirmada',
        text: `Cita agendada con Dr. ${cita.medico?.nombre || 'pendiente asignar'}`,
        timer: 3000,
        showConfirmButton: false
      });

      // Limpiar formulario
      this.nuevaCita = { fecha: '', hora: '', motivo: '', tipo: 'PRIMERA VEZ' };
    },
    error: (err) => {
      console.error("Error al agendar:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agendar la cita. Revisa la consola para más detalles.'
      });
    }
  });
}

cancelarCita(idCita: number) {

  Swal.fire({
    title: '¿Cancelar cita?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cancelar',
    cancelButtonText: 'No'
  }).then((result) => {

    if (result.isConfirmed) {

      this.citaService.cancelarCita(idCita)
        .subscribe({

          next: () => {
            Swal.fire('Cancelada', 'La cita fue cancelada', 'success');
            this.cargarCitas();
          },

          error: () => {
            Swal.fire('Error', 'No se pudo cancelar la cita', 'error');
          }

        });
    }
  });
}

// ================= UI =================

changeSection(section: string) {
  this.selectedSection = section;

  switch (section) {

    case 'citas':
      this.tituloSeccion = 'Mis Citas';
      this.cargarCitas();
      break;

case 'expediente':
  this.tituloSeccion = 'Mi Expediente';
  this.cargarExpediente();   // 🔥 IMPORTANTE
  break;

    case 'historial':
      this.tituloSeccion = 'Historial de Consultas';
      this.cargarHistorial();
      break;

    case 'perfil':
      this.tituloSeccion = 'Mi Perfil';
      break;
  }
  }

  logout(): void {
    this.authService.logout();
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
  }

  calcularEdad(fechaNacimiento?: string | Date | null): number {
    if (!fechaNacimiento) return 0;

    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

}