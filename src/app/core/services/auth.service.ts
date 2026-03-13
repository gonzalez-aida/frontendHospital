import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { User, LoginRequest, LoginResponse, ExchangeResponse } from '../../shared/models/user.model';
import { Medico } from '../../shared/models/medico.model';

import { environment } from '../../../environments/environment';

@Injectable({
providedIn: 'root'
})
export class AuthService {

private userKey = 'h-moscatti-user';

private currentUserSubject: BehaviorSubject<User | null>;
public currentUser: Observable<User | null>;

constructor(
private http: HttpClient,
private router: Router
) {


const storedUser = localStorage.getItem(this.userKey);

this.currentUserSubject = new BehaviorSubject<User | null>(
  storedUser ? JSON.parse(storedUser) : null
);

this.currentUser = this.currentUserSubject.asObservable();


}

// Obtener usuario actual
public get currentUserValue(): User | null {
return this.currentUserSubject.value;
}

// Saber si está autenticado
isAuthenticated(): boolean {
return !!this.currentUserSubject.value;
}

// Paso 1 — login
login(credentials: LoginRequest): Observable<LoginResponse> {
return this.http.post<LoginResponse>(
`${environment.authUrl}/api/auth/login`,
credentials,
{ withCredentials: true }
);
}

// Paso 2 — redirigir al servidor OAuth
redirectToAuthorize(): void {


const params = new URLSearchParams({
  response_type: 'code',
  client_id: environment.clientId,
  redirect_uri: environment.redirectUri,
  scope: 'read write'
});

window.location.href =
  `${environment.authUrl}/oauth2/authorize?${params}`;


}

// Paso 3 — intercambio de código
exchangeCode(code: string): Observable<ExchangeResponse> {


return this.http.get<ExchangeResponse>(
  `${environment.authUrl}/api/auth/exchange-code`,
  {
    params: { code },
    withCredentials: true
  }
).pipe(
  tap(response => {

    const user: User = {
      idUsuario: response.idUsuario,
      correo: response.correo,
      rol: response.rol
    };

    this.setUser(user);
    this.currentUserSubject.next(user);

  })
);


}

// Obtener perfil médico
obtenerPerfilMedico(): Observable<Medico> {
return this.http.get<Medico>(
`${environment.apiUrl}/medico/mi-perfil`,
{ withCredentials: true }
);
}

// Editar perfil médico
editarPerfilMedico(data: Medico): Observable<Medico> {
  return this.http.put<Medico>(
    `${environment.apiUrl}/medico/mi-perfil`,
    data,
    { withCredentials: true }
  );
}

// Logout
logout(): void {


this.http.post(
  `${environment.authUrl}/api/auth/logout`,
  {},
  { withCredentials: true }
).subscribe({

  complete: () => this.clearSession(),
  error: () => this.clearSession()

});


}

private setUser(user: User): void {
localStorage.setItem(this.userKey, JSON.stringify(user));
}

private clearSession(): void {


localStorage.removeItem(this.userKey);

this.currentUserSubject.next(null);

this.router.navigate(['/login']);

}

// =============================
// REGISTRO DE PACIENTE
// =============================
registerPaciente(data: any): Observable<any> {
  return this.http.post(
    `${environment.apiUrl}/paciente/registro`,
    data
  );
}
}

