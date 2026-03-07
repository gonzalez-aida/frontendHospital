import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  datosPersonalesForm!: FormGroup;
  contactoForm!: FormGroup;
  direccionForm!: FormGroup;

  registroExitoso = false;
  loading = false;
  hidePassword = true;
  passwordStrength = 0;

  @ViewChild('successSound') successSound!: ElementRef<HTMLAudioElement>;

  dias = Array.from({ length: 31 }, (_, i) => i + 1);
  anios = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  tiposSangre = ['O+','O-','A+','A-','B+','B-','AB+','AB-'];

  meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {

    // =========================
    // PASO 1 - DATOS PERSONALES
    // =========================
    this.datosPersonalesForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/)
      ]],
      apPaterno: ['', [
        Validators.required,
        Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/)
      ]],
      apMaterno: ['', [
        Validators.required,
        Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/)
      ]],
      nss: ['', [
        Validators.required,
        Validators.pattern(/^\d{11}$/)
      ]],
      curp: ['', [
        Validators.required,
        Validators.pattern(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/)
      ]],
      dia: ['', Validators.required],
      mes: ['', Validators.required],
      anio: ['', Validators.required],
      sexo: ['', Validators.required],
      tipoSangre: ['', Validators.required]
    });

    // =========================
    // PASO 2 - CONTACTO
    // =========================
    this.contactoForm = this.fb.group({
      correo: ['', [
        Validators.required,
        Validators.email
      ]],
      contrasena: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&.#_-]).+$/)
      ]],
      telefono: ['', [
        Validators.required,
        Validators.pattern(/^\d{10}$/)
      ]],
      telefonoEmergencia: ['', [
        Validators.required,
        Validators.pattern(/^\d{10}$/)
      ]]
    });

    // =========================
    // PASO 3 - DIRECCIÓN
    // =========================
    this.direccionForm = this.fb.group({
      calle: ['', Validators.required],
      numExterior: ['', Validators.required],
      numInterior: [''],
      colonia: ['', Validators.required],
      cp: ['', [
        Validators.required,
        Validators.pattern(/^\d{5}$/)
      ]],
      localidad: ['', Validators.required],
      estado: ['', Validators.required]
    });

    // =========================
    // BARRA SEGURIDAD
    // =========================
    this.contactoForm.get('contrasena')?.valueChanges.subscribe(value => {
      this.passwordStrength = this.calcularSeguridad(value);
    });

    // =========================
    // TRANSFORMACIONES
    // =========================

    const capitalizar = (control: any) => {
      control?.valueChanges.subscribe((valor: string) => {
        if (!valor) return;
        const formateado = valor
          .toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase());

        if (valor !== formateado) {
          control.setValue(formateado, { emitEvent: false });
        }
      });
    };

    capitalizar(this.datosPersonalesForm.get('nombre'));
    capitalizar(this.datosPersonalesForm.get('apPaterno'));
    capitalizar(this.datosPersonalesForm.get('apMaterno'));
    capitalizar(this.direccionForm.get('colonia'));
    capitalizar(this.direccionForm.get('localidad'));
    capitalizar(this.direccionForm.get('estado'));

    this.datosPersonalesForm.get('curp')?.valueChanges.subscribe(valor => {
      if (!valor) return;
      const mayus = valor.toUpperCase();
      if (valor !== mayus) {
        this.datosPersonalesForm.get('curp')?.setValue(mayus, { emitEvent: false });
      }
    });

    this.contactoForm.get('correo')?.valueChanges.subscribe(valor => {
      if (!valor) return;
      const minus = valor.toLowerCase();
      if (valor !== minus) {
        this.contactoForm.get('correo')?.setValue(minus, { emitEvent: false });
      }
    });

    const soloNumeros = (control: any) => {
      control?.valueChanges.subscribe((valor: string) => {
        if (!valor) return;
        const limpio = valor.replace(/\D/g, '');
        if (valor !== limpio) {
          control.setValue(limpio, { emitEvent: false });
        }
      });
    };

    soloNumeros(this.contactoForm.get('telefono'));
    soloNumeros(this.contactoForm.get('telefonoEmergencia'));
  }

  calcularSeguridad(password: string): number {
    let fuerza = 0;
    if (!password) return 0;
    if (password.length >= 8) fuerza++;
    if (/[A-Z]/.test(password)) fuerza++;
    if (/[a-z]/.test(password)) fuerza++;
    if (/\d/.test(password)) fuerza++;
    if (/[@$!%*?&.#_-]/.test(password)) fuerza++;
    return fuerza;
  }

  getColorBarra(): string {
    if (this.passwordStrength <= 2) return '#e53935';
    if (this.passwordStrength <= 4) return '#fb8c00';
    return '#43a047';
  }

  fechaValida(): boolean {
    const { dia, mes, anio } = this.datosPersonalesForm.value;
    if (!dia || !mes || !anio) return false;

    const fecha = new Date(anio, mes - 1, dia);

    return fecha.getFullYear() === anio &&
           fecha.getMonth() === mes - 1 &&
           fecha.getDate() === dia;
  }

  registrar() {

    if (!this.fechaValida()) return;

    if (
      this.datosPersonalesForm.invalid ||
      this.contactoForm.invalid ||
      this.direccionForm.invalid
    ) return;

    this.loading = true;

    const datos = this.datosPersonalesForm.value;
    const contacto = this.contactoForm.value;
    const direccion = this.direccionForm.value;

    const fechaNacimiento = new Date(
      datos.anio,
      datos.mes - 1,
      datos.dia
    ).toISOString().split('T')[0];

    const payload = {
      correo: contacto.correo,
      contrasena: contacto.contrasena,
      nss: datos.nss,
      curp: datos.curp,
      nombre: datos.nombre,
      apPaterno: datos.apPaterno,
      apMaterno: datos.apMaterno,
      fechaNacimiento: fechaNacimiento,
      sexo: datos.sexo,
      tipoSangre: datos.tipoSangre,
      telefono: contacto.telefono,
      telefonoEmergencias: contacto.telefonoEmergencia,
      direccion: {
        calle: direccion.calle,
        numExt: direccion.numExterior,
        numInt: direccion.numInterior,
        colonia: direccion.colonia,
        cp: direccion.cp,
        localidad: direccion.localidad,
        estado: direccion.estado
      }
    };

    this.authService.registerPaciente(payload).subscribe({
      next: () => {
        this.registroExitoso = true;
        this.successSound.nativeElement.play();

        setTimeout(() => {
          this.router.navigate(['/login/login']);
        }, 3000);

        this.loading = false;
      },
      error: (error) => {
        console.error("Error en registro:", error);
        alert(error.error?.error || "Error al registrar paciente");
        this.loading = false;
      }
    });
  }

  irLogin() {
    this.router.navigate(['/login/login']);
  }
}