import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="dialog-container">

      <div class="dialog-header">
        <mat-icon class="warning-icon">event_busy</mat-icon>
        <h2>Cancelar Cita</h2>
      </div>

      <div class="dialog-content">
        <p>
          Está a punto de cancelar la cita del paciente:
        </p>

        <div class="patient-box">
          {{ data.nombre }}
        </div>

        <p class="confirmation-text">
          Esta acción no se puede deshacer.
        </p>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="close(false)">
          Mantener Cita
        </button>

        <button mat-flat-button color="warn" (click)="close(true)">
          Confirmar Cancelación
        </button>
      </div>

    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 10px;
      font-family: 'Segoe UI', sans-serif;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }

    .warning-icon {
      color: #c62828;
      font-size: 28px;
    }

    .dialog-content p {
      margin: 8px 0;
      color: #555;
    }

    .patient-box {
      background: #f5f7fa;
      padding: 12px;
      border-radius: 8px;
      font-weight: 600;
      color: #1f3a5f;
      margin: 10px 0;
    }

    .confirmation-text {
      font-size: 13px;
      color: #888;
    }

    .dialog-actions {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class ConfirmDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}