import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cita } from '../../shared/models/cita.model';
import { environment } from '../../../environments/environment'; // 🔹 importamos environment

@Injectable({
  providedIn: 'root'
})
export class CitaService {

  // 🔹 Ahora usa environment.apiUrl
  private apiUrl = `${environment.apiUrl}/cita`;

  constructor(private http: HttpClient) {}

  // 🔹 Trae citas por paciente
  obtenerCitasPorPaciente(idPaciente: number): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}/paciente/${idPaciente}`, { withCredentials: true });
  }

  // 🔹 Trae todas las citas de los pacientes de un médico
  obtenerCitasPorMedico(idMedico: number): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}/medico/${idMedico}`, { withCredentials: true });
  }

  // 🔹 Traer todas las citas (temporal si no hay endpoint de médico)
  obtenerTodasLasCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}`, { withCredentials: true });
  }
}