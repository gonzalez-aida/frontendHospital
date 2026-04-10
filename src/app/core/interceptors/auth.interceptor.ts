import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const user = localStorage.getItem('h-moscatti-user');
        const accessToken = user ? JSON.parse(user).accessToken : null;

        console.log('Token enviado:', accessToken ? 'SÍ' : 'NO', req.url);

        if (accessToken) {
            const cloned = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${accessToken}`)
            });
            return next.handle(cloned);
        }

        return next.handle(req);
    }
}