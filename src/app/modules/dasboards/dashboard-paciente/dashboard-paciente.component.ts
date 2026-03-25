import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Medico } from '../../../shared/models/medico.model';
import { ConnectivityService } from '../../../core/services/connectivity.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../dashboard-paciente/confirm-dialog-paciente.component';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { CitaService } from '../../../core/services/cita.service';
import { Cita } from '../../../shared/models/cita.model';
import { PatientService, PaginatedResponse } from '../../../core/services/patient.service';
import { Patient } from '../../../shared/models/patient.model';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard-paciente.component.html',
  styleUrls: ['./dashboard-paciente.component.scss']
})
export class DashboardComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  selectedSection: string = 'citas';
  darkMode: boolean = false;

  nombrePaciente: string = '';

  // Citas
  pageSize = 5;
  pageIndex = 0;
  citas: Cita[] = [];
  medicoId!: number;

  // Pacientes
  pacientes: Patient[] = [];
  pageSizePacientes = 5;
  pageIndexPacientes = 0;

  constructor(
    private authService: AuthService,
    public connectivityService: ConnectivityService,
    private dialog: MatDialog,
    private citaService: CitaService,
    private patientService: PatientService
  ) {}

ngOnInit(): void {

  const user = this.authService.currentUserValue;

  if (user) {

    //this.patientService.getPacientePorUsuario(user.idUsuario)
      //.subscribe({
        //next: (paciente: any) => {

          //this.nombrePaciente =
            //paciente.nombre + ' ' + paciente.apPaterno;

       // },
     //   error: (err) =>
      //    console.error('Error al obtener paciente', err)
   //   });

  }

}

  ngAfterViewInit() {}

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
    data: { 
      nombre: cita.nombrePaciente
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.citas = this.citas.filter(c => c !== cita);
    }
  });
}

  get paginatedCitas() {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    return this.citas.slice(start, end);
  }

  // ================= PACIENTES =================
cargarPacientes(): void {
  this.patientService.getPatients().subscribe({
    next: (res: Patient[]) => {
      this.pacientes = res;
      this.pageIndexPacientes = 0; // reinicia página
    },
    error: (err: any) => console.error('Error al cargar pacientes', err)
  });
}

  get paginatedPacientes(): Patient[] {
    const start = this.pageIndexPacientes * this.pageSizePacientes;
    const end = start + this.pageSizePacientes;
    return this.pacientes.slice(start, end);
  }

descargarExpediente(idPaciente: number) {
  this.patientService.getPatientById(idPaciente).subscribe({
    next: (paciente: Patient) => {

      const doc = new jsPDF();

      doc.text(
        `Expediente de: ${paciente.nombre} ${paciente.apPaterno} ${paciente.apMaterno}`,
        10,
        10
      );

      doc.text(`NSS: ${paciente.nss || '-'}`, 10, 20);
      doc.text(`Teléfono: ${paciente.telefono || '-'}`, 10, 30);
      doc.text(`Correo: ${paciente.correo || '-'}`, 10, 40);
      doc.text(`Sexo: ${paciente.sexo || '-'}`, 10, 50);
      doc.text(`Tipo de sangre: ${paciente.tipoSangre || '-'}`, 10, 60);

      doc.save(`Expediente_${paciente.nombre}.pdf`);
    },
    error: (err) => console.error('Error al generar expediente', err)
  });
}

    // ================= FORMULARIO CONSULTA =================

  // Datos temporales del formulario
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
  antHeredofamiliares: '',
  antPatologicos: '',
  antQuirurgicos: '',
  antAlergicos: '',
  enfCronicas: '',
  antGinecoObstetricos: '',
  observaciones: ''
};

// Tipos de sangre
tiposSangre = ['A_POS','A_NEG','B_POS','B_NEG','AB_POS','AB_NEG','O_POS','O_NEG'];

// Método para guardar la consulta (temporal)
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
    }
  }

  // ================= MÉTRICAS =================
  calcularEdad(fechaNacimiento: Date | string): number {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  get totalCitasHoy() {
    return this.citas.length;
  }

  get citasPendientes() {
    return this.citas.filter(c => c.estado === 'pendiente').length;
  }

  get citasCanceladas() {
    return this.citas.filter(c => c.estado === 'cancelada').length;
  }

  get proximaCita() {
    return this.citas.length > 0 ? this.citas[0].hora : '--';
  }
}