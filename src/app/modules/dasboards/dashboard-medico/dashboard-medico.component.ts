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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DetalleConsultaComponent } from '../../doctores/detalle-consulta/detalle-consulta.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard-medico.component.html',
  styleUrls: ['./dashboard-medico.component.scss']
})
export class DashboardComponent implements AfterViewInit, OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  selectedSection: string = 'citas';
  darkMode: boolean = false;
  isMobile: boolean = false;       // ← AQUÍ, junto a las otras propiedades UI

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
  pacientesFiltrados: Patient[] = [];
  filtroBusqueda: string = '';
  private searchSubject = new Subject<string>();
  mensajeBusqueda: string = 'Escriba al menos 1 letra del nombre o NSS del paciente';
  cargandoBusqueda: boolean = false;

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
    // ← AQUÍ, FUERA del subscribe, al inicio del ngOnInit
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());

    this.authService.obtenerPerfilMedico().subscribe({
      next: (medico: Medico) => {
        this.medico = medico;
        this.medicoId = medico.idMedico;

        this.nombreMedico =
          medico.nombre + ' ' +
          medico.apPaterno + ' ' +
          medico.apMaterno;

        this.pacientesFiltrados = [...this.pacientes];

        this.searchSubject.pipe(
          debounceTime(400),
          distinctUntilChanged()
        ).subscribe((value: string) => {

          const filtro = value.trim();

          if (!filtro) {
            this.pacientesFiltrados = [];
            this.mensajeBusqueda = 'Escriba al menos 1 letra del nombre o NSS del paciente';
            return;
          }

          this.cargandoBusqueda = true;

          this.patientService.searchPatients(filtro).subscribe({
            next: (data: Patient[]) => {
              this.pacientesFiltrados = data;
              this.pageIndexPacientes = 0;

              this.mensajeBusqueda = data.length === 0
                ? 'No se encontraron pacientes con ese criterio'
                : '';

              this.cargandoBusqueda = false;
            },
            error: () => {
              this.cargandoBusqueda = false;
              this.mensajeBusqueda = 'Error al buscar pacientes';
            }
          });

        });

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

  // ← AQUÍ, como método de la clase, no dentro de ninguna función
  checkMobile() {
    this.isMobile = window.innerWidth <= 900;
  }

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
            cita.estado = 'cancelada';
            this.snackBar.open('Cita cancelada correctamente', 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al cancelar cita', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  atenderCita(cita: Cita) {
    this.consulta = {
      ...this.consulta,
      presionArterial: '',
      frecuenciaCardiaca: 0,
      temperatura: 0,
      peso: 0,
      estatura: 0,
      diagnostico: '',
      observacionesMedicas: '',
      receta: ''
    };

    this.citaSeleccionada = cita;

    const partes = cita.nombrePaciente?.split(' ') || [];
    this.consulta.pacienteNombre = partes[0] || '';
    this.consulta.pacienteApPaterno = partes[1] || '';
    this.consulta.pacienteApMaterno = partes[2] || '';

    this.consulta.fechaNacimiento = cita.fechaNacimiento ? cita.fechaNacimiento.substring(0, 10) : '';
    this.consulta.motivo = cita.motivo || '';
    (this.consulta as any).nss = cita.nss || '';
    (this.consulta as any).curp = cita.curp || '';

    this.selectedSection = 'formulario';
  }

  get nombrePacientePartes(): string[] {
    if (!this.citaSeleccionada?.nombrePaciente) return ['', '', ''];
    return this.citaSeleccionada.nombrePaciente.split(' ');
  }

  get paginatedCitas(): Cita[] {
    let citasFiltradas: Cita[] = this.citas;

    if (this.filtroEstado === 'pendiente') {
      citasFiltradas = this.citas.filter(c =>
        c.estado?.toLowerCase() !== 'cancelada' &&
        c.estado?.toLowerCase() !== 'completada'
      );
    } else if (this.filtroEstado === 'completada') {
      citasFiltradas = this.citas.filter(c => c.estado?.toLowerCase() === 'completada');
    } else if (this.filtroEstado === 'cancelada') {
      citasFiltradas = this.citas.filter(c => c.estado?.toLowerCase() === 'cancelada');
    }

    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    return citasFiltradas.slice(start, end);
  }

  filtrarPorEstado(estado: string) {
    this.filtroEstado = estado;
    this.pageIndex = 0;
  }

  get tituloSeccion(): string {
    switch (this.selectedSection) {
      case 'citas': return 'Gestión de Citas';
      case 'pacientes': return 'Lista de Pacientes';
      case 'formulario': return 'Consulta Médica';
      default: return 'Perfil Médico';
    }
  }

  // ================= PACIENTES =================

  filtrarPacientes() {
    this.searchSubject.next(this.filtroBusqueda);
  }

  limpiarBusqueda() {
    this.filtroBusqueda = '';
    this.pacientesFiltrados = [];
    this.mensajeBusqueda = 'Escriba al menos 1 letra del nombre o NSS del paciente';
  }

  get paginatedPacientes(): Patient[] {
    const start = this.pageIndexPacientes * this.pageSizePacientes;
    const end = start + this.pageSizePacientes;
    return this.pacientesFiltrados.slice(start, end);
  }

  pacienteSeleccionado!: Patient;
  expedienteSeleccionado: any;
  mostrarFormularioExpediente: boolean = false;
  modoCreacionExpediente: boolean = false;

  nuevoExpediente = {
    ant_heredofamiliares: '',
    ant_patologicos: '',
    ant_quirurgicos: '',
    ant_alergicos: '',
    enf_cronicas: '',
    ant_ginecoobstetricos: '',
    observaciones: ''
  };

  pacienteHistorial: any = null;
  historialConsultas: any[] = [];

  verHistorialPaciente(paciente: any) {
    this.pacienteHistorial = paciente;
    this.selectedSection = 'historialPaciente';

    this.citaService.obtenerCitasPorPaciente(paciente.idPaciente).subscribe({
      next: (citas: Cita[]) => {
        this.historialConsultas = citas.filter(c => c.estado?.toLowerCase() === 'completada');
      },
      error: (err) => {
        console.error('Error al obtener historial', err);
        this.historialConsultas = [];
      }
    });
  }

  verDetalle(consulta: Cita) {
    this.dialog.open(DetalleConsultaComponent, {
      width: '800px',
      data: consulta
    });
  }

  descargarExpediente(idPaciente: number) {
    this.patientService.getExpedientesByPaciente(idPaciente).subscribe({
      next: (resp: any) => {
        const exp = resp?.data;
        if (!exp) {
          Swal.fire({ icon: 'info', title: 'Sin expediente', text: 'Este paciente aún no cuenta con un expediente clínico.' });
          return;
        }
        this.generarPDF({ data: [exp] });
      },
      error: () => {
        Swal.fire({ icon: 'info', title: 'Sin expediente', text: 'Este paciente aún no cuenta con un expediente clínico.' });
      }
    });
  }

  generarPDF(expediente: any) {
    const lista = expediente?.data ?? [];
    if (!lista || lista.length === 0) { Swal.fire('Error', 'No hay datos del expediente', 'error'); return; }

    const exp = lista[0];
    if (!exp) { Swal.fire('Error', 'No hay datos del expediente', 'error'); return; }

    const doc = new jsPDF();
    const safe = (v: any) => (v ? v : 'No especificado');
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFillColor(31, 58, 95);
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('EXPEDIENTE CLÍNICO', 14, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const fechaActual = new Date();
    const fechaFormateada = `${String(fechaActual.getDate()).padStart(2,'0')}/${String(fechaActual.getMonth()+1).padStart(2,'0')}/${fechaActual.getFullYear()}`;
    doc.text(`Folio: ${safe(exp.folio)}`, 14, 26);
    doc.text(`Fecha: ${fechaFormateada}`, pageW - 14, 26, { align: 'right' });
    const nombrePaciente = `${safe(exp.idPaciente?.nombre)} ${safe(exp.idPaciente?.apPaterno)} ${safe(exp.idPaciente?.apMaterno)}`;
    doc.text(`Paciente: ${nombrePaciente}`, 14, 34);
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
        wrapped.forEach((l: string) => { doc.text(l, 75, y); y += 6; });
      });
      y += 3;
    };

    seccion('Antecedentes');
    campo('Heredofamiliares:', exp.ant_heredofamiliares);
    campo('Patológicos:', exp.ant_patologicos);
    campo('Quirúrgicos:', exp.ant_quirurgicos);
    seccion('Condiciones Médicas');
    campo('Alergias:', exp.ant_alergicos);
    campo('Enf. Crónicas:', exp.enf_cronicas);
    seccion('Ginecoobstétricos');
    campo('Detalles:', exp.ant_ginecoobstetricos);
    seccion('Observaciones Generales');
    campo('Notas:', exp.observaciones);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Sistema Hospitalario H+ Medical', pageW / 2, 285, { align: 'center' });
    window.open(doc.output('bloburl').toString());
  }

  guardarActualizacionExpediente() {
    if (!this.pacienteSeleccionado) { Swal.fire('Error', 'No hay paciente seleccionado', 'error'); return; }

    if (this.modoCreacionExpediente) {
      const nuevo = {
        ...this.nuevoExpediente,
        idPaciente: { idPaciente: this.pacienteSeleccionado.idPaciente },
        medico: { idMedico: this.medicoId }
      };
      this.patientService.crearExpediente(nuevo).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Expediente creado correctamente', 'success');
          this.modoCreacionExpediente = false;
          this.mostrarFormularioExpediente = false;
          this.nuevoExpediente = { ant_heredofamiliares: '', ant_patologicos: '', ant_quirurgicos: '', ant_alergicos: '', enf_cronicas: '', ant_ginecoobstetricos: '', observaciones: '' };
        },
        error: () => { Swal.fire('Error', 'No se pudo crear el expediente', 'error'); }
      });
      return;
    }

    if (!this.expedienteSeleccionado?.idExpediente) { Swal.fire('Error', 'No hay expediente seleccionado', 'error'); return; }

    const cambios: any = {};
    Object.keys(this.nuevoExpediente).forEach((key) => {
      const value = (this.nuevoExpediente as any)[key];
      if (value && value.trim() !== '') cambios[key] = value;
    });

    if (Object.keys(cambios).length === 0) { Swal.fire('Aviso', 'No hay información para actualizar', 'info'); return; }

    this.patientService.actualizarExpediente(this.expedienteSeleccionado.idExpediente, cambios).subscribe({
      next: () => {
        this.expedienteSeleccionado = { ...this.expedienteSeleccionado, ...cambios };
        Swal.fire('Éxito', 'Expediente actualizado correctamente', 'success');
        this.mostrarFormularioExpediente = false;
        this.nuevoExpediente = { ant_heredofamiliares: '', ant_patologicos: '', ant_quirurgicos: '', ant_alergicos: '', enf_cronicas: '', ant_ginecoobstetricos: '', observaciones: '' };
      },
      error: () => { Swal.fire('Error', 'No se pudo actualizar', 'error'); }
    });
  }

  abrirAgregarExpediente(paciente: Patient) {
    this.pacienteSeleccionado = paciente;
    this.patientService.getExpedientesByPaciente(paciente.idPaciente).subscribe({
      next: (resp: any) => {
        const activo = resp?.data;
        if (!activo) {
          Swal.fire({ icon: 'info', title: 'Sin expediente', text: 'Este paciente aún no tiene expediente clínico.', confirmButtonText: 'Crear expediente' })
            .then(result => { if (result.isConfirmed) { this.modoCreacionExpediente = true; this.mostrarFormularioExpediente = true; this.expedienteSeleccionado = null; } });
          return;
        }
        this.modoCreacionExpediente = false;
        this.expedienteSeleccionado = activo;
        this.mostrarFormularioExpediente = true;
      },
      error: () => {
        Swal.fire({ icon: 'info', title: 'Sin expediente', text: 'Este paciente aún no tiene expediente clínico.', confirmButtonText: 'Crear expediente' })
          .then(result => { if (result.isConfirmed) { this.modoCreacionExpediente = true; this.mostrarFormularioExpediente = true; this.expedienteSeleccionado = null; } });
      }
    });
  }

  // ================= FORMULARIO CONSULTA =================
  consulta: {
    pacienteNombre: string; pacienteApPaterno: string; pacienteApMaterno: string;
    fechaNacimiento: string; sexo: string; tipoSangre: string; telefono: string;
    correo: string; telefonoEmergencia: string; nss: string; curp: string;
    antHeredofamiliares: string; antPatologicos: string; antQuirurgicos: string;
    antAlergicos: string; enfCronicas: string; antGinecoObstetricos: string;
    observaciones: string; motivo: string; presionArterial: string;
    frecuenciaCardiaca: number; temperatura: number; peso: number; estatura: number;
    medicamentos: string; diagnostico: string; observacionesMedicas: string; receta: string;
    cie10: string; tratamiento: string; funAlta: string; vencimiento: string;
    presentacion: string; dosis: string; frecuencia: string; duracion: string; cantidad: number;
    frecuenciaRespiratoria: number; spo2: number; glucosa: number;
    tipoDiagnostico: string; indicaciones: string; folio: string;
    listaMedicamentos: Array<{ nombre: string; presentacion: string; dosis: string; frecuencia: string; duracion: string; cantidad: number; via: string; viaPersonalizada?: string; }>;
  } = {
    pacienteNombre: '', pacienteApPaterno: '', pacienteApMaterno: '',
    fechaNacimiento: '', sexo: '', tipoSangre: '', telefono: '', correo: '',
    telefonoEmergencia: '', nss: '', curp: '', antHeredofamiliares: '',
    antPatologicos: '', antQuirurgicos: '', antAlergicos: '', enfCronicas: '',
    antGinecoObstetricos: '', observaciones: '', motivo: '', presionArterial: '',
    frecuenciaCardiaca: 0, temperatura: 0, peso: 0, estatura: 0, medicamentos: '',
    diagnostico: '', observacionesMedicas: '', receta: '', cie10: 'Z00.0',
    tratamiento: '', funAlta: '', vencimiento: new Date().toISOString().substring(0, 10),
    presentacion: 'N/A', dosis: 'N/A', frecuencia: 'N/A', duracion: 'N/A', cantidad: 1,
    frecuenciaRespiratoria: 0, spo2: 0, glucosa: 0, tipoDiagnostico: '',
    indicaciones: '', folio: '', listaMedicamentos: []
  };

  agregarMedicamento() {
    this.consulta.listaMedicamentos.push({ nombre: '', presentacion: '', dosis: '', frecuencia: '', duracion: '', cantidad: 1, via: 'oral', viaPersonalizada: '' });
  }

  onViaChange(med: any) {
    if (med.via !== 'otra') med.viaPersonalizada = '';
  }

  tiposSangre = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];

  guardarConsulta() {
    if (!this.citaSeleccionada) { Swal.fire('Error', 'No hay cita seleccionada', 'error'); return; }

    const request = {
      signosVitales: {
        pesoKg: Number(this.consulta.peso),
        tallaM: Number(this.consulta.estatura),
        presionArterial: this.consulta.presionArterial,
        frecuenciaCardiaca: Number(this.consulta.frecuenciaCardiaca),
        frecuenciaRespiratoria: Number(this.consulta.frecuenciaRespiratoria || 0),
        temperatura: Number(this.consulta.temperatura),
        spo2: Number(this.consulta.spo2 || 0),
        glucosa: Number(this.consulta.glucosa || 0)
      },
      diagnostico: {
        cie10: this.consulta.cie10,
        descripcion: this.consulta.diagnostico,
        tipo: this.consulta.tipoDiagnostico || 'secundario',
        medicamentosBase: this.consulta.medicamentos || 'Ninguno',
        tratamiento: this.consulta.tratamiento,
        indicaciones: this.consulta.indicaciones || '',
        funAlta: this.consulta.funAlta || ''
      },
      receta: {
        folio: this.consulta.folio || 'Sin Folio',
        vencimiento: this.consulta.vencimiento,
        medicamentos: this.consulta.listaMedicamentos?.map(m => ({
          nombre: m.nombre, presentacion: m.presentacion || 'N/A',
          dosis: m.dosis || 'N/A', frecuencia: m.frecuencia || 'N/A',
          duracion: m.duracion || 'N/A', cantidad: Number(m.cantidad) || 1,
          via: m.via === 'otra' ? (m.viaPersonalizada || 'otra') : m.via
        })) || []
      }
    };

    this.citaService.completarCita(this.citaSeleccionada.idCita, request).subscribe({
      next: () => {
        this.snackBar.open('Consulta guardada correctamente', 'Cerrar', { duration: 3000 });
        this.citaSeleccionada.estado = 'completada';
        this.selectedSection = 'citas';
      },
      error: (err) => {
        console.error('Error al guardar la consulta:', err);
        Swal.fire('Error', 'No se pudo guardar la consulta', 'error');
      }
    });
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

  calcularEdad(fechaNacimiento?: string | Date | null): number {
    if (!fechaNacimiento) return 0;
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  get totalCitasHoy(): number { return this.citas.length; }

  get citasPendientes(): number {
    return this.citas.filter(c => c.estado?.toLowerCase() !== 'cancelada' && c.estado?.toLowerCase() !== 'completada').length;
  }

  get citasCanceladas(): number {
    return this.citas.filter(c => c.estado?.toLowerCase() === 'cancelada').length;
  }

  get citasCompletadas(): number {
    return this.citas.filter(c => c.estado?.toLowerCase() === 'completada').length;
  }

  getFechaHoy(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }

  formatearHora12(hora: string): string {
    if (!hora) return '--';
    const [h, m] = hora.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hora12 = h % 12 === 0 ? 12 : h % 12;
    return `${hora12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  get proximaCitaInfo(): { hora: string; fecha: string; esHoy: boolean } {
    const fechaHoy = this.getFechaHoy();
    const pendientes = this.citas
      .filter(c => c.estado?.toLowerCase() !== 'cancelada' && c.estado?.toLowerCase() !== 'completada')
      .sort((a, b) => `${a.fecha}T${a.hora || '00:00'}`.localeCompare(`${b.fecha}T${b.hora || '00:00'}`));

    if (pendientes.length === 0) return { hora: '--', fecha: '', esHoy: false };

    const proxima = pendientes[0];
    const esHoy = proxima.fecha === fechaHoy;
    return { hora: this.formatearHora12(proxima.hora), fecha: esHoy ? 'Hoy' : this.formatearFechaMedico(proxima.fecha), esHoy };
  }

  formatearFechaMedico(fecha: string): string {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${day} ${meses[parseInt(month) - 1]} ${year}`;
  }

  // ================= PERFIL =================

  toggleEdicion() { this.modoEdicion = !this.modoEdicion; }

  guardarPerfil() {
    this.guardando = true;
    this.authService.editarPerfilMedico(this.medico).subscribe({
      next: (res: Medico) => {
        this.medico = res;
        this.modoEdicion = false;
        this.guardando = false;
        this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'], horizontalPosition: 'right', verticalPosition: 'bottom' });
      },
      error: (err) => {
        console.error('Error al actualizar perfil', err);
        this.guardando = false;
        this.snackBar.open('Ocurrió un error al actualizar el perfil', 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'], horizontalPosition: 'right', verticalPosition: 'bottom' });
      }
    });
  }
}