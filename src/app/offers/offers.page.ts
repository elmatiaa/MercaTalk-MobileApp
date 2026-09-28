import { Component } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { WALMART_OFFERS } from '../data/offers.data';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon
  ]
})
export class OffersPage {
  offers = WALMART_OFFERS;
  
  constructor(private navigationService: NavigationService) {}

  goBack() {
    this.navigationService.back('/home');
  }

  addToCart(product: any) {
    console.log('Producto agregado al carrito:', product.product);
  }
}