import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { Chart, registerables } from 'chart.js';
import { addIcons } from 'ionicons';
import { 
  barcodeOutline, close, closeCircle, saveOutline, arrowBackOutline, 
  videocamOutline, sunnyOutline, handLeftOutline, closeCircleOutline, 
  addCircleOutline, removeCircleOutline, trashOutline, warningOutline,
  repeatOutline, flashOutline, pieChartOutline, pricetagOutline,
  cartOutline, checkmarkCircle, alertCircleOutline, refreshOutline
} from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { ProductsService, Product } from '../services/products';
import { ActivatedRoute, RouterModule } from '@angular/router';

Chart.register(...registerables);

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-presupuesto',
  templateUrl: './presupuesto.page.html',
  styleUrls: ['./presupuesto.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PresupuestoPage implements OnInit, AfterViewInit, OnDestroy {
  budget: number = 15000;
  totalSpent: number = 0;
  scannedItems: any[] = [];
  chart: any;
  isScanning: boolean = false;
  isWeb: boolean = false;
  editIndex?: number;

  // Modo de escaneo continuo
  continuousScan: boolean = true;
  lastScannedProduct: { name: string; price: number; inOffer?: boolean; offerPrice?: number; quantity: number } | null = null;
  private lastScannedCode: string = '';
  private lastScannedTime: number = 0;
  private bannerTimeout: any = null;
  
  // Vista de gráficos: presupuesto vs categorías
  chartMode: 'budget' | 'category' = 'budget';
  
  // Para web
  private html5QrCode: Html5Qrcode | null = null;

  showManualAddModal = false;
  manualAddTab = 'db';
  searchQuery = '';
  customProductName = '';
  customProductPrice: number | null = null;
  customProductCategory = 'Abarrotes';
  allProducts: Product[] = [];

  readonly categoryColors: { [cat: string]: string } = {
    'Lácteos': '#3880ff',
    'Panadería': '#ffc409',
    'Abarrotes': '#2dd36f',
    'Bebidas': '#222428',
    'Carnes': '#eb445a',
    'Limpieza': '#0cd1e8',
    'Snacks': '#7044ff',
    'Otros': '#92949c'
  };

  constructor(
    private productsService: ProductsService,
    private toastController: ToastController,
    private alertController: AlertController,
    private route: ActivatedRoute
  ) {
    addIcons({ 
      'barcode-outline': barcodeOutline, 
      'close': close,
      'close-circle': closeCircle, 
      'save-outline': saveOutline, 
      'arrow-back-outline': arrowBackOutline,
      'videocam-outline': videocamOutline,
      'sunny-outline': sunnyOutline,
      'hand-left-outline': handLeftOutline,
      'close-circle-outline': closeCircleOutline,
      'add-circle-outline': addCircleOutline,
      'remove-circle-outline': removeCircleOutline,
      'trash-outline': trashOutline,
      'warning-outline': warningOutline,
      'repeat-outline': repeatOutline,
      'flash-outline': flashOutline,
      'pie-chart-outline': pieChartOutline,
      'pricetag-outline': pricetagOutline,
      'cart-outline': cartOutline,
      'checkmark-circle': checkmarkCircle,
      'alert-circle-outline': alertCircleOutline,
      'refresh-outline': refreshOutline
    });
    this.isWeb = !Capacitor.isNativePlatform();
  }

  ngOnInit() {
    this.allProducts = this.productsService.getAllProducts();
    this.route.queryParams.subscribe(params => {
      if (params['index'] !== undefined) {
        this.editIndex = parseInt(params['index'], 10);
        this.loadBudget(this.editIndex);
      }
    });
  }

  ionViewDidEnter() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    
    setTimeout(() => {
      this.initChart();
    }, 80);
  }

  ionViewWillLeave() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  loadBudget(index: number) {
    const previousSaved = localStorage.getItem('liderin_budgets');
    if (previousSaved) {
      const budgetsArray = JSON.parse(previousSaved);
      if (budgetsArray[index]) {
        const data = budgetsArray[index];
        this.budget = data.budget;
        this.totalSpent = data.totalSpent;
        this.scannedItems = data.items;
        if (this.chart) this.updateChart();
      }
    }
  }

  adjustBudget(amount: number) {
    if (!this.budget) this.budget = 0;
    this.budget += amount;
    if (this.budget < 0) this.budget = 0;
    this.updateChart();
  }

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnDestroy() {
    this.stopScan();
  }

  // AUDIO & HAPTIC FEEDBACK
  playBeepSound() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // Beep nítido
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // AudioContext bloqueado o no disponible
    }
  }

  async triggerHaptic() {
    try {
      if (Capacitor.isPluginAvailable('Haptics')) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
    } catch (e) {}
  }

  // CHART LOGIC
  initChart() {
    const canvas = document.getElementById('budgetChart') as HTMLCanvasElement;
    if (!canvas) return;

    const chartConfig = this.getChartConfig();

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: chartConfig.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 12,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return ` ${label}: $${value.toLocaleString('es-CL')}`;
              }
            }
          }
        }
      }
    });
  }

  toggleChartMode() {
    this.chartMode = this.chartMode === 'budget' ? 'category' : 'budget';
    this.updateChart();
  }

  private getChartConfig() {
    if (this.chartMode === 'budget') {
      const remaining = Math.max(0, this.budget - this.totalSpent);
      const isOver = this.totalSpent > this.budget;
      return {
        data: {
          labels: isOver ? ['Gastado', 'Excedido'] : ['Gastado', 'Disponible'],
          datasets: [{
            data: isOver ? [this.budget, this.totalSpent - this.budget] : [this.totalSpent, remaining],
            backgroundColor: isOver ? ['#ff7a00', '#eb445a'] : ['#3880ff', '#2dd36f'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        }
      };
    } else {
      const breakdown = this.getCategoryBreakdown();
      if (breakdown.length === 0) {
        return {
          data: {
            labels: ['Sin compras'],
            datasets: [{
              data: [1],
              backgroundColor: ['#e0e0e0'],
              borderWidth: 1
            }]
          }
        };
      }
      return {
        data: {
          labels: breakdown.map(b => b.category),
          datasets: [{
            data: breakdown.map(b => b.total),
            backgroundColor: breakdown.map(b => b.color),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        }
      };
    }
  }

  updateChart() {
    if (this.chart) {
      const config = this.getChartConfig();
      this.chart.data.labels = config.data.labels;
      this.chart.data.datasets = config.data.datasets;
      this.chart.update();
    }
  }

  // MÉTRICAS Y CÁLCULOS
  getBudgetProgressPercentage(): number {
    if (!this.budget || this.budget <= 0) return 0;
    return Math.round((this.totalSpent / this.budget) * 100);
  }

  getBudgetStatusColor(): string {
    const pct = this.getBudgetProgressPercentage();
    if (pct > 100) return 'danger';
    if (pct >= 85) return 'warning';
    if (pct >= 65) return 'tertiary';
    return 'success';
  }

  getCategoryBreakdown(): CategorySummary[] {
    if (this.totalSpent <= 0 || this.scannedItems.length === 0) return [];
    const map = new Map<string, number>();

    for (const item of this.scannedItems) {
      const cat = item.category || 'Otros';
      const price = (item.inOffer && item.offerPrice) ? item.offerPrice : item.price;
      const itemTotal = price * (item.quantity || 1);
      map.set(cat, (map.get(cat) || 0) + itemTotal);
    }

    return Array.from(map.entries())
      .map(([category, total]) => ({
        category,
        total,
        percentage: Math.round((total / this.totalSpent) * 100),
        color: this.categoryColors[category] || this.categoryColors['Otros']
      }))
      .sort((a, b) => b.total - a.total);
  }

  // MODAL AÑADIR MANUAL
  addManualProduct() {
    this.showManualAddModal = true;
    this.manualAddTab = 'db';
    this.searchQuery = '';
    this.customProductName = '';
    this.customProductPrice = null;
    this.customProductCategory = 'Abarrotes';
  }

  closeManualAdd() {
    this.showManualAddModal = false;
  }

  filteredProducts() {
    if (!this.searchQuery.trim()) return this.allProducts;
    const query = this.searchQuery.toLowerCase();
    return this.allProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }

  addFromDb(product: Product) {
    this.playBeepSound();
    this.triggerHaptic();

    const existingIndex = this.scannedItems.findIndex(item => item.barcode === product.barcode);
    if (existingIndex !== -1) {
      this.increaseQuantity(existingIndex);
      this.presentToast(`+1 ${this.scannedItems[existingIndex].name}`);
    } else {
      const newProduct = { ...product, quantity: 1 };
      this.scannedItems.unshift(newProduct);
      this.totalSpent += (product.inOffer && product.offerPrice) ? product.offerPrice : product.price;
      this.updateChart();
      this.presentToast(`Añadido: ${product.name}`);
    }
    this.closeManualAdd();
  }

  addCustomProduct() {
    if (this.customProductName && this.customProductPrice) {
      this.playBeepSound();
      this.triggerHaptic();

      const newItem: any = {
        id: Date.now(),
        name: this.customProductName,
        brand: 'Manual',
        category: this.customProductCategory || 'Otros',
        image: '',
        barcode: 'MANUAL-' + Date.now(),
        price: Number(this.customProductPrice),
        quantity: 1
      };
      this.scannedItems.unshift(newItem);
      this.totalSpent += newItem.price;
      this.updateChart();
      this.presentToast(`Añadido: ${newItem.name}`);
      this.closeManualAdd();
    }
  }

  // ESCÁNER
  async startScan() {
    this.isScanning = true;
    this.lastScannedCode = '';
    this.lastScannedProduct = null;
    document.body.classList.add('scanner-active');

    if (this.isWeb) {
      setTimeout(() => {
        this.html5QrCode = new Html5Qrcode("reader");
        this.html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: { width: 260, height: 160 }
          },
          (decodedText) => {
            const now = Date.now();
            // Debounce de 1.4s para evitar lecturas duplicadas seguidas del mismo código
            if (decodedText === this.lastScannedCode && (now - this.lastScannedTime) < 1400) {
              return;
            }
            this.lastScannedCode = decodedText;
            this.lastScannedTime = now;

            this.processBarcode(decodedText);

            if (!this.continuousScan) {
              this.stopScan();
            }
          },
          () => {}
        ).catch(err => {
          console.error("Error al iniciar cámara web", err);
          this.presentToast("Error al iniciar cámara: " + err);
          this.stopScan();
        });
      }, 250);

    } else {
      try {
        const status = await BarcodeScanner.checkPermission({ force: true });
        
        if (status.granted) {
          BarcodeScanner.hideBackground();
          const result = await BarcodeScanner.startScan();

          if (result.hasContent) {
            this.processBarcode(result.content);
            this.stopScan();
          }
        }
      } catch (error) {
        console.error('Error scanning barcode native', error);
        this.stopScan();
      }
    }
  }

  stopScan() {
    if (this.isWeb && this.html5QrCode) {
      this.html5QrCode.stop().then(() => {
        this.html5QrCode?.clear();
        this.html5QrCode = null;
      }).catch(err => console.error("Error deteniendo web scanner", err));
    } else if (!this.isWeb) {
      BarcodeScanner.showBackground().catch(() => {});
      BarcodeScanner.stopScan().catch(() => {});
    }
    
    this.isScanning = false;
    this.lastScannedProduct = null;
    document.body.classList.remove('scanner-active');

    setTimeout(() => {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      this.initChart();
    }, 100);
  }

  toggleContinuousScan() {
    this.continuousScan = !this.continuousScan;
  }

  async processBarcode(code: string) {
    this.playBeepSound();
    this.triggerHaptic();

    const product = this.productsService.findProductByBarcode(code);
    const existingIndex = this.scannedItems.findIndex(item => item.barcode === code);

    if (existingIndex !== -1) {
      this.increaseQuantity(existingIndex);
      const item = this.scannedItems[existingIndex];
      this.showLiveScanBanner(item.name, item.inOffer && item.offerPrice ? item.offerPrice : item.price, item.quantity, item.inOffer);
      return;
    }
    
    if (product) {
      const newProduct = { ...product, quantity: 1 };
      this.scannedItems.unshift(newProduct);
      const effectivePrice = (product.inOffer && product.offerPrice) ? product.offerPrice : product.price;
      this.totalSpent += effectivePrice;
      this.updateChart();
      this.showLiveScanBanner(product.name, effectivePrice, 1, product.inOffer);
    } else {
      const mockPrice = Math.floor(Math.random() * 2500) + 500;
      const newItem: any = {
        id: Date.now(),
        name: 'Producto ' + code.slice(-4),
        brand: 'Genérico',
        category: 'Otros',
        image: '',
        code: code,
        barcode: code,
        price: mockPrice,
        quantity: 1
      };
      
      this.scannedItems.unshift(newItem);
      this.totalSpent += newItem.price;
      this.updateChart();
      this.showLiveScanBanner(newItem.name, newItem.price, 1);
    }
  }

  private showLiveScanBanner(name: string, price: number, quantity: number, inOffer?: boolean) {
    this.lastScannedProduct = { name, price, quantity, inOffer };
    if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.lastScannedProduct = null;
    }, 2500);
  }

  getTotalItemsCount(): number {
    return this.scannedItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }

  increaseQuantity(index: number) {
    const item = this.scannedItems[index];
    if (!item.quantity) item.quantity = 1;
    item.quantity++;
    const price = (item.inOffer && item.offerPrice) ? item.offerPrice : item.price;
    this.totalSpent += price;
    this.updateChart();
  }

  decreaseQuantity(index: number) {
    const item = this.scannedItems[index];
    if (!item.quantity) item.quantity = 1;
    
    if (item.quantity > 1) {
      item.quantity--;
      const price = (item.inOffer && item.offerPrice) ? item.offerPrice : item.price;
      this.totalSpent -= price;
      this.updateChart();
    } else {
      this.removeItem(index);
    }
  }

  removeItem(index: number) {
    const item = this.scannedItems[index];
    if (!item.quantity) item.quantity = 1;
    const price = (item.inOffer && item.offerPrice) ? item.offerPrice : item.price;
    this.totalSpent -= price * item.quantity;
    
    this.scannedItems.splice(index, 1);
    this.updateChart();
  }

  async confirmClearCart() {
    if (this.scannedItems.length === 0) return;
    const alert = await this.alertController.create({
      header: 'Vaciar Carrito',
      message: '¿Estás seguro de que deseas eliminar todos los productos del presupuesto actual?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Vaciar', 
          role: 'destructive',
          handler: () => {
            this.scannedItems = [];
            this.totalSpent = 0;
            this.updateChart();
            this.presentToast('Carrito vaciado');
          }
        }
      ]
    });
    await alert.present();
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'dark',
      cssClass: 'custom-toast-notification'
    });
    toast.present();
  }

  async saveBudget() {
    const savedData = {
      date: new Date().toISOString(),
      budget: this.budget,
      totalSpent: this.totalSpent,
      items: this.scannedItems
    };

    const previousSaved = localStorage.getItem('liderin_budgets');
    let budgetsArray = [];
    if (previousSaved) {
      budgetsArray = JSON.parse(previousSaved);
    }

    if (this.editIndex !== undefined && this.editIndex !== null) {
      budgetsArray[this.editIndex] = savedData;
    } else {
      budgetsArray.push(savedData);
    }
    localStorage.setItem('liderin_budgets', JSON.stringify(budgetsArray));

    const alert = await this.alertController.create({
      header: '¡Presupuesto Guardado!',
      message: `Se ha guardado tu lista con ${this.getTotalItemsCount()} productos y un total de $${this.totalSpent.toLocaleString('es-CL')}.`,
      buttons: ['OK']
    });

    await alert.present();
  }
}
