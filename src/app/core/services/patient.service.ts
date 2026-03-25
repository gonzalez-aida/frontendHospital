import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient, PatientFormData } from '../../shared/models/patient.model';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class PatientService {
    private apiUrl = `${environment.apiUrl}/paciente`;

    constructor(private http: HttpClient) { }

    getPatients(): Observable<Patient[]> {
        return this.http.get<Patient[]>(this.apiUrl);
    }

    getPatientById(id: number): Observable<Patient> {
        return this.http.get<Patient>(`${this.apiUrl}/${id}`);
    }

    createPatient(patientData: PatientFormData): Observable<Patient> {
        return this.http.post<Patient>(this.apiUrl, patientData);
    }

    updatePatient(id: number, patientData: Partial<PatientFormData>): Observable<Patient> {
        return this.http.put<Patient>(`${this.apiUrl}/${id}`, patientData);
    }

    deletePatient(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    searchPatients(filtro: string) {
        return this.http.get<Patient[]>(
            `${this.apiUrl}/buscar?filtro=${filtro}`
        );
    }


    // PARA EL EXPEDIENTE

    getExpedientesByPaciente(idPaciente: number) {
        return this.http.get<any>(`http://localhost:8081/expedientes/paciente/${idPaciente}`);
    }

actualizarExpediente(idExpediente: number, cambios: any) {
  return this.http.patch(
    `http://localhost:8081/expedientes/expediente-update/${idExpediente}`,
    cambios,
    { withCredentials: true }  // 🔥 obligatorio
  );
}

}