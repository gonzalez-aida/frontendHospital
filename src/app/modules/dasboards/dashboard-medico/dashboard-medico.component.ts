import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Medico } from '../../../shared/models/medico.model';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../dashboard-medico/confirm-dialog-medico.component';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { CitaService } from '../../../core/services/cita.service';
import { Cita } from '../../../shared/models/cita.model';
import { PatientService, PaginatedResponse } from '../../../core/services/patient.service';
import { Patient } from '../../../shared/models/patient.model';
import { jsPDF } from 'jspdf';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard-medico.component.html',
  styleUrls: ['./dashboard-medico.component.scss']
})
export class DashboardComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  selectedSection: string = 'citas';
  darkMode: boolean = false;

  nombreMedico: string = '';
  medico!: Medico;
  modoEdicion: boolean = false;
  guardando: boolean = false;
  citaSeleccionada!: Cita;

  // ================= CITAS =================
  pageSize = 5;
  pageIndex = 0;
  citas: Cita[] = [];
  filtroEstado: string = 'pendiente';
  medicoId!: number;

  // ================= PACIENTES =================
  pacientes: Patient[] = [];
  pageSizePacientes = 5;
  pageIndexPacientes = 0;
  totalPacientes = 0;

  constructor(
    private authService: AuthService,
    public connectivityService: ConnectivityService,
    private dialog: MatDialog,
    private citaService: CitaService,
    private patientService: PatientService,
    private snackBar: MatSnackBar
  ) { }

  // ================= INIT =================

  ngOnInit(): void {

    this.authService.obtenerPerfilMedico().subscribe({
      next: (medico: Medico) => {
        this.medico = medico;
        this.medicoId = medico.idMedico;

        this.nombreMedico =
          medico.nombre + ' ' +
          medico.apPaterno + ' ' +
          medico.apMaterno;

           this.cargarPacientes();

        // ✅ SOLO UNA LLAMADA
        this.citaService.obtenerMisCitas().subscribe({
          next: (data: Cita[]) => {
            this.citas = data.filter(c =>
              c.estado?.toLowerCase() !== 'archivada'
            );
          },
          error: (err) => console.error('Error al obtener citas del médico', err)
        });
      },
      error: (err) => console.error('Error al obtener perfil del médico', err)
    });

  }

  ngAfterViewInit() { }

  // ================= LOGOUT Y DARK MODE =================

  logout(): void {
    this.authService.logout();
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
  }

  changeSection(section: string) {
    this.selectedSection = section;
  }

  // ================= CITAS =================

  openCancelDialog(cita: Cita) {

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { nombre: cita.nombrePaciente }
    });


    dialogRef.afterClosed().subscribe(result => {

      if (result) {

        this.citaService.cancelarCita(cita.idCita).subscribe({

          next: () => {

            // 🔥 Actualizamos estado en memoria
            cita.estado = 'cancelada';

            this.snackBar.open(
              'Cita cancelada correctamente',
              'Cerrar',
              { duration: 3000 }
            );

          },

          error: () => {
            this.snackBar.open(
              'Error al cancelar cita',
              'Cerrar',
              { duration: 3000 }
            );
          }

        });

      }

    });
  }

  atenderCita(cita: Cita) {

    this.citaSeleccionada = cita;

    // Dividir nombre completo
    const partes = cita.nombrePaciente?.split(' ') || [];

    this.consulta.pacienteNombre = partes[0] || '';
    this.consulta.pacienteApPaterno = partes[1] || '';
    this.consulta.pacienteApMaterno = partes[2] || '';

    // 🔥 USAR EXACTAMENTE LO QUE VIENE DE LA CITA
    this.consulta.fechaNacimiento = cita.fechaNacimiento || '';
    this.consulta.motivo = '';

    // 👇 AGREGA ESTO SI LOS TIENES EN EL FORM
    (this.consulta as any).nss = cita.nss || '';
    (this.consulta as any).curp = cita.curp || '';

    this.selectedSection = 'formulario';
  }

  get nombrePacientePartes(): string[] {
    if (!this.citaSeleccionada?.nombrePaciente) return ['', '', ''];
    return this.citaSeleccionada.nombrePaciente.split(' ');
  }

  completarCita(cita: Cita) {

    this.citaService.completarCita(cita.idCita).subscribe({

      next: () => {

        // 🔥 Actualiza el estado en memoria
        cita.estado = 'completada';

        this.snackBar.open(
          'Cita completada correctamente',
          'Cerrar',
          { duration: 3000 }
        );

      },

      error: () => {

        this.snackBar.open(
          'Error al completar cita',
          'Cerrar',
          { duration: 3000 }
        );

      }

    });

  }



  get paginatedCitas(): Cita[] {

    let citasFiltradas: Cita[] = this.citas;

    if (this.filtroEstado === 'pendiente') {
      citasFiltradas = this.citas.filter(c =>
        c.estado?.toLowerCase() !== 'cancelada' &&
        c.estado?.toLowerCase() !== 'completada'
      );
    }

    else if (this.filtroEstado === 'completada') {
      citasFiltradas = this.citas.filter(c =>
        c.estado?.toLowerCase() === 'completada'
      );
    }

    else if (this.filtroEstado === 'cancelada') {
      citasFiltradas = this.citas.filter(c =>
        c.estado?.toLowerCase() === 'cancelada'
      );
    }

    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;

    return citasFiltradas.slice(start, end);
  }

  filtrarPorEstado(estado: string) {
    this.filtroEstado = estado;
    this.pageIndex = 0; // reinicia paginación
  }


  get tituloSeccion(): string {
  switch (this.selectedSection) {
    case 'citas':
      return 'Gestión de Citas';
    case 'pacientes':
      return 'Lista de Pacientes';
    case 'formulario':
      return 'Consulta Médica';
    default:
      return 'Perfil Médico';
  }
}

  // ================= PACIENTES =================

cargarPacientes(page: number = 1, pageSize: number = this.pageSizePacientes): void {
  this.patientService.getPatients(page, pageSize).subscribe({
    next: (res: PaginatedResponse<Patient>) => {
      this.pacientes = res.data;
      this.totalPacientes = res.total; // 👈 importante
      this.pageSizePacientes = res.pageSize;
      this.pageIndexPacientes = res.page - 1;
    },
    error: (err) => console.error('Error al cargar pacientes', err)
  });
}

get paginatedPacientes(): Patient[] {
  return this.pacientes;
}

  descargarExpediente(idPaciente: number) {
    this.patientService.getPatientById(idPaciente).subscribe({
      next: (paciente: Patient) => {
        const doc = new jsPDF();
        doc.text(`Expediente de: ${paciente.firstName} ${paciente.lastName}`, 10, 10);
        doc.text(`NSS: ${paciente.nationalHealthId || '-'}`, 10, 20);
        doc.text(`Teléfono: ${paciente.phone}`, 10, 30);
        doc.text(`Email: ${paciente.email}`, 10, 40);
        doc.text(`Género: ${paciente.gender}`, 10, 50);
        doc.text(`Tipo de sangre: ${paciente.bloodType}`, 10, 60);

        if (paciente.emergencyContact) {
          doc.text(
            `Contacto de emergencia: ${paciente.emergencyContact.name} (${paciente.emergencyContact.relationship}) - ${paciente.emergencyContact.phone}`,
            10,
            70
          );
        }

        doc.save(`Expediente_${paciente.firstName}.pdf`);
      },
      error: (err) => console.error('Error al generar expediente', err)
    });
  }

  // ================= FORMULARIO CONSULTA =================

  consulta = {
    pacienteNombre: '',
    pacienteApPaterno: '',
    pacienteApMaterno: '',
    fechaNacimiento: '',
    sexo: '',
    tipoSangre: '',
    telefono: '',
    correo: '',
    telefonoEmergencia: '',
    nss: '',
    curp: '',
    antHeredofamiliares: '',
    antPatologicos: '',
    antQuirurgicos: '',
    antAlergicos: '',
    enfCronicas: '',
    antGinecoObstetricos: '',
    observaciones: '',
    motivo: '',
    presionArterial: '',
    frecuenciaCardiaca: '',
    temperatura: '',
    peso: '',
    estatura: '',
medicamentos: '',
    diagnostico: '',
    observacionesMedicas: '',
    receta: '',
    

  };

  tiposSangre = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];

  guardarConsulta() {
    console.log('Datos de la consulta:', this.consulta);
    alert('Consulta guardada (temporal, sin conexión al backend)');
  }



  // ================= PAGINACIÓN =================

  handlePageEvent(event: PageEvent) {
    if (this.selectedSection === 'citas') {
      this.pageSize = event.pageSize;
      this.pageIndex = event.pageIndex;
    } else if (this.selectedSection === 'pacientes') {
      this.pageSizePacientes = event.pageSize;
      this.pageIndexPacientes = event.pageIndex;

       this.cargarPacientes(event.pageIndex + 1, event.pageSize);
    }
  }

  // ================= MÉTRICAS =================

  calcularEdad(fechaNacimiento: Date | string): number {
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

  get totalCitasHoy(): number {
    return this.citas.length;
  }

  get citasPendientes(): number {
    return this.citas.filter(c =>
      c.estado?.toLowerCase() !== 'cancelada' &&
      c.estado?.toLowerCase() !== 'completada'
    ).length;
  }

  get citasCanceladas(): number {
    return this.citas.filter(c =>
      c.estado?.toLowerCase() === 'cancelada'
    ).length;
  }

  get citasCompletadas(): number {
    return this.citas.filter(c =>
      c.estado?.toLowerCase() === 'completada'
    ).length;
  }

  get proximaCita(): string {
    return this.citas.length > 0 ? this.citas[0].hora : '--';
  }

  // ================= PERFIL =================

  toggleEdicion() {
    this.modoEdicion = !this.modoEdicion;
  }

  guardarPerfil() {
    this.guardando = true;

    this.authService.editarPerfilMedico(this.medico).subscribe({
      next: (res: Medico) => {
        this.medico = res;
        this.modoEdicion = false;
        this.guardando = false;

        this.snackBar.open(
          'Perfil actualizado correctamente',
          'Cerrar',
          {
            duration: 3000,
            panelClass: ['snackbar-success'],
            horizontalPosition: 'right',
            verticalPosition: 'bottom'
          }
        );
      },
      error: (err) => {
        console.error('Error al actualizar perfil', err);
        this.guardando = false;

        this.snackBar.open(
          'Ocurrió un error al actualizar el perfil',
          'Cerrar',
          {
            duration: 4000,
            panelClass: ['snackbar-error'],
            horizontalPosition: 'right',
            verticalPosition: 'bottom'
          }
        );
      }
    });
  }
}