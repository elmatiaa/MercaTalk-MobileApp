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
  cartOutline, checkmarkCircle, alertCircleOutline, refreshOutline,
  sparklesOutline, cardOutline, checkboxOutline, squareOutline,
  leafOutline, swapHorizontalOutline, ribbonOutline, checkmarkDoneOutline,
  chevronDownOutline, chevronUpOutline, chatbubblesOutline, sendOutline,
  micOutline, micOffOutline, volumeHighOutline, volumeMuteOutline,
  bulbOutline, compassOutline, sparkles
} from 'ionicons/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { ProductsService, Product } from '../services/products';
import { ChatService } from '../services/chat.service';
import { WALMART_RECIPES } from '../data/recipes.data';
import { ActivatedRoute, RouterModule } from '@angular/router';

Chart.register(...registerables);

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  color: string;
}

export interface PlannedItem {
  id: string;
  name: string;
  completed: boolean;
}

export interface ChatMsg {
  sender: 'bot' | 'user';
  text: string;
  time: string;
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
  totalSavingsAccumulated: number = 0;
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

  // FASE 2: Descuento por Tarjeta / Fidelidad
  selectedCardDiscount: 'none' | 'lider_bci' | 'club_lider' = 'none';

  // FASE 2: Checklist Interactivo ("Mi Lista vs Lo que Llevo")
  showChecklistDrawer: boolean = false;
  plannedItems: PlannedItem[] = [];
  newPlannedItemText: string = '';

  // FASE 3: Asistente Virtual MercaTalk en el Bolsillo
  showAssistantModal: boolean = false;
  assistantMessages: ChatMsg[] = [];
  assistantInput: string = '';
  assistantLoading: boolean = false;
  assistantSpeaking: boolean = false;
  assistantMuted: boolean = false;
  isListening: boolean = false;
  private recognition: any = null;
  
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
    'Frutas': '#10b981',
    'Snacks': '#7044ff',
    'Otros': '#92949c'
  };

  constructor(
    private productsService: ProductsService,
    private chatService: ChatService,
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
      'refresh-outline': refreshOutline,
      'sparkles-outline': sparklesOutline,
      'card-outline': cardOutline,
      'checkbox-outline': checkboxOutline,
      'square-outline': squareOutline,
      'leaf-outline': leafOutline,
      'swap-horizontal-outline': swapHorizontalOutline,
      'ribbon-outline': ribbonOutline,
      'checkmark-done-outline': checkmarkDoneOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-up-outline': chevronUpOutline,
      'chatbubbles-outline': chatbubblesOutline,
      'send-outline': sendOutline,
      'mic-outline': micOutline,
      'mic-off-outline': micOffOutline,
      'volume-high-outline': volumeHighOutline,
      'volume-mute-outline': volumeMuteOutline,
      'bulb-outline': bulbOutline,
      'compass-outline': compassOutline,
      'sparkles': sparkles
    });
    this.isWeb = !Capacitor.isNativePlatform();
  }

  ngOnInit() {
    this.allProducts = this.productsService.getAllProducts();
    this.loadChecklist();
    this.initSpeechRecognition();

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
    this.stopSpeaking();
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
        this.totalSavingsAccumulated = data.totalSavingsAccumulated || 0;
        this.selectedCardDiscount = data.selectedCardDiscount || 'none';
        if (this.chart) this.updateChart();
        this.syncChecklistWithItems();
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
    this.stopSpeaking();
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

  playSuccessChime() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
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

  // FASE 3 INNOVACIÓN: ASISTENTE VIRTUAL MERCATALK EN EL BOLSILLO
  openAssistantModal() {
    this.showAssistantModal = true;
    if (this.assistantMessages.length === 0) {
      const itemCount = this.getTotalItemsCount();
      const spend = this.getFinalTotalToPay();
      const welcome = itemCount > 0
        ? `¡Hola! Veo que llevas ${itemCount} productos en tu carrito por un total de $${spend.toLocaleString('es-CL')}. Puedes preguntarme ideas de recetas con lo que llevas, ubicación de pasillos o cómo optimizar tu presupuesto.`
        : `¡Hola! Soy tu asistente de compras MercaTalk. A medida que recorras la tienda, pregúntame dudas de precios, pasillos o recetas.`;
      
      this.assistantMessages.push({
        sender: 'bot',
        text: welcome,
        time: this.getCurrentTime()
      });
      this.speakText(welcome);
    }
  }

  closeAssistantModal() {
    this.showAssistantModal = false;
    this.stopSpeaking();
  }

  toggleAssistantMute() {
    this.assistantMuted = !this.assistantMuted;
    if (this.assistantMuted) {
      this.stopSpeaking();
    }
  }

  speakText(text: string) {
    if (this.assistantMuted) return;
    if ('speechSynthesis' in window) {
      this.stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CL';
      utterance.rate = 1.05;
      utterance.onstart = () => { this.assistantSpeaking = true; };
      utterance.onend = () => { this.assistantSpeaking = false; };
      utterance.onerror = () => { this.assistantSpeaking = false; };
      window.speechSynthesis.speak(utterance);
    }
  }

  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.assistantSpeaking = false;
    }
  }

  initSpeechRecognition() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.lang = 'es-CL';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.assistantInput = transcript;
        this.isListening = false;
        this.sendAssistantMessage();
      };

      this.recognition.onerror = () => {
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  toggleVoiceRecognition() {
    if (!this.recognition) {
      this.presentToast('Reconocimiento de voz no soportado en este navegador.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    } else {
      this.isListening = true;
      this.recognition.start();
    }
  }

  async sendAssistantMessage(presetText?: string) {
    const query = (presetText || this.assistantInput).trim();
    if (!query || this.assistantLoading) return;

    this.assistantMessages.push({
      sender: 'user',
      text: query,
      time: this.getCurrentTime()
    });

    this.assistantInput = '';
    this.assistantLoading = true;

    // Procesamiento contextual inteligente de MercaTalk
    const lower = query.toLowerCase();

    // 1. Pregunta sobre cocinar / recetas con lo que lleva en el carro
    if (lower.includes('cocinar') || lower.includes('receta') || lower.includes('preparar') || lower.includes('comer')) {
      const itemsInCart = this.scannedItems.map(i => i.name.toLowerCase());
      let matchedRecipe = WALMART_RECIPES.find(r => 
        itemsInCart.some(it => it.includes(r.mainIngredient.toLowerCase().split(' ')[0]))
      );

      if (!matchedRecipe) {
        matchedRecipe = WALMART_RECIPES[0];
      }

      const reply = `Con los productos de tu carrito te sugiero preparar "${matchedRecipe.name}" (${matchedRecipe.time}, dificultad ${matchedRecipe.difficulty}). Ingrediente principal: ${matchedRecipe.mainIngredient}. ¡Te quedará delicioso y ahorrarás dinero!`;
      this.addBotResponse(reply);
      return;
    }

    // 2. Pregunta sobre ubicación de pasillos
    if (lower.includes('donde') || lower.includes('dónde') || lower.includes('pasillo') || lower.includes('estante') || lower.includes('encuentro')) {
      const all = this.productsService.getAllProducts();
      const found = all.find(p => lower.includes(p.name.toLowerCase()) || lower.includes(p.category.toLowerCase()));
      if (found && found.supermarketLocation) {
        const reply = `${found.name} se encuentra en el ${found.supermarketLocation.aisle}, sección ${found.supermarketLocation.section}, ${found.supermarketLocation.shelf}.`;
        this.addBotResponse(reply);
        return;
      } else {
        const reply = `Ese producto generalmente se encuentra en los pasillos centrales (Pasillo 2 Abarrotes o Pasillo 3 Bebidas). Si necesitas ayuda presiona "Llamar personal".`;
        this.addBotResponse(reply);
        return;
      }
    }

    // 3. Pregunta sobre presupuesto o cuánto le sobra
    if (lower.includes('cuanto me queda') || lower.includes('cuánto me queda') || lower.includes('presupuesto') || lower.includes('sobra') || lower.includes('falta')) {
      const remaining = this.budget - this.getFinalTotalToPay();
      if (remaining >= 0) {
        const reply = `Llevas gastados $${this.getFinalTotalToPay().toLocaleString('es-CL')} de tus $${this.budget.toLocaleString('es-CL')}. Te quedan disponibles $${remaining.toLocaleString('es-CL')} (${100 - this.getBudgetProgressPercentage()}% de margen).`;
        this.addBotResponse(reply);
      } else {
        const reply = `¡Atención! Has superado tu presupuesto por $${Math.abs(remaining).toLocaleString('es-CL')}. Te recomiendo revisar si puedes sustituir algún producto con Smart Switch para volver al margen.`;
        this.addBotResponse(reply);
      }
      return;
    }

    // 4. Consulta a API de Literatus / ChatService si está online
    try {
      const res = await this.chatService.sendMessage(query, 'brief');
      if (res && res.reply) {
        this.addBotResponse(res.reply);
      } else {
        this.addBotResponse('Estoy aquí para ayudarte en tu compra. Puedes consultarme por precios, ofertas o ubicaciones de productos.');
      }
    } catch (e) {
      // Fallback local amigable
      const reply = `Como tu asistente MercaTalk, te recomiendo aprovechar las ofertas destacadas del día en lácteos y abarrotes. ¿Deseas que busquemos algún producto en específico?`;
      this.addBotResponse(reply);
    }
  }

  private addBotResponse(text: string) {
    this.assistantLoading = false;
    this.assistantMessages.push({
      sender: 'bot',
      text: text,
      time: this.getCurrentTime()
    });
    this.speakText(text);
  }

  private getCurrentTime(): string {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  // FASE 2 INNOVACIÓN: SMART SWITCH
  getSmartSwitchForProduct(item: any): { alternative: Product; savings: number } | null {
    return this.productsService.getSmartSwitchAlternative(item);
  }

  applySmartSwitch(index: number) {
    const currentItem = this.scannedItems[index];
    const suggestion = this.getSmartSwitchForProduct(currentItem);
    if (!suggestion) return;

    this.playSuccessChime();
    this.triggerHaptic();

    const oldPrice = (currentItem.inOffer && currentItem.offerPrice) ? currentItem.offerPrice : currentItem.price;
    const newPrice = (suggestion.alternative.inOffer && suggestion.alternative.offerPrice) ? suggestion.alternative.offerPrice : suggestion.alternative.price;
    const qty = currentItem.quantity || 1;
    const totalSaving = (oldPrice - newPrice) * qty;

    this.scannedItems[index] = {
      ...suggestion.alternative,
      quantity: qty
    };

    this.totalSpent -= (oldPrice * qty);
    this.totalSpent += (newPrice * qty);
    this.totalSavingsAccumulated += totalSaving;

    this.updateChart();
    this.presentToast(`¡Smart Switch aplicado! Ahorraste $${totalSaving.toLocaleString('es-CL')}`);
  }

  // FASE 2 INNOVACIÓN: CHECKLIST PRE-SUPERMERCADO
  loadChecklist() {
    const saved = localStorage.getItem('liderin_planned_checklist');
    if (saved) {
      try {
        this.plannedItems = JSON.parse(saved);
      } catch (e) {
        this.plannedItems = [];
      }
    } else {
      this.plannedItems = [
        { id: '1', name: 'Leche', completed: false },
        { id: '2', name: 'Arroz', completed: false },
        { id: '3', name: 'Detergente', completed: false }
      ];
      this.saveChecklist();
    }
  }

  saveChecklist() {
    localStorage.setItem('liderin_planned_checklist', JSON.stringify(this.plannedItems));
  }

  addPlannedItem() {
    if (!this.newPlannedItemText.trim()) return;
    const newItem: PlannedItem = {
      id: Date.now().toString(),
      name: this.newPlannedItemText.trim(),
      completed: false
    };
    this.plannedItems.push(newItem);
    this.newPlannedItemText = '';
    this.saveChecklist();
    this.syncChecklistWithItems();
  }

  togglePlannedItem(index: number) {
    this.plannedItems[index].completed = !this.plannedItems[index].completed;
    this.saveChecklist();
  }

  deletePlannedItem(index: number) {
    this.plannedItems.splice(index, 1);
    this.saveChecklist();
  }

  private syncChecklistWithItems() {
    for (const plan of this.plannedItems) {
      const planNorm = plan.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const isFound = this.scannedItems.some(item => {
        const itemNorm = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return itemNorm.includes(planNorm) || planNorm.includes(itemNorm.split(' ')[0]);
      });
      if (isFound && !plan.completed) {
        plan.completed = true;
      }
    }
    this.saveChecklist();
  }

  getCompletedPlannedCount(): number {
    return this.plannedItems.filter(p => p.completed).length;
  }

  // FASE 2 INNOVACIÓN: DESCUENTOS DE TARJETA
  setCardDiscount(card: 'none' | 'lider_bci' | 'club_lider') {
    this.selectedCardDiscount = card;
    this.updateChart();
    const discount = this.getDiscountAmount();
    if (discount > 0) {
      this.presentToast(`Descuento de tarjeta aplicado: -$${discount.toLocaleString('es-CL')}`);
    }
  }

  getDiscountPercentage(): number {
    if (this.selectedCardDiscount === 'lider_bci') return 6;
    if (this.selectedCardDiscount === 'club_lider') return 3;
    return 0;
  }

  getDiscountAmount(): number {
    const pct = this.getDiscountPercentage();
    if (pct === 0 || this.totalSpent <= 0) return 0;
    return Math.round(this.totalSpent * (pct / 100));
  }

  getFinalTotalToPay(): number {
    return Math.max(0, this.totalSpent - this.getDiscountAmount());
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
      const finalSpend = this.getFinalTotalToPay();
      const remaining = Math.max(0, this.budget - finalSpend);
      const isOver = finalSpend > this.budget;
      return {
        data: {
          labels: isOver ? ['Gastado', 'Excedido'] : ['Gastado', 'Disponible'],
          datasets: [{
            data: isOver ? [this.budget, finalSpend - this.budget] : [finalSpend, remaining],
            backgroundColor: isOver ? ['#ff7a00', '#eb445a'] : ['#0071ce', '#2dd36f'],
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
    return Math.round((this.getFinalTotalToPay() / this.budget) * 100);
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

  getHealthyProductsCount(): number {
    return this.scannedItems.filter(item => !item.seals || item.seals.length === 0).length;
  }

  getProductsWithSealsCount(): number {
    return this.scannedItems.filter(item => item.seals && item.seals.length > 0).length;
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
      this.syncChecklistWithItems();
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
      this.syncChecklistWithItems();
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
      this.syncChecklistWithItems();
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
      this.syncChecklistWithItems();
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
            this.totalSavingsAccumulated = 0;
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
      duration: 2200,
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
      totalSavingsAccumulated: this.totalSavingsAccumulated,
      selectedCardDiscount: this.selectedCardDiscount,
      discountAmount: this.getDiscountAmount(),
      finalTotalToPay: this.getFinalTotalToPay(),
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
      message: `Se ha guardado tu lista con ${this.getTotalItemsCount()} productos y total a pagar de $${this.getFinalTotalToPay().toLocaleString('es-CL')}.`,
      buttons: ['OK']
    });

    await alert.present();
  }
}
