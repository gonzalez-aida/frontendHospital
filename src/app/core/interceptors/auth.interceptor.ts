import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const user = localStorage.getItem('h-moscatti-user');
        const token = user ? JSON.parse(user).accessToken : null;

        console.log('Token enviado:', token ? 'SÍ' : 'NO', req.url);

        if (token) {
            const cloned = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${token}`)
            });
            return next.handle(cloned);
        }

        return next.handle(req);
    }
}