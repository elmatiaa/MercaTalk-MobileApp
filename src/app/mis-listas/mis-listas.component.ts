import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, listOutline, trashOutline, createOutline, addCircleOutline,
  shareSocialOutline, copyOutline, receiptOutline, duplicateOutline,
  chevronDownOutline, chevronUpOutline, sparklesOutline, walletOutline,
  trendingUpOutline, checkmarkCircleOutline, closeOutline, cartOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mis-listas',
  templateUrl: './mis-listas.component.html',
  styleUrls: ['./mis-listas.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MisListasComponent implements OnInit {
  savedBudgets: any[] = [];
  expandedIndex: number | null = null;
  selectedTicket: any = null;
  showTicketModal: boolean = false;

  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ 
      'arrow-back-outline': arrowBackOutline, 
      'list-outline': listOutline, 
      'trash-outline': trashOutline, 
      'create-outline': createOutline, 
      'add-circle-outline': addCircleOutline,
      'share-social-outline': shareSocialOutline,
      'copy-outline': copyOutline,
      'receipt-outline': receiptOutline,
      'duplicate-outline': duplicateOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-up-outline': chevronUpOutline,
      'sparkles-outline': sparklesOutline,
      'wallet-outline': walletOutline,
      'trending-up-outline': trendingUpOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-outline': closeOutline,
      'cart-outline': cartOutline
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadBudgets();
  }

  loadBudgets() {
    const data = localStorage.getItem('liderin_budgets');
    if (data) {
      try {
        this.savedBudgets = JSON.parse(data);
      } catch (e) {
        this.savedBudgets = [];
      }
    } else {
      this.savedBudgets = [];
    }
  }

  // MÉTRICAS GLOBALES DE HISTORIAL
  getTotalSpentAll(): number {
    return this.savedBudgets.reduce((acc, b) => acc + (b.finalTotalToPay || b.totalSpent || 0), 0);
  }

  getTotalSavingsAll(): number {
    return this.savedBudgets.reduce((acc, b) => acc + (b.totalSavingsAccumulated || 0) + (b.discountAmount || 0), 0);
  }

  getAverageSpent(): number {
    if (this.savedBudgets.length === 0) return 0;
    return Math.round(this.getTotalSpentAll() / this.savedBudgets.length);
  }

  toggleDetails(index: number) {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  editBudget(index: number) {
    this.router.navigate(['/presupuesto'], { queryParams: { index } });
  }

  async duplicateBudget(budget: any) {
    // Clonar lista como una nueva compra activa
    const newBudget = {
      date: new Date().toISOString(),
      budget: budget.budget || 20000,
      totalSpent: budget.totalSpent || 0,
      totalSavingsAccumulated: 0,
      selectedCardDiscount: budget.selectedCardDiscount || 'none',
      items: JSON.parse(JSON.stringify(budget.items || []))
    };

    this.savedBudgets.unshift(newBudget);
    localStorage.setItem('liderin_budgets', JSON.stringify(this.savedBudgets));

    const toast = await this.toastController.create({
      message: '¡Lista duplicada! Abriendo nuevo presupuesto...',
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    this.router.navigate(['/presupuesto'], { queryParams: { index: 0 } });
  }

  async deleteBudget(index: number) {
    const alert = await this.alertController.create({
      header: 'Eliminar Lista',
      message: '¿Estás seguro de que deseas eliminar este presupuesto de tu historial?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.savedBudgets.splice(index, 1);
            localStorage.setItem('liderin_budgets', JSON.stringify(this.savedBudgets));
            this.presentToast('Presupuesto eliminado');
          }
        }
      ]
    });
    await alert.present();
  }

  // EXPORTACIÓN A WHATSAPP Y TICKET
  formatListForSharing(b: any): string {
    const dateFormatted = new Date(b.date).toLocaleDateString('es-CL');
    let text = `🛒 *MI LISTA MERCATALK - ${dateFormatted}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (b.items && b.items.length > 0) {
      b.items.forEach((item: any, i: number) => {
        const qty = item.quantity || 1;
        const price = (item.inOffer && item.offerPrice ? item.offerPrice : item.price);
        text += `${i + 1}. ${item.name} (${qty}x) → $${(price * qty).toLocaleString('es-CL')}\n`;
      });
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Total a pagar:* $${(b.finalTotalToPay || b.totalSpent).toLocaleString('es-CL')}\n`;
    
    const savings = (b.totalSavingsAccumulated || 0) + (b.discountAmount || 0);
    if (savings > 0) {
      text += `🎉 *Ahorro logrado:* $${savings.toLocaleString('es-CL')}\n`;
    }

    text += `\nGenerado con MercaTalk Mobile 📱`;
    return text;
  }

  shareListWhatsApp(b: any) {
    const text = this.formatListForSharing(b);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  }

  async copyListToClipboard(b: any) {
    const text = this.formatListForSharing(b);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      this.presentToast('¡Lista copiada al portapapeles!');
    }
  }

  openTicketModal(b: any) {
    this.selectedTicket = b;
    this.showTicketModal = true;
  }

  closeTicketModal() {
    this.showTicketModal = false;
    this.selectedTicket = null;
  }

  createNew() {
    this.router.navigate(['/presupuesto']);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
    toast.present();
  }
}
