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
  if (!this.paciente?.idPaciente) return;

  this.patientService.getExpedientesByPaciente(this.paciente.idPaciente)
    .subscribe({
      next: (resp: any) => {
        // ✅ data es objeto único ahora
        this.expedientePaciente = resp?.data ?? null;
        console.log('Expediente cargado:', this.expedientePaciente);
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

verMiExpediente() {
  if (!this.paciente?.idPaciente) return;

  this.patientService.getExpedientesByPaciente(this.paciente.idPaciente)
    .subscribe({
      next: (resp: any) => {
        const exp = resp?.data;

        if (!exp) {
          Swal.fire({
            icon: 'info',
            title: 'Sin expediente',
            text: 'Aún no cuentas con un expediente clínico registrado.'
          });
          return;
        }

        // ✅ Abre directamente el PDF
        this.generarPDFPaciente(exp);
      },
      error: () => {
        Swal.fire({
          icon: 'info',
          title: 'Sin expediente',
          text: 'Aún no cuentas con un expediente clínico registrado.'
        });
      }
    });
}

generarPDFPaciente(exp: any) {
  const doc = new jsPDF();
  const safe = (v: any) => v ? v : 'No especificado';
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  // HEADER
  doc.setFillColor(31, 58, 95);
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MI EXPEDIENTE CLÍNICO', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const fechaActual = new Date();
  const fechaFormateada = `${String(fechaActual.getDate()).padStart(2,'0')}/${String(fechaActual.getMonth()+1).padStart(2,'0')}/${fechaActual.getFullYear()}`;
  doc.text(`Fecha: ${fechaFormateada}`, pageW - 14, 26, { align: 'right' });
  doc.text(`Paciente: ${this.paciente.nombre} ${this.paciente.apPaterno} ${this.paciente.apMaterno}`, 14, 34);

  doc.setTextColor(0, 0, 0);
  y = 50;

  const seccion = (titulo: string) => {
    y += 6;
    doc.setFillColor(238, 243, 249);
    doc.rect(10, y - 5, pageW - 20, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 58, 95);
    doc.text(titulo, 14, y + 2);
    doc.setTextColor(0, 0, 0);
    y += 12;
  };

  const campo = (label: string, value: any) => {
    const texto = safe(value);
    const lineas = texto.split('\n');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    lineas.forEach((linea: string) => {
      const wrapped = doc.splitTextToSize(linea || ' ', 120);
      wrapped.forEach((l: string) => {
        doc.text(l, 75, y);
        y += 6;
      });
    });
    y += 3;
  };

  seccion('Condiciones Médicas');
  campo('Alergias:', exp.ant_alergicos);
  campo('Enf. Crónicas:', exp.enf_cronicas);

  seccion('Antecedentes');
  campo('Heredofamiliares:', exp.ant_heredofamiliares);
  campo('Patológicos:', exp.ant_patologicos);
  campo('Quirúrgicos:', exp.ant_quirurgicos);

  seccion('Ginecoobstétricos');
  campo('Detalles:', exp.ant_ginecoobstetricos);

  seccion('Observaciones Generales');
  campo('Notas:', exp.observaciones);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Sistema Hospitalario H+ Medical', pageW / 2, 285, { align: 'center' });

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

// ✅ Agrega esta propiedad
fechaMinima: string = new Date().toISOString().split('T')[0]; // "yyyy-MM-dd" de hoy

// ✅ Agrega esta propiedad para el mensaje de error de hora
horaInvalida: boolean = false;

// ✅ Agrega este método para validar hora en tiempo real
validarHora() {
  const { fecha, hora } = this.nuevaCita;
  if (!fecha || !hora) {
    this.horaInvalida = false;
    return;
  }

  const ahora = new Date();
  const fechaHoraCita = new Date(`${fecha}T${hora}`);
  this.horaInvalida = fechaHoraCita <= ahora;
}

confirmarCita() {
  const { fecha, hora, motivo, tipo } = this.nuevaCita;

  // 1. Validar campos vacíos
  if (!fecha || !hora || !motivo || !tipo) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: 'Por favor completa todos los campos antes de continuar.'
    });
    return;
  }

  // 2. Validar fecha y hora no sean pasadas
  const ahora = new Date();
  const fechaHoraCita = new Date(`${fecha}T${hora}`);

  if (fechaHoraCita <= ahora) {
    Swal.fire({
      icon: 'error',
      title: 'Fecha u hora inválida',
      text: 'No puedes agendar una cita en una fecha u hora que ya pasó. Por favor selecciona una fecha y hora futuras.'
    });
    return;
  }

  // 3. Mapear tipo
  const tipoMap: Record<string, string> = {
    "PRIMERA VEZ": "primera_vez",
    "SUBSECUENTE": "subsecuente",
    "URGENCIA": "urgencia",
    "REFERIDA": "referida",
    "ARCHIVADA": "archivada"
  };

  const tipoBackend = tipoMap[tipo];
  if (!tipoBackend) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'Tipo de cita inválido.' });
    return;
  }

  // 4. Construir payload
  const citaPayload = {
    fecha: this.nuevaCita.fecha,
    hora: this.nuevaCita.hora + ":00",
    motivo: this.nuevaCita.motivo,
    tipo: tipoBackend
  };

  // 5. Enviar
  this.citaService.agendarCita(citaPayload).subscribe({
    next: (cita) => {
      this.ultimaCitaAgendada = cita;
      this.citas.push(cita);

      Swal.fire({
        icon: 'success',
        title: 'Cita confirmada',
        text: `Cita agendada con Dr. ${cita.medico?.nombre || 'por asignar'}`,
        timer: 3000,
        showConfirmButton: false
      });

      this.nuevaCita = { fecha: '', hora: '', motivo: '', tipo: 'PRIMERA VEZ' };
    },
    error: (err) => {
      console.error("Error al agendar:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agendar la cita. Intenta de nuevo.'
      });
    }
  });
}

cancelarCita(idCita: number) {
  Swal.fire({
    title: '¿Cancelar esta cita?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d32f2f',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, cancelar cita',
    cancelButtonText: 'No, mantener'
  }).then((result) => {
    if (result.isConfirmed) {
      this.citaService.cancelarCita(idCita).subscribe({
        next: () => {
          // ✅ Actualiza estado en memoria sin recargar
          const cita = this.citas.find(c => c.idCita === idCita);
          if (cita) cita.estado = 'cancelada';

          Swal.fire({
            icon: 'success',
            title: 'Cita cancelada',
            text: 'Tu cita ha sido cancelada correctamente.',
            timer: 2500,
            showConfirmButton: false
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cancelar la cita. Intenta de nuevo.'
          });
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
  this.cargarExpediente(); // ✅ ya corregido arriba
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