import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, scaleOutline, colorWandOutline, gitCompareOutline, checkmarkOutline, chevronUpOutline, chevronDownOutline, searchOutline, barcodeOutline, removeOutline, addOutline, saveOutline, scanOutline, gitMergeOutline, listOutline, trashOutline, createOutline, addCircleOutline,
  shareSocialOutline, copyOutline, receiptOutline, duplicateOutline,
   sparklesOutline, walletOutline,
  trendingUpOutline, checkmarkCircleOutline, closeOutline, cartOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { ListComparisonService } from '../services/list-comparison.service';
import { ProductsService } from '../services/products';

@Component({
  selector: 'app-mis-listas',
  templateUrl: './mis-listas.component.html',
  styleUrls: ['./mis-listas.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MisListasComponent implements OnInit {
  savedBudgets: any[] = [];
  expandedIndex: number | null = null;
  selectedTicket: any = null;
  showTicketModal: boolean = false;

  compareMode: boolean = false;
  selectedForCompare: number[] = [];
  showCompareModal: boolean = false;
  
  showEditModal: boolean = false;
  editingIndex: number = -1;
  editingList: any = null;


  constructor(
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private listComparison: ListComparisonService,
    private productsService: ProductsService
  ) {
    addIcons({ 
      'arrow-back-outline': arrowBackOutline,
      'scale-outline': scaleOutline,
      'color-wand-outline': colorWandOutline,
      'git-compare-outline': gitCompareOutline,
      'checkmark-outline': checkmarkOutline,
      'chevron-up-outline': chevronUpOutline,
      'chevron-down-outline': chevronDownOutline,
      'search-outline': searchOutline,
      'barcode-outline': barcodeOutline, 
      'list-outline': listOutline, 
      'trash-outline': trashOutline, 
      'create-outline': createOutline, 
      'add-circle-outline': addCircleOutline,
      'share-social-outline': shareSocialOutline,
      'copy-outline': copyOutline,
      'receipt-outline': receiptOutline,
      'duplicate-outline': duplicateOutline,
      
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

  
    goToLiveBudget(index: number) {
    this.router.navigate(['/presupuesto'], { queryParams: { index } });
  }

  editBudget(index: number) {
    this.editingIndex = index;
    this.editingList = JSON.parse(JSON.stringify(this.savedBudgets[index]));
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingList = null;
    this.editingIndex = -1;
  }

  increaseQty(item: any) {
    item.quantity = (item.quantity || 1) + 1;
    this.recalculateEditingList();
  }

  decreaseQty(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.editingList.items = this.editingList.items.filter((i: any) => i.id !== item.id);
    }
    this.recalculateEditingList();
  }

  
  removeItem(item: any) {
    this.editingList.items = this.editingList.items.filter((i: any) => i.id !== item.id);
    this.recalculateEditingList();
  }

  openRealScanner() {
    this.presentToast('Iniciando Escáner de Código de Barras...');
    this.router.navigate(['/presupuesto'], { queryParams: { autoScan: 'true' } });
    this.closeEditModal();
  }

  async openDatabaseCatalog() {
    const allProducts = this.productsService.getAllProducts();
    const inputs = allProducts.slice(0, 20).map((p: any) => ({
      type: 'radio',
      label: p.name + ' - $' + (p.inOffer && p.offerPrice ? p.offerPrice : p.price),
      value: p,
    }));

    const alert = await this.alertController.create({
      header: 'Catálogo de Productos',
      message: 'Selecciona un producto para añadir:',
      inputs: inputs as any,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Añadir',
          handler: (found) => {
            if (found) {
              const existingItem = this.editingList.items.find((i:any) => i.id === found.id);
              if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
              } else {
                this.editingList.items.push({ ...found, quantity: 1 });
              }
              this.recalculateEditingList();
              this.presentToast('Producto añadido: ' + found.name);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async addGenericProduct() {
    const alert = await this.alertController.create({
      header: 'Producto Genérico',
      message: 'Ingresa los detalles:',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre del producto' },
        { name: 'price', type: 'number', placeholder: 'Precio unitario' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: (data) => {
            if (data.name && data.price) {
              const newProd = {
                id: 'gen_' + Date.now(),
                name: data.name,
                price: parseInt(data.price),
                quantity: 1,
                image: 'assets/products/default.jpg'
              };
              this.editingList.items.push(newProd);
              this.recalculateEditingList();
              this.presentToast('Producto genérico añadido');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  recalculateEditingList() {
    let total = 0;
    for (const item of this.editingList.items) {
      const price = item.inOffer && item.offerPrice ? item.offerPrice : (item.price || 0);
      total += price * (item.quantity || 1);
    }
    this.editingList.totalSpent = total;
    // Budget is kept as defined by the user
  }

  saveEditedList() {
    this.recalculateEditingList();
    this.savedBudgets[this.editingIndex] = this.editingList;
    localStorage.setItem('liderin_budgets', JSON.stringify(this.savedBudgets));
    this.presentToast('Lista guardada con éxito');
    this.closeEditModal();
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

  
  toggleCompareMode() {
    this.compareMode = !this.compareMode;
    this.selectedForCompare = [];
  }

  toggleSelection(index: number) {
    const pos = this.selectedForCompare.indexOf(index);
    if (pos > -1) {
      this.selectedForCompare.splice(pos, 1);
    } else {
      if (this.selectedForCompare.length < 2) {
        this.selectedForCompare.push(index);
      }
      if (this.selectedForCompare.length === 2) {
        this.showCompareModal = true;
      }
    }
  }

  closeCompareModal() {
    this.showCompareModal = false;
    this.compareMode = false;
    this.selectedForCompare = [];
  }

  get compareList1() {
    return this.savedBudgets[this.selectedForCompare[0]] || null;
  }

  get compareList2() {
    return this.savedBudgets[this.selectedForCompare[1]] || null;
  }

  get comparisonData() {
    const L1 = this.compareList1;
    const L2 = this.compareList2;
    if (!L1 || !L2) return null;

    const t1 = L1.finalTotalToPay || L1.totalSpent || 0;
    const t2 = L2.finalTotalToPay || L2.totalSpent || 0;
    const diff = Math.abs(t1 - t2);
    const pct = Math.max(t1, t2) > 0 ? Math.round((diff / Math.max(t1, t2)) * 100) : 0;
    
    const isL1Cheaper = t1 < t2;
    const isL2Cheaper = t2 < t1;

    const items1 = L1.items?.length || 0;
    const items2 = L2.items?.length || 0;

    const details = this.listComparison.getDetailedComparison(L1, L2);
    let itemsDiffStr = 'Tienen la misma cantidad de productos';
    if (items1 > items2) itemsDiffStr = `${L1.name || 'Lista 1'} tiene ${items1 - items2} prod. más`;
    if (items2 > items1) itemsDiffStr = `${L2.name || 'Lista 2'} tiene ${items2 - items1} prod. más`;

    return {
      diff,
      pct,
      isL1Cheaper,
      isL2Cheaper,
      isEqual: t1 === t2,
      cheaperName: isL1Cheaper ? (L1.name || 'Lista 1') : (isL2Cheaper ? (L2.name || 'Lista 2') : 'Ambas'),
      expensiveName: !isL1Cheaper ? (L1.name || 'Lista 1') : (!isL2Cheaper ? (L2.name || 'Lista 2') : 'Ambas'),
      itemsDiffStr,
      similarity: details.similarity,
      details
    };
  }

  editCompareList(idx: number) {
    this.closeCompareModal();
    this.editBudget(this.selectedForCompare[idx]);
  }

  async mergeCompareLists() {
    const L1 = this.compareList1;
    const L2 = this.compareList2;
    if (!L1 || !L2) return;
    const mergedItems = JSON.parse(JSON.stringify(L1.items || []));
    const items2 = JSON.parse(JSON.stringify(L2.items || []));
    for (const item2 of items2) {
      let matched = false;
      for (const mergedItem of mergedItems) {
        if ((item2.id && mergedItem.id && String(item2.id) === String(mergedItem.id)) ||
            (item2.barcode && mergedItem.barcode && String(item2.barcode) === String(mergedItem.barcode)) ||
            (item2.name && mergedItem.name && item2.name.toLowerCase().trim() === mergedItem.name.toLowerCase().trim())) {
          mergedItem.quantity = (mergedItem.quantity || 1) + (item2.quantity || 1);
          matched = true;
          break;
        }
      }
      if (!matched) mergedItems.push(item2);
    }
    let newTotal = 0;
    for (const item of mergedItems) {
      const price = item.inOffer && item.offerPrice ? item.offerPrice : (item.price || 0);
      newTotal += price * (item.quantity || 1);
    }
    const mergedBudget = {
      name: `Fusión: ${L1.name || 'Lista 1'} y ${L2.name || 'Lista 2'}`,
      date: new Date().toISOString(),
      budget: Math.max(L1.budget || 20000, L2.budget || 20000, newTotal),
      totalSpent: newTotal,
      totalSavingsAccumulated: 0,
      selectedCardDiscount: 'none',
      items: mergedItems
    };
    this.savedBudgets.unshift(mergedBudget);
    localStorage.setItem('liderin_budgets', JSON.stringify(this.savedBudgets));
    this.closeCompareModal();
    this.presentToast('¡Listas combinadas con éxito!');
    this.editBudget(0);
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