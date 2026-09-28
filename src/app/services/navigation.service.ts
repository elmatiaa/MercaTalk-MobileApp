import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private history: string[] = [];

  constructor(
    private router: Router,
    private location: Location
  ) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        if (this.history.length === 0 || this.history[this.history.length - 1] !== url) {
          this.history.push(url);
        }
      });
  }

  /**
   * Indica si hay historial de navegación previo dentro de la aplicación.
   */
  public hasHistory(): boolean {
    return this.history.length > 1;
  }

  /**
   * Obtiene la URL anterior si existe en el historial de la aplicación.
   */
  public getPreviousUrl(): string | null {
    if (this.history.length > 1) {
      return this.history[this.history.length - 2];
    }
    return null;
  }

  /**
   * Regresa a la pantalla anterior respetando el historial real.
   * Si no hay historial dentro de la sesión de la app, navega a la ruta de fallback indicada.
   */
  public back(fallbackUrl: string = '/home'): void {
    if (this.hasHistory()) {
      this.history.pop(); // Elimina la ruta actual de la pila antes de hacer popstate
      this.location.back();
    } else {
      this.router.navigateByUrl(fallbackUrl);
    }
  }
}
