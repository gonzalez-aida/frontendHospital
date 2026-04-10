import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = 'Ocurrió un error';

                if (error.error instanceof ErrorEvent) {
                    errorMessage = `Error: ${error.error.message}`;
                } else {
                    switch (error.status) {
                        case 400:
                            errorMessage = error.error?.message || 'Solicitud incorrecta';
                            break;
                        case 401:
                            errorMessage = 'No autorizado. Por favor inicia sesión nuevamente.';
                            // No hacer logout si estamos en el callback o en el login
                            if (!window.location.pathname.includes('/callback') &&
                                !window.location.pathname.includes('/login')) {
                                this.authService.logout();
                            }
                            break;
                        case 403:
                            errorMessage = 'Acceso denegado';
                            break;
                        case 404:
                            errorMessage = 'Recurso no encontrado';
                            break;
                        case 500:
                            errorMessage = 'Error interno del servidor';
                            break;
                        default:
                            errorMessage = error.error?.message || `Error: ${error.status}`;
                    }
                }

                console.error('Error HTTP:', errorMessage);
                return throwError(() => error);
            })
        );
    }
}