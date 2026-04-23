import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { PatientService } from '../../../core/services/patient.service';
import { CitaService } from '../../../core/services/cita.service';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard-paciente',
  templateUrl: './dashboard-paciente.component.html',
  styleUrls: ['./dashboard-paciente.component.scss']
})
export class DashboardPacienteComponent implements OnInit {

  // ================= UI =================
  selectedSection: string = 'citas';
  darkMode: boolean = false;
  tituloSeccion: string = 'Mis Citas';
  isMobile: boolean = false;      

  // ================= DATOS =================
  paciente: any = {};
  expediente: any = {};

  citas: any[] = [];
  historial: any[] = [];

  constructor(
    private authService: AuthService,
    public connectivityService: ConnectivityService,
    private patientService: PatientService,
    private citaService: CitaService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.checkMobile();                                              
  window.addEventListener('resize', () => this.checkMobile());   
    this.cargarPerfilPaciente();

  }

  // ← AGREGA ESTE MÉTODO AQUÍ
checkMobile() {
  this.isMobile = window.innerWidth <= 900;
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
  if (!this.paciente?.idPaciente) return;

  this.citaService.obtenerCitasPorPaciente(this.paciente.idPaciente)
    .subscribe({
      next: (data: any[]) => {

        // Solo las completadas van al historial
        const completadas = data.filter(c =>
          c.estado?.toLowerCase() === 'completada'
        );

        // Cargar recetas y cruzarlas
        this.citaService.obtenerMisRecetas().subscribe({
          next: (recetas: any[]) => {
            this.cargarContadoresDescarga();

            this.historial = completadas.map(c => ({
              ...c,
              expandida: false,
              receta: recetas.find(r => r.idCita === c.idCita) ?? null
            }));

            console.log('Historial con recetas:', this.historial);
          },
          error: () => {
            // Si falla la carga de recetas, igual muestra el historial sin ellas
            this.historial = completadas.map(c => ({
              ...c,
              expandida: false,
              receta: null
            }));
          }
        });
      },
      error: (err) => console.error('Error al cargar historial', err)
    });
}

// ================= EDITAR CONTACTO =================
editandoContacto: boolean = false;
contactoEdit = { telefono: '', telefonoEmergencias: '' };

toggleEdicionContacto() {
  this.editandoContacto = !this.editandoContacto;
  if (this.editandoContacto) {
    this.contactoEdit = {
      telefono: this.paciente?.telefono || '',
      telefonoEmergencias: this.paciente?.telefonoEmergencias || ''
    };
  }
}

guardarContacto() {
  if (!this.contactoEdit.telefono.trim()) {
    Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'El teléfono no puede estar vacío.' });
    return;
  }

  // Construimos el payload con todos los datos actuales del paciente
  // y solo sobreescribimos los dos campos editables
  const payload = {
    nombre: this.paciente.nombre,
    apPaterno: this.paciente.apPaterno,
    apMaterno: this.paciente.apMaterno,
    fechaNacimiento: this.paciente.fechaNacimiento,
    sexo: this.paciente.sexo,
    tipoSangre: this.paciente.tipoSangre,
    curp: this.paciente.curp,
    nss: this.paciente.nss,
    telefono: this.contactoEdit.telefono,
    telefonoEmergencias: this.contactoEdit.telefonoEmergencias,
    direccion: this.paciente.direccion ?? null,
    usuario: null
  };

  // Usamos el idUsuario del token guardado en localStorage
  const user = JSON.parse(localStorage.getItem('h-moscatti-user') || '{}');
  const idUsuario = user?.idUsuario;

  if (!idUsuario) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo identificar al usuario.' });
    return;
  }

  this.http.put(
    `${environment.apiUrl}/paciente/usuario/${idUsuario}`,
    payload,
    { withCredentials: true }
  ).subscribe({
    next: () => {
      this.paciente.telefono = this.contactoEdit.telefono;
      this.paciente.telefonoEmergencias = this.contactoEdit.telefonoEmergencias;
      this.editandoContacto = false;
      Swal.fire({ icon: 'success', title: 'Datos actualizados', timer: 2000, showConfirmButton: false });
    },
    error: () => {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar la información.' });
    }
  });
}


soloNumerosTelefono(event: Event) {
  const input = event.target as HTMLInputElement;
  this.contactoEdit.telefono = input.value.replace(/\D/g, '').slice(0, 10);
}

soloNumerosEmergencia(event: Event) {
  const input = event.target as HTMLInputElement;
  this.contactoEdit.telefonoEmergencias = input.value.replace(/\D/g, '').slice(0, 10);
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

formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
}

abrirCalendario() {
  const input = document.getElementById('inputFechaCita') as any;
  if (input?.showPicker) {
    input.showPicker();
  } else {
    input?.click();
  }
}

// ✅ Agrega esta propiedad
// ✅ Usa la fecha local correcta
fechaMinima: string = this.getFechaHoyLocal();

getFechaHoyLocal(): string {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


// ✅ Agrega esta propiedad para el mensaje de error de hora
horaInvalida: boolean = false;

// ✅ Agrega este método para validar hora en tiempo real
validarHora() {
  const { fecha, hora } = this.nuevaCita;
  if (!fecha || !hora) {
    this.horaInvalida = false;
    return;
  }

  const hoy = this.getFechaHoyLocal();

  // Si la fecha seleccionada es futura, la hora siempre es válida
  if (fecha > hoy) {
    this.horaInvalida = false;
    return;
  }

  // Si es hoy, comparar la hora seleccionada con la hora actual local
  const ahora = new Date();
  const [horaSeleccionada, minutosSeleccionados] = hora.split(':').map(Number);
  const horaActual = ahora.getHours();
  const minutosActual = ahora.getMinutes();

  const minutosSeleccionadosTotal = horaSeleccionada * 60 + minutosSeleccionados;
  const minutosActualTotal = horaActual * 60 + minutosActual;

  this.horaInvalida = minutosSeleccionadosTotal <= minutosActualTotal;
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
// En confirmarCita(), reemplaza el bloque error:
error: (err) => {
  console.error("Error al agendar:", err);
  console.error("Error detalle:", err.error); // ✅ agrega esto
  
  const mensaje = err.error?.error || err.error?.message || 'No se pudo agendar la cita. Intenta de nuevo.';
  
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: mensaje  // ✅ muestra el mensaje real del backend
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


// ================= RECETAS =================
recetas: any[] = [];
descargasPorReceta: { [idReceta: number]: number } = {};
readonly MAX_DESCARGAS = 3;

cargarRecetas() {
  this.citaService.obtenerMisRecetas().subscribe({
    next: (data: any[]) => {
      this.recetas = data;
      this.cargarContadoresDescarga();
    },
    error: (err) => console.error('Error al cargar recetas', err)
  });
}

cargarContadoresDescarga() {
  const guardado = localStorage.getItem('descargas-recetas');
  this.descargasPorReceta = guardado ? JSON.parse(guardado) : {};
}

getDescargasRestantes(idReceta: number): number {
  const usadas = this.descargasPorReceta[idReceta] ?? 0;
  return this.MAX_DESCARGAS - usadas;
}

puedeDescargar(idReceta: number): boolean {
  return this.getDescargasRestantes(idReceta) > 0;
}

descargarReceta(receta: any) {
  const restantes = this.getDescargasRestantes(receta.idReceta);

  if (restantes <= 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Límite alcanzado',
      text: 'Has alcanzado el máximo de 3 descargas para esta receta.',
      confirmButtonColor: '#1f3a5f'
    });
    return;
  }

  // Confirmar si le queda solo 1
  if (restantes === 1) {
    Swal.fire({
      icon: 'warning',
      title: '¡Última descarga!',
      text: 'Esta es tu última descarga disponible para esta receta. ¿Deseas continuar?',
      showCancelButton: true,
      confirmButtonText: 'Sí, descargar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1f3a5f',
      cancelButtonColor: '#6b7280'
    }).then(result => {
      if (result.isConfirmed) this.ejecutarDescarga(receta);
    });
    return;
  }

  this.ejecutarDescarga(receta);
}

ejecutarDescarga(receta: any) {
  // Incrementar contador
  const usadas = this.descargasPorReceta[receta.idReceta] ?? 0;
  this.descargasPorReceta[receta.idReceta] = usadas + 1;
  localStorage.setItem('descargas-recetas', JSON.stringify(this.descargasPorReceta));

  const restantesAhora = this.getDescargasRestantes(receta.idReceta);

  this.generarPDFReceta(receta);

  if (restantesAhora > 0) {
    Swal.fire({
      icon: 'info',
      title: 'Descarga realizada',
      html: `Te quedan <strong>${restantesAhora}</strong> descarga(s) para esta receta. Guarda bien tu copia.`,
      timer: 3000,
      showConfirmButton: false
    });
  }
}

generarPDFReceta(receta: any) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const safe = (v: any) => v ?? 'No especificado';
  let y = 0;

  // HEADER
  doc.setFillColor(31, 58, 95);
  doc.rect(0, 0, pageW, 42, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('RECETA MÉDICA', 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Folio: ${safe(receta.folio)}`, 14, 26);
  doc.text(`Fecha: ${safe(receta.fecha)}`, 14, 33);
  doc.text(`Vencimiento: ${safe(receta.vencimiento)}`, pageW - 14, 26, { align: 'right' });
  doc.text(`Estado: ${safe(receta.estado)}`, pageW - 14, 33, { align: 'right' });

  // PACIENTE
  doc.setFillColor(238, 243, 249);
  doc.rect(10, 48, pageW - 20, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 58, 95);
  doc.text('Paciente:', 14, 57);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(
    `${this.paciente.nombre} ${this.paciente.apPaterno} ${this.paciente.apMaterno}  |  NSS: ${this.paciente.nss}`,
    50, 57
  );
  doc.setFontSize(9);
  doc.text(`Médico tratante: Dr. registrado en sistema`, 14, 63);

  y = 78;

  // MEDICAMENTOS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(31, 58, 95);
  doc.text('Medicamentos prescritos', 14, y);
  y += 6;
  doc.setDrawColor(31, 58, 95);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  if (receta.medicamentos?.length) {
    receta.medicamentos.forEach((med: any, i: number) => {
      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
      doc.rect(10, y - 5, pageW - 20, 28, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(31, 58, 95);
      doc.text(`${i + 1}. ${safe(med.nombre)}`, 14, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.text(`Presentación: ${safe(med.presentacion)}   |   Vía: ${safe(med.via)}`, 18, y + 7);
      doc.text(`Dosis: ${safe(med.dosis)}   |   Frecuencia: ${safe(med.frecuencia)}   |   Duración: ${safe(med.duracion)}   |   Cantidad: ${safe(med.cantidad)}`, 18, y + 14);

      y += 32;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Sin medicamentos registrados.', 14, y);
    y += 12;
  }

  // FOOTER
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Este documento es de uso personal. No compartir.', pageW / 2, 278, { align: 'center' });
  doc.text('Sistema Hospitalario H+ Medical', pageW / 2, 284, { align: 'center' });

  window.open(doc.output('bloburl').toString());
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
      this.cargarRecetas();
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