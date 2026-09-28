import { Component } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonIcon
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { download, logoGooglePlaystore } from 'ionicons/icons';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-app-download',
  templateUrl: './app-download.page.html',
  styleUrls: ['./app-download.page.scss'],
  standalone: true,
  imports: [
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon
  ]
})
export class AppDownloadPage {
  
  // URLs de descarga (reemplaza con las tuyas)
  readonly downloadUrls = {
    directDownload: 'https://play.google.com/store/search?q=lider&c=apps&hl=es_419',
    playStore: 'https://play.google.com/store/search?q=lider&c=apps&hl=es_419'
  };

  // Rutas de imágenes QR
  readonly qrCodes = {
    directDownload: 'assets/qr/QR.png',
    playStore: 'assets/qr/QR.png'
  };

  constructor(private navigationService: NavigationService) {
    addIcons({ download, logoGooglePlaystore });
  }

  goBack() {
    this.navigationService.back('/home');
  }

  downloadDirect() {
    window.open(this.downloadUrls.directDownload, '_blank');
  }

  openPlayStore() {
    window.open(this.downloadUrls.playStore, '_blank');
  }
}