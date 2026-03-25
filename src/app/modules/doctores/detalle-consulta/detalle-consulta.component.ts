import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Cita } from '../../../shared/models/cita.model';

@Component({
  selector: 'app-detalle-consulta',
  templateUrl: './detalle-consulta.component.html',
  styleUrls: ['./detalle-consulta.component.scss']
})
export class DetalleConsultaComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public consulta: Cita,
    private dialogRef: MatDialogRef<DetalleConsultaComponent>
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }
}