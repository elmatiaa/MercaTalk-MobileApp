import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { Chart, registerables } from 'chart.js';
import { addIcons } from 'ionicons';
import { barcodeOutline, close, closeCircle, saveOutline, arrowBackOutline, videocamOutline, sunnyOutline, handLeftOutline, closeCircleOutline, addCircleOutline, removeCircleOutline, trashOutline } from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { ProductsService, Product } from '../services/products';
import { ActivatedRoute, RouterModule } from '@angular/router';

Chart.register(...registerables);

@Component({
  selector: 'app-presupuesto',
  templateUrl: './presupuesto.page.html',
  styleUrls: ['./presupuesto.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PresupuestoPage implements OnInit, AfterViewInit, OnDestroy {
  budget: number = 10000;
  totalSpent: number = 0;
  scannedItems: any[] = [];
  chart: any;
  isScanning: boolean = false;
  isWeb: boolean = false;
  editIndex?: number;
  
  // Para web
  private html5QrCode: Html5Qrcode | null = null;

  showManualAddModal = false;
  manualAddTab = 'db';
  searchQuery = '';
  customProductName = '';
  customProductPrice: number | null = null;
  allProducts: Product[] = [];

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
      'trash-outline': trashOutline
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
    if (!this.chart) {
      this.initChart();
    } else {
      this.updateChart();
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
    if (this.budget < 0) this.budget = 0; // Prevent negative budget
    this.updateChart();
  }

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnDestroy() {
    this.stopScan();
  }

  initChart() {
    const canvas = document.getElementById('budgetChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Gastado', 'Restante'],
        datasets: [{
          data: [this.totalSpent, Math.max(0, this.budget - this.totalSpent)],
          backgroundColor: ['#eb445a', '#2dd36f'],
          hoverBackgroundColor: ['#ff4961', '#38ff7e']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          }
        }
      }
    });
  }

  updateChart() {
    if (this.chart) {
      this.chart.data.datasets[0].data = [this.totalSpent, Math.max(0, this.budget - this.totalSpent)];
      this.chart.update();
    }
  }

  // MODAL LOGIC
  addManualProduct() {
    this.showManualAddModal = true;
    this.manualAddTab = 'db';
    this.searchQuery = '';
    this.customProductName = '';
    this.customProductPrice = null;
  }

  closeManualAdd() {
    this.showManualAddModal = false;
  }

  filteredProducts() {
    if (!this.searchQuery.trim()) return this.allProducts;
    const query = this.searchQuery.toLowerCase();
    return this.allProducts.filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query));
  }

  addFromDb(product: Product) {
    const existingIndex = this.scannedItems.findIndex(item => item.barcode === product.barcode);
    if (existingIndex !== -1) {
      this.increaseQuantity(existingIndex);
      this.presentToast(`¡Cantidad aumentada para ${this.scannedItems[existingIndex].name}!`);
    } else {
      const newProduct = { ...product, quantity: 1 };
      this.scannedItems.unshift(newProduct);
      this.totalSpent += (product.inOffer && product.offerPrice) ? product.offerPrice : product.price;
      this.updateChart();
      this.presentToast(`¡Añadido ${product.name}!`);
    }
    this.closeManualAdd();
  }

  addCustomProduct() {
    if (this.customProductName && this.customProductPrice) {
      const newItem: any = {
        id: Date.now(),
        name: this.customProductName,
        brand: 'Manual',
        category: 'Otros',
        image: '',
        barcode: 'MANUAL-' + Date.now(),
        price: Number(this.customProductPrice),
        quantity: 1
      };
      this.scannedItems.unshift(newItem);
      this.totalSpent += newItem.price;
      this.updateChart();
      this.presentToast(`¡Añadido ${newItem.name}!`);
      this.closeManualAdd();
    }
  }

  async startScan() {
    this.isScanning = true;
    document.body.classList.add('scanner-active');

    if (this.isWeb) {
      // USAR HTML5-QRCODE PARA LA WEB
      setTimeout(() => { // Esperar a que el div#reader se renderice
        this.html5QrCode = new Html5Qrcode("reader");
        this.html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 }
          },
          (decodedText, decodedResult) => {
            // Se encontró un código
            this.processBarcode(decodedText);
            this.stopScan();
          },
          (errorMessage) => {
            // Ignorar errores de "código no encontrado en el frame"
          }
        ).catch(err => {
          console.error("Error al iniciar cámara web", err);
          this.presentToast("Error al iniciar cámara web: " + err);
        });
      }, 300);

    } else {
      // USAR PLUGUIN NATIVO PARA CELULARES
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
    document.body.classList.remove('scanner-active');

    // Fix Chart.js disappearing after display:none
    setTimeout(() => {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
      this.initChart();
    }, 100);
  }

  async processBarcode(code: string) {
    const product = this.productsService.findProductByBarcode(code);
    
    // Check if it exists in scanned items
    const existingIndex = this.scannedItems.findIndex(item => item.barcode === code);

    if (existingIndex !== -1) {
      this.increaseQuantity(existingIndex);
      this.presentToast(`¡Cantidad aumentada para ${this.scannedItems[existingIndex].name}!`);
      return;
    }
    
    if (product) {
      // Producto encontrado en la base de datos
      const newProduct = { ...product, quantity: 1 };
      this.scannedItems.unshift(newProduct);
      this.totalSpent += (product.inOffer && product.offerPrice) ? product.offerPrice : product.price;
      this.updateChart();
      this.presentToast(`¡Añadido ${product.name}!`);
    } else {
      // Producto no encontrado, simular uno
      this.presentToast(`Código ${code} no reconocido. Añadiendo producto genérico.`);
      const mockPrice = Math.floor(Math.random() * 2500) + 500;
      
      const newItem: any = {
        id: Date.now(),
        name: 'Producto Desconocido',
        brand: 'Líder',
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
    }
  }

  getTotalItemsCount() {
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

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2500,
      position: 'bottom',
      color: 'dark'
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

    // Obtenemos presupuestos guardados anteriores
    const previousSaved = localStorage.getItem('liderin_budgets');
    let budgetsArray = [];
    if (previousSaved) {
      budgetsArray = JSON.parse(previousSaved);
    }

    // Añadimos o actualizamos el presupuesto
    if (this.editIndex !== undefined && this.editIndex !== null) {
      budgetsArray[this.editIndex] = savedData;
    } else {
      budgetsArray.push(savedData);
    }
    localStorage.setItem('liderin_budgets', JSON.stringify(budgetsArray));

    // Mostrar alerta de confirmación
    const alert = await this.alertController.create({
      header: '¡Presupuesto Guardado!',
      message: 'Tu lista y presupuesto han sido guardados en tu historial.',
      buttons: ['OK']
    });

    await alert.present();

    // Limpiar el presupuesto actual para uno nuevo (opcional, aquí solo informaremos)
    this.presentToast('Tus productos han sido respaldados.');
  }
}
