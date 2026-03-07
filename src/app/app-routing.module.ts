import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { CallbackComponent } from './modules/auth/login/callback.component';

const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // Callback OAuth
  {
    path: 'callback',
    component: CallbackComponent
  },

  // Módulo de autenticación (login, register, etc)
  {
    path: 'login',
    loadChildren: () =>
      import('./modules/auth/auth.module').then(m => m.AuthModule)
  },

  // DASHBOARD MÉDICO
  {
    path: 'dashboard-medico',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/dasboards/dashboard-medico/dashboard-medico.module')
        .then(m => m.DashboardModuleMedico)
  },

  // DASHBOARD PACIENTE
  {
    path: 'dashboard-paciente',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/dasboards/dashboard-paciente/dashboard-paciente.module')
        .then(m => m.DashboardModulePaciente)
  },

  // PACIENTES
  {
    path: 'pacientes',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/pacientes/pacientes.module')
        .then(m => m.PacientesModule)
  },

  // CITAS
  {
    path: 'citas',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/citas/citas.module')
        .then(m => m.CitasModule)
  },

  // EXPEDIENTES MÉDICOS
  {
    path: 'expedientes-medicos',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/expedientes-medicos/expedientes-medicos.module')
        .then(m => m.ExpedientesMedicosModule)
  },

  // DOCTORES
  {
    path: 'doctores',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/doctores/doctores.module')
        .then(m => m.DoctoresModule)
  },

  // REPORTES
  {
    path: 'reportes',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/reportes/reportes.module')
        .then(m => m.ReportesModule)
  },

  // Cualquier ruta desconocida
  {
    path: '**',
    redirectTo: 'login'
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }