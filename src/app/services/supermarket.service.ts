import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Supermarket {
  id: 'lider' | 'tottus' | 'santaisabel';
  name: string;
  badgeName: string;
  tagline: string;
  colors: {
    primary: string;
    secondary: string;
    highlight: string;
    dark: string;
    bgLight: string;
    heroGradient: string;
  };
  mascot: {
    name: string;
    image: string;
    greeting: string;
  };
  cardDiscount: {
    name: string;
    bciPct: number;
    clubPct: number;
  };
}

export const SUPERMARKETS: Supermarket[] = [
  {
    id: 'lider',
    name: 'Líder',
    badgeName: 'Walmart Chile',
    tagline: 'Líder - Precios Bajos Siempre',
    colors: {
      primary: '#0071ce',
      secondary: '#004b99',
      highlight: '#ffc220',
      dark: '#1e293b',
      bgLight: '#f5f6f9',
      heroGradient: 'linear-gradient(135deg, #0071ce 0%, #004b99 50%, #002d6b 100%)'
    },
    mascot: {
      name: 'Liderín',
      image: 'assets/images/liderin.png',
      greeting: '¡Hola! Soy Liderín. ¿En qué te ayudo hoy a ahorrar en Líder?'
    },
    cardDiscount: {
      name: 'Líder Bci (-6%)',
      bciPct: 6,
      clubPct: 3
    }
  },
  {
    id: 'tottus',
    name: 'Tottus',
    badgeName: 'Falabella Retail',
    tagline: 'Tottus - Paga Menos, Crece Más',
    colors: {
      primary: '#008539',
      secondary: '#00662b',
      highlight: '#78be20',
      dark: '#222222',
      bgLight: '#f4f7f4',
      heroGradient: 'linear-gradient(135deg, #008539 0%, #00662b 50%, #00421c 100%)'
    },
    mascot: {
      name: 'Tottín',
      image: 'assets/images/tottus_mascot.svg',
      greeting: '¡Hola! Soy Tottín, tu asistente alegre en Tottus. ¿Qué deseas consultar?'
    },
    cardDiscount: {
      name: 'CMR Falabella (-6%)',
      bciPct: 6,
      clubPct: 3
    }
  },
  {
    id: 'santaisabel',
    name: 'Santa Isabel',
    badgeName: 'Cencosud',
    tagline: 'Santa Isabel - Te Conviene Siempre',
    colors: {
      primary: '#e30613',
      secondary: '#b8000a',
      highlight: '#ffcc00',
      dark: '#222222',
      bgLight: '#fbf6f6',
      heroGradient: 'linear-gradient(135deg, #e30613 0%, #b8000a 50%, #7a0006 100%)'
    },
    mascot: {
      name: 'Santi',
      image: 'assets/images/santaisabel_mascot.svg',
      greeting: '¡Hola! Soy Santi de Santa Isabel. ¡Te conviene comprar y ahorrar conmigo!'
    },
    cardDiscount: {
      name: 'Tarjeta Cencosud (-6%)',
      bciPct: 6,
      clubPct: 3
    }
  }
];

@Injectable({
  providedIn: 'root'
})
export class SupermarketService {
  private currentSupermarketSubject = new BehaviorSubject<Supermarket>(SUPERMARKETS[0]);
  public currentSupermarket$ = this.currentSupermarketSubject.asObservable();

  constructor() {
    this.initSupermarket();
  }

  private initSupermarket() {
    const savedId = localStorage.getItem('selected_supermarket');
    const found = SUPERMARKETS.find(s => s.id === savedId) || SUPERMARKETS[0];
    this.setSupermarket(found.id);
  }

  public getSupermarketList(): Supermarket[] {
    return SUPERMARKETS;
  }

  public getCurrentSupermarket(): Supermarket {
    return this.currentSupermarketSubject.value;
  }

  public setSupermarket(id: 'lider' | 'tottus' | 'santaisabel') {
    const supermarket = SUPERMARKETS.find(s => s.id === id) || SUPERMARKETS[0];
    this.currentSupermarketSubject.next(supermarket);
    localStorage.setItem('selected_supermarket', supermarket.id);
    this.applyThemeCSS(supermarket);
  }

  private applyThemeCSS(s: Supermarket) {
    const root = document.documentElement;
    document.body.className = `theme-${s.id}`;
    root.style.setProperty('--primary-color', s.colors.primary);
    root.style.setProperty('--primary-brand', s.colors.primary);
    root.style.setProperty('--secondary-color', s.colors.secondary);
    root.style.setProperty('--highlight-color', s.colors.highlight);
    root.style.setProperty('--dark-color', s.colors.dark);
    root.style.setProperty('--bg-color', s.colors.bgLight);
    root.style.setProperty('--bg-surface', s.colors.bgLight);
    root.style.setProperty('--hero-gradient', s.colors.heroGradient);

    // Compute RGB for Ionic CSS variables
    const hex = s.colors.primary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const rgbStr = `${r}, ${g}, ${b}`;

    root.style.setProperty('--ion-color-primary', s.colors.primary);
    root.style.setProperty('--ion-color-primary-rgb', rgbStr);
    root.style.setProperty('--ion-color-primary-contrast', '#ffffff');
    root.style.setProperty('--ion-color-primary-shade', s.colors.secondary);
    root.style.setProperty('--ion-color-primary-tint', s.colors.primary);
    root.style.setProperty('--ion-color-secondary', s.colors.secondary);
    root.style.setProperty('--ion-color-tertiary', s.colors.highlight);
    root.style.setProperty('--ion-color-dark', s.colors.dark);
  }
}
