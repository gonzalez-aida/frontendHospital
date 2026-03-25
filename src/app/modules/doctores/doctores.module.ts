import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

import { DoctoresRoutingModule } from './doctores-routing.module';
import { DetalleConsultaComponent } from './detalle-consulta/detalle-consulta.component';

@NgModule({
  declarations: [
    DetalleConsultaComponent
  ],
  imports: [
    CommonModule,
    DoctoresRoutingModule,
    MatDialogModule
  ]
})
export class DoctoresModule { }