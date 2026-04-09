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
obtenerMisCitas(): Observable<Cita[]> {
  return this.http.get<Cita[]>(`${this.apiUrl}/citas-medico`, { withCredentials: true });
}

  // 🔹 Traer todas las citas (temporal si no hay endpoint de médico)
  obtenerTodasLasCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}`, { withCredentials: true });
  }

  // Agendar cita para un paciente
agendarCita(data: any): Observable<Cita> {
  return this.http.post<Cita>(
    `${this.apiUrl}/agendar`,
    data,
    { withCredentials: true }  // ⚠️ NO necesitas token manualmente
  );
}

// Buscar citas de un paciente
searchCitasPaciente(idPaciente: number, filtro: string): Observable<Cita[]> {
  return this.http.get<Cita[]>(
    `${this.apiUrl}/paciente/${idPaciente}/buscar?filtro=${filtro}`,
    { withCredentials: true }
  );
}

  // 🔹 Cancelar las citas
  cancelarCita(idCita: number): Observable<any> {
  return this.http.put(
    `${this.apiUrl}/cancelar/${idCita}`,
    {},
    { withCredentials: true }
  );
}

  // 🔹 Completar las citas
completarCita(idCita: number, data: any) {
  return this.http.put(
    `${this.apiUrl}/${idCita}/completar`,
    data,
    { withCredentials: true }
  );
}

obtenerMisRecetas(): Observable<any[]> {
  return this.http.get<any[]>(
    `${environment.apiUrl}/receta/mis-recetas`,
    { withCredentials: true }
  );
}

}