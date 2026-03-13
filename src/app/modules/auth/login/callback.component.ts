import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-callback',
  template: `
    <div style="display:flex; justify-content:center; align-items:center; height:100vh;">
      <p>Iniciando sesión...</p>
    </div>
  `
})
export class CallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');

    if (!code) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.authService.exchangeCode(code).subscribe({
      next: (data) => {
        if (data.rol === 'MEDICO') {
          this.router.navigate(['/dashboard-medico']);
        }
        else if (data.rol === 'PACIENTE') {
          this.router.navigate(['/dashboard-paciente']);
        }
        else if (data.rol === 'ADMIN') {
          window.location.href = 'https://www.sat.gob.mx';
        }
        else {
          this.router.navigate(['/auth/login']);
        }
      },
      error: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}