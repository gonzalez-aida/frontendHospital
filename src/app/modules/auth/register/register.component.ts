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
  showPasswordTooltip = false;

  @ViewChild('successSound') successSound!: ElementRef<HTMLAudioElement>;

  dias = Array.from({ length: 31 }, (_, i) => i + 1);
  anios = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  tiposSangre = ['O+','O-','A+','A-','B+','B-','AB+','AB-'];

  meses = [
    { valor: 1,  nombre: 'Enero' },
    { valor: 2,  nombre: 'Febrero' },
    { valor: 3,  nombre: 'Marzo' },
    { valor: 4,  nombre: 'Abril' },
    { valor: 5,  nombre: 'Mayo' },
    { valor: 6,  nombre: 'Junio' },
    { valor: 7,  nombre: 'Julio' },
    { valor: 8,  nombre: 'Agosto' },
    { valor: 9,  nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  // ── Catálogo de estados y municipios principales ──
  estadosMexico: string[] = [
    'Aguascalientes','Baja California','Baja California Sur','Campeche',
    'Chiapas','Chihuahua','Ciudad de México','Coahuila','Colima','Durango',
    'Estado de México','Guanajuato','Guerrero','Hidalgo','Jalisco',
    'Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla',
    'Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora',
    'Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas'
  ];

  municipiosPorEstado: { [estado: string]: string[] } = {
    'Aguascalientes': ['Aguascalientes','Asientos','Calvillo','Cosío','El Llano','Jesús María','Pabellón de Arteaga','Rincón de Romos','San Francisco de los Romo','Tepezalá'],
    'Baja California': ['Ensenada','Mexicali','Playas de Rosarito','Tecate','Tijuana'],
    'Baja California Sur': ['Comondú','La Paz','Loreto','Los Cabos','Mulegé'],
    'Campeche': ['Calkiní','Campeche','Carmen','Champotón','Escárcega','Hecelchakán','Hopelchén','Palizada','Tenabo'],
    'Chiapas': ['Comitán de Domínguez','Ocosingo','San Cristóbal de las Casas','Tapachula','Tuxtla Gutiérrez'],
    'Chihuahua': ['Chihuahua','Ciudad Juárez','Cuauhtémoc','Delicias','Hidalgo del Parral','Ojinaga'],
    'Ciudad de México': ['Álvaro Obregón','Azcapotzalco','Benito Juárez','Coyoacán','Cuajimalpa','Cuauhtémoc','Gustavo A. Madero','Iztacalco','Iztapalapa','La Magdalena Contreras','Miguel Hidalgo','Milpa Alta','Tláhuac','Tlalpan','Venustiano Carranza','Xochimilco'],
    'Coahuila': ['Monclova','Piedras Negras','Ramos Arizpe','Saltillo','Torreón'],
    'Colima': ['Armería','Colima','Comala','Coquimatlán','Cuauhtémoc','Ixtlahuacán','Manzanillo','Minatitlán','Tecomán','Villa de Álvarez'],
    'Durango': ['Durango','El Salto','Gómez Palacio','Lerdo','Santiago Papasquiaro'],
    'Estado de México': ['Atizapán de Zaragoza','Ecatepec de Morelos','Metepec','Naucalpan de Juárez','Nezahualcóyotl','Tecámac','Tlalnepantla de Baz','Toluca','Tultitlán'],
    'Guanajuato': ['Celaya','Guanajuato','Irapuato','León','Salamanca','Silao de la Victoria'],
    'Guerrero': ['Acapulco de Juárez','Chilpancingo de los Bravo','Iguala de la Independencia','Taxco de Alarcón','Zihuatanejo de Azueta'],
    'Hidalgo': ['Mineral de la Reforma','Pachuca de Soto','Tizayuca','Tula de Allende','Tulancingo de Bravo'],
    'Jalisco': ['Guadalajara','Puerto Vallarta','Tlaquepaque','Tlajomulco de Zúñiga','Tonalá','Zapopan'],
    'Michoacán': ['Lázaro Cárdenas','Morelia','Uruapan','Zamora','Zitácuaro'],
    'Morelos': ['Cuernavaca','Cuautla','Jiutepec','Temixco','Xochitepec','Yautepec'],
    'Nayarit': ['Bahía de Banderas','Compostela','Tepic','Xalisco'],
    'Nuevo León': ['Apodaca','García','General Escobedo','Guadalupe','Monterrey','San Nicolás de los Garza','San Pedro Garza García','Santa Catarina'],
    'Oaxaca': ['Huajuapan de León','Juchitán de Zaragoza','Oaxaca de Juárez','Puerto Escondido','Salina Cruz','Tuxtepec'],
    'Puebla': ['Cholula','Puebla','San Martín Texmelucan','San Pedro Cholula','Tehuacán','Teziutlán'],
    'Querétaro': ['Corregidora','El Marqués','Ezequiel Montes','Jalpan de Serra','Pedro Escobedo','Querétaro','San Juan del Río','Tequisquiapan'],
    'Quintana Roo': ['Bacalar','Benito Juárez','Cancún','Chetumal','Cozumel','Felipe Carrillo Puerto','Isla Mujeres','Playa del Carmen','Tulum'],
    'San Luis Potosí': ['Ciudad Valles','Matehuala','Rioverde','San Luis Potosí','Soledad de Graciano Sánchez'],
    'Sinaloa': ['Ahome','Culiacán','Guasave','Mazatlán','Navolato'],
    'Sonora': ['Cajeme','Guaymas','Hermosillo','Navojoa','Nogales','San Luis Río Colorado'],
    'Tabasco': ['Cárdenas','Centro','Comalcalco','Cunduacán','Paraíso'],
    'Tamaulipas': ['Altamira','Ciudad Madero','Matamoros','Nuevo Laredo','Reynosa','Tampico','Victoria'],
    'Tlaxcala': ['Apizaco','Chiautempan','Huamantla','Santa Ana Chiautempan','Tlaxcala'],
    'Veracruz': ['Boca del Río','Coatzacoalcos','Córdoba','Minatitlán','Orizaba','Poza Rica de Hidalgo','Tuxpan','Veracruz','Xalapa'],
    'Yucatán': ['Kanasín','Mérida','Progreso','Umán','Valladolid'],
    'Zacatecas': ['Fresnillo','Guadalupe','Jerez','Loreto','Zacatecas']
  };

  municipiosFiltrados: string[] = [];

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
      dia:       ['', Validators.required],
      mes:       ['', Validators.required],
      anio:      ['', Validators.required],
      sexo:      ['', Validators.required],
      tipoSangre:['', Validators.required]
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
      calle:       ['', Validators.required],
      numExterior: ['', Validators.required],
      numInterior: [''],
      colonia:     ['', Validators.required],
      cp: ['', [
        Validators.required,
        Validators.pattern(/^\d{5}$/)
      ]],
      estado:    ['', Validators.required],
      localidad: ['', Validators.required]
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
          .replace(/(^|[\s\-])([a-záéíóúüñ])/gu, (_match: string, sep: string, letra: string) => sep + letra.toUpperCase());
        if (valor !== formateado) {
          control.setValue(formateado, { emitEvent: false });
        }
      });
    };

    capitalizar(this.datosPersonalesForm.get('nombre'));
    capitalizar(this.datosPersonalesForm.get('apPaterno'));
    capitalizar(this.datosPersonalesForm.get('apMaterno'));
    capitalizar(this.direccionForm.get('colonia'));

    // CURP → siempre mayúsculas, máx 18 chars
    this.datosPersonalesForm.get('curp')?.valueChanges.subscribe((valor: string) => {
      if (!valor) return;
      const mayus = valor.toUpperCase().slice(0, 18);
      if (valor !== mayus) {
        this.datosPersonalesForm.get('curp')?.setValue(mayus, { emitEvent: false });
      }
    });

    // NSS → solo números, máx 11 chars
    this.datosPersonalesForm.get('nss')?.valueChanges.subscribe((valor: string) => {
      if (!valor) return;
      const limpio = valor.replace(/\D/g, '').slice(0, 11);
      if (valor !== limpio) {
        this.datosPersonalesForm.get('nss')?.setValue(limpio, { emitEvent: false });
      }
    });

    // Correo → minúsculas
    this.contactoForm.get('correo')?.valueChanges.subscribe((valor: string) => {
      if (!valor) return;
      const minus = valor.toLowerCase();
      if (valor !== minus) {
        this.contactoForm.get('correo')?.setValue(minus, { emitEvent: false });
      }
    });

    // Teléfonos → solo números, máx 10 chars
    const soloNumeros = (control: any) => {
      control?.valueChanges.subscribe((valor: string) => {
        if (!valor) return;
        const limpio = valor.replace(/\D/g, '').slice(0, 10);
        if (valor !== limpio) {
          control.setValue(limpio, { emitEvent: false });
        }
      });
    };

    soloNumeros(this.contactoForm.get('telefono'));
    soloNumeros(this.contactoForm.get('telefonoEmergencia'));

    // CP → solo números, máx 5 chars
    this.direccionForm.get('cp')?.valueChanges.subscribe((valor: string) => {
      if (!valor) return;
      const limpio = valor.replace(/\D/g, '').slice(0, 5);
      if (valor !== limpio) {
        this.direccionForm.get('cp')?.setValue(limpio, { emitEvent: false });
      }
    });
  }

  // ── Tooltip contraseña ──

  /** Verifica si la contraseña cumple una regla específica */
  checkPwRule(rule: 'length' | 'upper' | 'lower' | 'number' | 'symbol'): boolean {
    const val = this.contactoForm.get('contrasena')?.value || '';
    switch (rule) {
      case 'length': return val.length >= 8;
      case 'upper':  return /[A-Z]/.test(val);
      case 'lower':  return /[a-z]/.test(val);
      case 'number': return /\d/.test(val);
      case 'symbol': return /[@$!%*?&.#_-]/.test(val);
    }
  }

  // ── Seguridad de contraseña ──

  calcularSeguridad(password: string): number {
    let fuerza = 0;
    if (!password) return 0;
    if (password.length >= 8)            fuerza++;
    if (/[A-Z]/.test(password))          fuerza++;
    if (/[a-z]/.test(password))          fuerza++;
    if (/\d/.test(password))             fuerza++;
    if (/[@$!%*?&.#_-]/.test(password))  fuerza++;
    return fuerza;
  }

  getColorBarra(): string {
    if (this.passwordStrength <= 1) return '#e53935';
    if (this.passwordStrength === 2) return '#fb8c00';
    if (this.passwordStrength === 3) return '#fdd835';
    if (this.passwordStrength === 4) return '#7cb342';
    return '#43a047';
  }

  // ── Estado / Municipio ──

  onEstadoChange(estado: string): void {
    this.municipiosFiltrados = this.municipiosPorEstado[estado] || [];
    this.direccionForm.get('localidad')?.setValue('');
    this.direccionForm.get('localidad')?.enable();
  }

  // ── Fecha y registro ──

  fechaValida(): boolean {
    const { dia, mes, anio } = this.datosPersonalesForm.value;
    if (!dia || !mes || !anio) return false;
    const fecha = new Date(anio, mes - 1, dia);
    return fecha.getFullYear() === anio &&
           fecha.getMonth()    === mes - 1 &&
           fecha.getDate()     === dia;
  }

  registrar() {
    if (!this.fechaValida()) return;

    if (
      this.datosPersonalesForm.invalid ||
      this.contactoForm.invalid ||
      this.direccionForm.invalid
    ) return;

    this.loading = true;

    const datos    = this.datosPersonalesForm.value;
    const contacto = this.contactoForm.value;
    const direccion = this.direccionForm.value;

    const fechaNacimiento = new Date(
      datos.anio,
      datos.mes - 1,
      datos.dia
    ).toISOString().split('T')[0];

    const payload = {
      correo:      contacto.correo,
      contrasena:  contacto.contrasena,
      nss:         datos.nss,
      curp:        datos.curp,
      nombre:      datos.nombre,
      apPaterno:   datos.apPaterno,
      apMaterno:   datos.apMaterno,
      fechaNacimiento,
      sexo:        datos.sexo,
      tipoSangre:  datos.tipoSangre,
      telefono:    contacto.telefono,
      telefonoEmergencias: contacto.telefonoEmergencia,
      direccion: {
        calle:    direccion.calle,
        numExt:   direccion.numExterior,
        numInt:   direccion.numInterior,
        colonia:  direccion.colonia,
        cp:       direccion.cp,
        localidad:direccion.localidad,
        estado:   direccion.estado
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
      error: (error: any) => {
        console.error('Error en registro:', error);
        alert(error.error?.error || 'Error al registrar paciente');
        this.loading = false;
      }
    });
  }

  irLogin() {
    this.router.navigate(['/login/login']);
  }
}