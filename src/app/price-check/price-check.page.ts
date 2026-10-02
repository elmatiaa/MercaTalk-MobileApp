// src/app/price-check/price-check.page.ts

import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, searchOutline, closeOutline, cameraOutline,
  barcodeOutline, pricetagOutline, pricetagsOutline, locationOutline,
  warningOutline, close, checkmarkCircle, alertCircleOutline,
  cartOutline, trashOutline, removeCircleOutline, addCircleOutline,
  videocamOutline, sunnyOutline, handLeftOutline, closeCircleOutline
} from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { Product, ProductsService } from '../services/products';
import { NavigationService } from '../services/navigation.service';

export interface TempScannedItem {
  id: string | number;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  offerPrice?: number;
  inOffer?: boolean;
  image?: string;
  quantity: number;
  identified: boolean;
  unrecognizedCode?: string;
}

@Component({
  selector: 'app-price-checker',
  templateUrl: './price-check.page.html',
  styleUrls: ['./price-check.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule
  ],
})
export class PriceCheckerPage implements OnInit, OnDestroy {
  // Variables de control de estado de la UI
  isScanning: boolean = false; 
  isLoading: boolean = false; 
  showResults: boolean = false; 
  hasSearched: boolean = false;
  
  // Variables de datos y errores
  productName: string = ''; 
  scanError: string | null = null; 
  scannedBarcode: string | null = null; 
  searchResults: Product[] = []; 

  // Escáner continuo (idéntico al módulo de Control de Presupuesto)
  isWeb: boolean = true;
  html5QrCode: Html5Qrcode | null = null;
  tempScannedItems: TempScannedItem[] = [];
  lastScannedCode: string = '';
  lastScannedTime: number = 0;
  lastScannedProduct: { name: string; price: number; quantity: number; inOffer?: boolean; identified?: boolean } | null = null;
  private bannerTimeout: any = null;

  constructor(
    private productsService: ProductsService, 
    private ngZone: NgZone,
    private toastController: ToastController,
    private navigationService: NavigationService
  ) {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'search-outline': searchOutline,
      'close-outline': closeOutline,
      'camera-outline': cameraOutline,
      'barcode-outline': barcodeOutline,
      'pricetag-outline': pricetagOutline,
      'pricetags-outline': pricetagsOutline,
      'location-outline': locationOutline,
      'warning-outline': warningOutline,
      'close': close,
      'checkmark-circle': checkmarkCircle,
      'alert-circle-outline': alertCircleOutline,
      'cart-outline': cartOutline,
      'trash-outline': trashOutline,
      'remove-circle-outline': removeCircleOutline,
      'add-circle-outline': addCircleOutline,
      'videocam-outline': videocamOutline,
      'sunny-outline': sunnyOutline,
      'hand-left-outline': handLeftOutline,
      'close-circle-outline': closeCircleOutline
    });
    this.isWeb = !Capacitor.isNativePlatform();
  }

  ngOnInit() {}

  goBack() {
    this.stopScan();
    this.navigationService.back('/home');
  }

  ngOnDestroy() {
    this.stopScan();
  }

  handleImageError(event: any) {
    const fallbackImage = 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop';
    event.target.src = fallbackImage;
  }

  // 🔍 Búsqueda por Nombre
  searchProduct() {
    this.clearState();
    const query = this.productName.trim();

    if (!query) {
      this.scanError = 'Por favor, ingresa un nombre o marca para buscar.';
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;

    setTimeout(() => {
      this.searchResults = this.productsService.searchProducts(query);
      this.isLoading = false;
      this.showResults = true;
      this.scannedBarcode = null;

      if (this.searchResults.length === 0) {
        this.scanError = `No se encontraron resultados para "${query}".`;
      } else {
        this.scanError = null;
      }
    }, 600);
  }

  searchProducts() {
    this.searchProduct();
  }

  // ------------------------------------------------------------------
  // 📸 ESCÁNER CONTINUO MULTI-PRODUCTO (VERSIÓN PRESUPUESTO)
  // ------------------------------------------------------------------

  async startScan() {
    this.isScanning = true;
    this.tempScannedItems = [];
    this.lastScannedCode = '';
    this.lastScannedProduct = null;
    document.body.classList.add('scanner-active');

    if (this.isWeb) {
      setTimeout(() => {
        this.html5QrCode = new Html5Qrcode("price-check-reader");
        this.html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: { width: 260, height: 160 }
          },
          (decodedText) => {
            const now = Date.now();
            if (decodedText === this.lastScannedCode && (now - this.lastScannedTime) < 1400) {
              return;
            }
            this.lastScannedCode = decodedText;
            this.lastScannedTime = now;

            this.processBarcode(decodedText);
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
          while (this.isScanning) {
            const result = await BarcodeScanner.startScan();
            if (!this.isScanning) break;
            if (result.hasContent) {
              const now = Date.now();
              if (result.content === this.lastScannedCode && (now - this.lastScannedTime) < 1400) {
                continue;
              }
              this.lastScannedCode = result.content;
              this.lastScannedTime = now;
              this.processBarcode(result.content);
              await new Promise(r => setTimeout(r, 600));
            }
          }
        }
      } catch (error) {
        console.error('Error scanning barcode native', error);
        this.stopScan();
      }
    }
  }

  startBarcodeScan() {
    this.startScan();
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
  }

  stopScanner(proceedToSearch: boolean = false) {
    this.stopScan();
  }

  async processBarcode(code: string) {
    this.playBeepSound();
    this.triggerHaptic();

    // 1. Si ya está en la bandeja temporal, incrementamos cantidad
    const existingTempIndex = this.tempScannedItems.findIndex(item => item.barcode === code);
    if (existingTempIndex !== -1) {
      this.tempScannedItems[existingTempIndex].quantity++;
      const item = this.tempScannedItems[existingTempIndex];
      const effPrice = (item.inOffer && item.offerPrice) ? item.offerPrice : item.price;
      this.showLiveScanBanner(item.name, effPrice, item.quantity, item.inOffer, item.identified);
      return;
    }

    // 2. Buscar en catálogo
    const product = this.productsService.findProductByBarcode(code);
    if (product) {
      const effectivePrice = (product.inOffer && product.offerPrice) ? product.offerPrice : product.price;
      const newTempItem: TempScannedItem = {
        id: product.id || Date.now(),
        barcode: code,
        name: product.name,
        brand: product.brand || '',
        category: product.category || 'Otros',
        price: product.price,
        offerPrice: product.offerPrice,
        inOffer: product.inOffer,
        image: product.image,
        quantity: 1,
        identified: true
      };
      this.tempScannedItems.unshift(newTempItem);
      this.showLiveScanBanner(product.name, effectivePrice, 1, product.inOffer, true);
    } else {
      // 3. Producto no identificado
      const unrecItem: TempScannedItem = {
        id: 'unrec_' + Date.now(),
        barcode: code,
        name: 'Producto no identificado (' + code.slice(-4) + ')',
        brand: 'Código ' + code,
        category: 'Otros',
        price: 0,
        quantity: 1,
        identified: false,
        unrecognizedCode: code
      };
      this.tempScannedItems.unshift(unrecItem);
      this.showLiveScanBanner('Código ' + code + ' (No identificado)', 0, 1, false, false);
    }
  }

  private showLiveScanBanner(name: string, price: number, quantity: number, inOffer?: boolean, identified: boolean = true) {
    this.lastScannedProduct = { name, price, quantity, inOffer, identified };
    if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.lastScannedProduct = null;
    }, 2800);
  }

  // GESTIÓN DE ITEMS EN LA BANDEJA TEMPORAL
  increaseTempQuantity(index: number) {
    if (this.tempScannedItems[index]) {
      this.tempScannedItems[index].quantity++;
    }
  }

  decreaseTempQuantity(index: number) {
    if (this.tempScannedItems[index]) {
      if (this.tempScannedItems[index].quantity > 1) {
        this.tempScannedItems[index].quantity--;
      } else {
        this.removeTempItem(index);
      }
    }
  }

  removeTempItem(index: number) {
    this.tempScannedItems.splice(index, 1);
  }

  getTempScannedCount(): number {
    return this.tempScannedItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }

  getTempScannedTotal(): number {
    return this.tempScannedItems.reduce((sum, item) => {
      const price = (item.inOffer && item.offerPrice) ? item.offerPrice : item.price;
      return sum + (price * (item.quantity || 1));
    }, 0);
  }

  cancelScanning() {
    this.tempScannedItems = [];
    this.stopScan();
    this.presentToast('Escaneo cancelado');
  }

  confirmScannedProducts() {
    if (this.tempScannedItems.length === 0) return;

    const matchedProducts: Product[] = [];
    for (const temp of this.tempScannedItems) {
      if (temp.identified) {
        const found = this.productsService.findProductByBarcode(temp.barcode);
        if (found && !matchedProducts.some(p => p.barcode === found.barcode)) {
          matchedProducts.push(found);
        } else if (!matchedProducts.some(p => p.barcode === temp.barcode)) {
          matchedProducts.push({
            id: typeof temp.id === 'number' ? temp.id : Date.now(),
            name: temp.name,
            brand: temp.brand,
            category: temp.category,
            price: temp.price,
            offerPrice: temp.offerPrice,
            inOffer: temp.inOffer,
            image: temp.image || 'assets/icon/favicon.png',
            barcode: temp.barcode
          });
        }
      }
    }

    this.stopScan();

    if (matchedProducts.length > 0) {
      this.searchResults = matchedProducts;
      this.hasSearched = true;
      this.showResults = true;
      this.scanError = null;
      this.presentToast(`✅ ${matchedProducts.length} producto(s) cargado(s)`);
    } else {
      this.searchResults = [];
      this.hasSearched = true;
      this.showResults = true;
      this.scanError = 'Los códigos escaneados no se encontraron en el catálogo.';
    }

    this.tempScannedItems = [];
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
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  }

  async triggerHaptic() {
    try {
      if (Capacitor.isPluginAvailable('Haptics')) {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
    } catch (e) {}
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2200,
      position: 'bottom',
      color: 'dark',
      cssClass: 'custom-toast-notification'
    });
    toast.present();
  }

  clearState() {
    this.isLoading = false;
    this.showResults = false;
    this.hasSearched = false;
    this.scanError = null;
    this.scannedBarcode = null;
    this.searchResults = [];
  }

  clearSearch() {
    this.productName = '';
    this.clearState();
    this.stopScan();
  }

  get searchQuery(): string {
    return this.productName;
  }

  set searchQuery(value: string) {
    this.productName = value;
  }

  testService() {
    console.log('Productos:', this.productsService.getAllProducts());
  }
}
