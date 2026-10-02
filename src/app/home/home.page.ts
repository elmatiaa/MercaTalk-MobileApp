import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonLabel, IonIcon,
  IonButton, IonTextarea, IonSpinner, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  chatbubbles, pricetag, location, 
  megaphone, restaurant, phonePortrait,
  personCircleOutline, sparkles, star,
  send, arrowBack, mic, micOff,
  volumeHigh, volumeMute, play, reload,
  informationCircle, calculator, cart, bagCheck,
  chevronDown, apps, map, pricetags, chatbubbleEllipses, checkmarkCircle, ellipsisHorizontal,
  scanOutline, cartOutline, pricetagOutline, qrCode, cube, chevronForward, listOutline,
  arrowForwardOutline, barcodeOutline, people, gift, add, remove, wine, beer, close, checkmark,
  ellipseOutline, storefrontOutline, navigateOutline, mapOutline
} from 'ionicons/icons';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ChatService, ApiResponse } from '../services/chat.service';
import { ProductsService, Product } from '../services/products';
import { RecipesService, Recipe } from '../services/recipes.service';
import { OffersService, Offer } from '../services/offers.service';
import { SupermarketService, Supermarket } from '../services/supermarket.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, 
    IonList, IonItem, IonLabel, IonIcon,
    IonButton, IonTextarea, IonSpinner, IonBadge,
    FormsModule,
    CommonModule
  ]
})
export class HomePage implements OnInit, OnDestroy {
  languages = [
    {
      id: 'es',
      name: 'Español',
      image: 'https://flagcdn.com/w40/cl.png',
      greeting: '¡Hola! ¿En qué puedo ayudarte hoy?'
    },
    {
      id: 'en',
      name: 'English',
      image: 'https://flagcdn.com/w40/us.png',
      greeting: 'Hello! How can I help you today?'
    },
    {
      id: 'pt',
      name: 'Português',
      image: 'https://flagcdn.com/w40/br.png',
      greeting: 'Olá! Como posso te ajudar hoje?'
    }
  ];

  currentLanguageObj = this.languages[0];
  chatMessage = this.currentLanguageObj.greeting;
  showChatInput = false;
  showSelector = false;
  showSupermarketSelector = false;

  supermarkets: Supermarket[] = [];
  currentSupermarket!: Supermarket;

  // PROPIEDADES PARA CONTROLAR CONVERSACIÓN
  isInConversation = false;
  userMessage: string = '';
  isLoading: boolean = false;

  // PROPIEDADES PARA TEXTO A VOZ
  isListening = false;
  isSpeaking = false;
  speechSupported = false;
  isMuted = false;

  constructor(
    private router: Router,
    private chatService: ChatService,
    private productsService: ProductsService,
    private recipesService: RecipesService,
    private offersService: OffersService,
    public supermarketService: SupermarketService,
    private sanitizer: DomSanitizer
  ) {
    addIcons({
      chatbubbles,
      pricetag,
      location,
      megaphone,
      restaurant,
      'phone-portrait': phonePortrait,
      'person-circle-outline': personCircleOutline,
      sparkles,
      star,
      send,
      'arrow-back': arrowBack,
      mic,
      'mic-off': micOff,
      'volume-high': volumeHigh,
      'volume-mute': volumeMute,
      play,
      reload,
      'information-circle': informationCircle,
      calculator,
      cart,
      'bag-check': bagCheck,
      'chevron-down': chevronDown,
      apps,
      map,
      pricetags,
      'chatbubble-ellipses': chatbubbleEllipses,
      'checkmark-circle': checkmarkCircle,
      'ellipsis-horizontal': ellipsisHorizontal,
      'scan-outline': scanOutline,
      'cart-outline': cartOutline,
      'pricetag-outline': pricetagOutline,
      'qr-code': qrCode,
      cube,
      'chevron-forward': chevronForward,
      'list-outline': listOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'barcode-outline': barcodeOutline,
      people,
      gift,
      add,
      remove,
      wine,
      beer,
      close,
      checkmark,
      'ellipse-outline': ellipseOutline,
      'storefront-outline': storefrontOutline,
      'navigate-outline': navigateOutline,
      'map-outline': mapOutline
    });
  }

  savedListsCount = 0;

  // LOCALES EN TU ZONA
  showStoreLocatorModal: boolean = false;
  storeLocatorMapUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
  storeMapsSearchUrl: string = '';
  currentStoreBranches: Array<{name: string; address: string; hours: string; mapsUrl: string}> = [];

  private readonly STORE_BRANCHES: Record<string, Array<{name: string; address: string; hours: string; mapsUrl: string}>> = {
    lider: [
      { name: 'Líder Maipú', address: 'Av. Pajaritos 3500, Maipú', hours: 'Lun-Dom 8:00–23:00', mapsUrl: 'https://maps.google.com/?q=Lider+Maipu+Pajaritos' },
      { name: 'Líder Pudahuel', address: 'Av. Américo Vespucio 1660, Pudahuel', hours: 'Lun-Dom 8:00–23:00', mapsUrl: 'https://maps.google.com/?q=Lider+Pudahuel+Vespucio' },
      { name: 'Líder Renca', address: 'Av. Jorge Alessandri 12100, Renca', hours: 'Lun-Dom 8:00–22:30', mapsUrl: 'https://maps.google.com/?q=Lider+Renca' },
      { name: 'Líder Quilicura', address: 'Av. El Salto 3600, Quilicura', hours: 'Lun-Dom 8:00–23:00', mapsUrl: 'https://maps.google.com/?q=Lider+Quilicura' },
      { name: 'Líder Belloto', address: 'Av. Chorrillos 30, Quilpué', hours: 'Lun-Dom 8:00–22:00', mapsUrl: 'https://maps.google.com/?q=Lider+Belloto+Quilpue' }
    ],
    tottus: [
      { name: 'Tottus Parque Arauco', address: 'Av. Kennedy 5413, Las Condes', hours: 'Lun-Dom 10:00–22:00', mapsUrl: 'https://maps.google.com/?q=Tottus+Parque+Arauco' },
      { name: 'Tottus Mall Plaza Vespucio', address: 'Av. Vicuña Mackenna 7110, La Florida', hours: 'Lun-Dom 10:00–22:00', mapsUrl: 'https://maps.google.com/?q=Tottus+Plaza+Vespucio' },
      { name: 'Tottus Maipú', address: 'Av. Américo Vespucio 599, Maipú', hours: 'Lun-Dom 8:00–23:00', mapsUrl: 'https://maps.google.com/?q=Tottus+Maipu' },
      { name: 'Tottus Quilicura', address: 'Av. Marta Colvin 5035, Quilicura', hours: 'Lun-Dom 8:00–23:00', mapsUrl: 'https://maps.google.com/?q=Tottus+Quilicura' },
      { name: 'Tottus La Serena', address: 'Av. Francisco de Aguirre 285, La Serena', hours: 'Lun-Dom 8:00–22:30', mapsUrl: 'https://maps.google.com/?q=Tottus+La+Serena' }
    ],
    santaisabel: [
      { name: 'Santa Isabel Ñuñoa', address: 'Av. Irarrázaval 2740, Ñuñoa', hours: 'Lun-Dom 7:30–23:00', mapsUrl: 'https://maps.google.com/?q=Santa+Isabel+Nunoa' },
      { name: 'Santa Isabel Providencia', address: 'Av. Ricardo Lyon 2222, Providencia', hours: 'Lun-Dom 7:30–23:00', mapsUrl: 'https://maps.google.com/?q=Santa+Isabel+Providencia' },
      { name: 'Santa Isabel Maipú', address: 'Av. 5 de Abril 3650, Maipú', hours: 'Lun-Dom 7:30–22:30', mapsUrl: 'https://maps.google.com/?q=Santa+Isabel+Maipu' },
      { name: 'Santa Isabel San Miguel', address: 'Av. Departamental 3550, San Miguel', hours: 'Lun-Dom 7:30–23:00', mapsUrl: 'https://maps.google.com/?q=Santa+Isabel+San+Miguel' },
      { name: 'Santa Isabel Estación Central', address: 'Av. Alameda 3450, Estación Central', hours: 'Lun-Dom 7:30–22:30', mapsUrl: 'https://maps.google.com/?q=Santa+Isabel+Estacion+Central' }
    ]
  };

  openStoreLocatorModal() {
    const id = this.currentSupermarket?.id || 'lider';
    this.currentStoreBranches = this.STORE_BRANCHES[id] || [];

    const searchQuery = encodeURIComponent(this.currentSupermarket?.name || 'Líder');
    this.storeMapsSearchUrl = `https://www.google.com/maps/search/${searchQuery}/@-33.4489,-70.6693,12z`;

    // Mapa OpenStreetMap centrado en Santiago, con query del supermercado activo
    const osmQuery = encodeURIComponent(this.currentSupermarket?.name || 'Líder');
    const rawUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-70.7500%2C-33.5400%2C-70.5500%2C-33.3500&layer=mapnik&marker=-33.4489,-70.6693`;
    this.storeLocatorMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);

    this.showStoreLocatorModal = true;
  }

  closeStoreLocatorModal() {
    this.showStoreLocatorModal = false;
  }

  // FASE LISTA RÁPIDA / DEMO (SECCIÓN 1)
  showQuickListModal: boolean = false;
  selectedQuickOption: 'comida_familiar' | 'cumpleanos' = 'comida_familiar';
  familyPeopleCount: number = 4;
  birthdayType: 'infantil' | 'adulto' = 'infantil';

  openQuickListModal() {
    this.showQuickListModal = true;
  }

  closeQuickListModal() {
    this.showQuickListModal = false;
  }

  selectQuickOption(option: 'comida_familiar' | 'cumpleanos') {
    this.selectedQuickOption = option;
  }

  increaseFamilyPeople() {
    if (this.familyPeopleCount < 15) {
      this.familyPeopleCount++;
    }
  }

  decreaseFamilyPeople() {
    if (this.familyPeopleCount > 1) {
      this.familyPeopleCount--;
    }
  }

  isDoubleStock(): boolean {
    return this.familyPeopleCount >= 6;
  }

  selectBirthdayType(type: 'infantil' | 'adulto') {
    this.birthdayType = type;
  }

  startPitchDemo() {
    this.openQuickListModal();
  }

  proceedToGenerateList() {
    this.closeQuickListModal();
    this.router.navigate(['/presupuesto'], { 
      queryParams: { 
        quickList: this.selectedQuickOption,
        people: this.familyPeopleCount,
        birthdayType: this.birthdayType
      } 
    });
  }

  ngOnInit() {
    this.checkSpeechSupport();
    this.supermarkets = this.supermarketService.getSupermarketList();
    this.supermarketService.currentSupermarket$.subscribe(s => {
      this.currentSupermarket = s;
    });
  }

  toggleSupermarketSelector() {
    this.showSupermarketSelector = !this.showSupermarketSelector;
    if (this.showSupermarketSelector) {
      this.showSelector = false;
    }
  }

  selectSupermarket(id: 'lider' | 'tottus' | 'santaisabel') {
    this.supermarketService.setSupermarket(id);
    this.showSupermarketSelector = false;
  }

  ionViewDidEnter() {
    this.loadSavedListsCount();
  }

  loadSavedListsCount() {
    const previousSaved = localStorage.getItem('liderin_budgets');
    if (previousSaved) {
      const budgetsArray = JSON.parse(previousSaved);
      this.savedListsCount = budgetsArray.length;
    } else {
      this.savedListsCount = 0;
    }
  }

  ngOnDestroy() {
    this.stopSpeaking();
    this.stopListening();
  }

  // 🆕 TOGGLE PARA SILENCIAR
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted && this.isSpeaking) {
      this.stopSpeaking();
    }
    
    // Guardar preferencia en localStorage
    localStorage.setItem('liderin_muted', this.isMuted.toString());
  }

  // Cargar preferencia de mute al inicializar
  private loadMutePreference() {
    const savedMute = localStorage.getItem('liderin_muted');
    if (savedMute) {
      this.isMuted = savedMute === 'true';
    }
  }

  // VERIFICAR SOPORTE DE VOZ (actualizado)
  private checkSpeechSupport() {
    // Verificar Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.speechSupported = !!SpeechRecognition && !!navigator.mediaDevices;
    
    // Cargar preferencia de mute
    this.loadMutePreference();
    
    if (!this.speechSupported) {
      console.warn('Speech recognition no está soportado en este navegador');
    } else {
      console.log('Speech recognition soportado');
    }
  }

  // INICIAR RECONOCIMIENTO DE VOZ
  async startListening() {
    if (!this.speechSupported || this.isListening) return;

    try {
      // 1. Primero solicitar permiso del micrófono
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        // Detener el stream inmediatamente (solo necesitamos el permiso)
        stream.getTracks().forEach(track => track.stop());
      } catch (mediaError) {
        console.error('Permiso de micrófono denegado:', mediaError);
        alert('Por favor permite el acceso al micrófono para usar el reconocimiento de voz.');
        return;
      }

      this.isListening = true;
      
      // 2. Usar Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'es-CL';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log('Reconocimiento de voz iniciado');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Texto reconocido:', transcript);
        this.userMessage = transcript;
        this.isListening = false;
      };
      
      recognition.onerror = (event: any) => {
        console.error('Error en reconocimiento de voz:', event.error);
        this.isListening = false;
        
        if (event.error === 'not-allowed') {
          alert('Permiso de micrófono denegado. Por favor habilita el micrófono en la configuración de tu navegador.');
        }
      };
      
      recognition.onend = () => {
        this.isListening = false;
      };
      
      recognition.start();
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.isListening = false;
    }
  }

  // DETENER RECONOCIMIENTO DE VOZ
  stopListening() {
    this.isListening = false;
  }

  // TOGGLE DE MICRÓFONO
  async toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      await this.startListening();
    }
  }

  // REPRODUCIR TEXTO COMO VOZ (actualizado con mute)
  async speakText(text: string) {
    if (this.isSpeaking || this.isMuted) {
      this.stopSpeaking();
      return;
    }

    try {
      this.isSpeaking = true;
      
      // Limpiar texto para voz (remover emojis y formato)
      const cleanText = this.cleanTextForSpeech(text);
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-CL';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        this.isSpeaking = false;
      };
      
      utterance.onerror = (event) => {
        console.error('Error en texto a voz:', event);
        this.isSpeaking = false;
      };
      
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      this.isSpeaking = false;
    }
  }

  // DETENER VOZ
  stopSpeaking() {
    if (this.isSpeaking) {
      speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  // LIMPIAR TEXTO PARA VOZ
  private cleanTextForSpeech(text: string): string {
    return text
      .replace(/[**\*#`]/g, '') // Remover markdown
      .replace(/[🍳🛒✅❌🔥💰📍🎯📦⏰👩‍🍳📝🥘📋]/g, '') // Remover emojis
      .replace(/\n{3,}/g, '. ') // Reemplazar saltos de línea
      .replace(/\n/g, '. ')
      .replace(/\.\s+\./g, '. ')
      .trim();
  }

  // MÉTODOS PARA CONTROLAR CONVERSACIÓN (actualizado con mute)
  startConversation() {
    this.isInConversation = true;
    this.showChatInput = true;
    this.userMessage = '';
    
    // Mensaje de bienvenida con voz opcional (solo si no está silenciado)
    setTimeout(() => {
      if (!this.isMuted) {
        this.speakText(this.currentLanguageObj.greeting);
      }
    }, 500);
  }

  endConversation() {
    this.isInConversation = false;
    this.showChatInput = false;
    this.userMessage = '';
    this.stopSpeaking();
    // Restaurar mensaje inicial
    this.chatMessage = this.currentLanguageObj.greeting;
  }

  // BOTÓN PARA REPETIR VOZ (actualizado con mute)
  repeatVoice() {
    if (this.chatMessage && !this.isSpeaking && !this.isMuted) {
      this.speakText(this.chatMessage);
    }
  }

  // MÉTODOS DE NAVEGACIÓN Y UI
  toggleSelector() {
    this.showSelector = !this.showSelector;
  }

  changeLanguage(languageId: string) {
    const selected = this.languages.find(l => l.id === languageId);
    if (selected) {
      this.currentLanguageObj = selected;
      if (!this.isInConversation) {
        this.chatMessage = selected.greeting;
      }
      if (typeof (window as any).changeGoogleTranslateLanguage === 'function') {
        (window as any).changeGoogleTranslateLanguage(languageId);
      }
    }
    this.showSelector = false;
  }

  navigateToPriceCheck() {
    this.router.navigate(['/price-check']);
  }

  navigateToStoreLocator() {
    this.router.navigate(['/store-locator']);
  }

  navigateToOffers() {
    this.router.navigate(['/offers']);
  }

  navigateToRecipes() {
    this.router.navigate(['/recipes']);
  }

  navigateToAppDownload() {
    this.router.navigate(['/app-download']);
  }

  navigateToPresupuesto() {
    this.router.navigate(['/presupuesto']);
  }

  navigateToMisListas() {
    this.router.navigate(['/mis-listas']);
  }

  // MÉTODO PARA ENVIAR MENSAJE (actualizado con mute)
  async sendMessage() {
    if (!this.userMessage.trim() || this.isLoading) return;

    const userText = this.userMessage.trim();
    this.isLoading = true;

    try {
      const intent = this.analyzeIntent(userText);
      
      let finalMessage = userText;
      let relevantProducts: Product[] = [];
      let relevantRecipes: Recipe[] = [];
      let relevantOffers: Offer[] = [];
      
      // Lógica de búsqueda en los servicios locales
      if (intent.hasProductIntent && (intent.intentType === 'precio' || intent.intentType === 'ubicacion')) {
        relevantProducts = this.findPreciseProducts(
          intent.searchTerm, 
          intent.specificProduct,
          intent.productType,
          intent.intentType
        );
      }
      
      if (intent.hasOfferIntent || intent.intentType === 'ofertas') {
        relevantOffers = this.findRelevantOffers(intent.searchTerm);
      }
      
      if (intent.hasRecipeIntent) {
        relevantRecipes = this.findRelevantRecipes(
          intent.searchTerm,
          intent.recipeType
        );
      }
      
      const shouldAddContext = 
        (intent.intentType === 'precio' && relevantProducts.length > 0) ||
        (intent.intentType === 'ubicacion' && relevantProducts.length > 0) ||
        (intent.intentType === 'ofertas' && relevantOffers.length > 0) ||
        (intent.intentType === 'receta');

      if (shouldAddContext) {
        finalMessage = this.createPreciseContext(
          userText, 
          relevantProducts, 
          relevantRecipes, 
          relevantOffers,
          intent.intentType
        );
      }
      
      // ENVIAR A GEMINI con los datos de los servicios locales
      const response: ApiResponse = await this.chatService.sendMessage(finalMessage, 'normal');
      
      // Procesar respuesta usando datos locales
      if (intent.hasRecipeIntent) {
        const ingredients = this.extractIngredientsFromRecipe(response.reply);
        
        if (ingredients.length > 0) {
          const classifiedProducts = this.classifyProductsByAvailability(ingredients);
          
          const unifiedResponse = this.createUnifiedRecipeResponse(
            response.reply,
            classifiedProducts.available,
            classifiedProducts.unavailable
          );
          
          this.chatMessage = unifiedResponse;
        } else {
          this.chatMessage = this.cleanRecipeText(response.reply);
        }
      } else {
        this.chatMessage = response.reply;
      }

      // REPRODUCIR RESPUESTA CON VOZ (solo si no está silenciado)
      setTimeout(() => {
        if (!this.isMuted) {
          this.speakText(this.chatMessage);
        }
      }, 1000);

    } catch (error) {
      let errorMessage = 'Lo siento, hubo un error. Por favor intenta nuevamente.';
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      this.chatMessage = errorMessage;
    } finally {
      this.isLoading = false;
      this.userMessage = '';
    }
  }

  // MÉTODOS PRIVADOS EXISTENTES
  private findSpecificProduct(message: string, productCategory: string): string {
    const productPatterns: { [key: string]: string[] } = {
      'leche': ['soprole', 'colun', 'loncoleche'],
      'arroz': ['tucapel', 'grado 1'],
      'aceite': ['chef', 'maravilla'],
      'té': ['supremo'],
      'queso': ['mantecoso'],
      'vino': ['carmenere', 'casa real'],
      'mantequilla': ['con sal'],
      'atún': ['lomitos', 'agua']
    };
    
    const patterns = productPatterns[productCategory];
    if (patterns) {
      const found = patterns.find(pattern => message.includes(pattern));
      if (found) {
        return `${found} ${productCategory}`;
      }
    }
    
    return productCategory;
  }

  private findProductType(message: string, productCategory: string): string {
    const typePatterns: { [key: string]: string[] } = {
      'leche': ['entera', 'deslactosada', 'semidescremada', 'descremada'],
      'arroz': ['grado 1', 'integral', 'largo', 'corto'],
      'aceite': ['maravilla', 'girasol', 'oliva']
    };
    
    const patterns = typePatterns[productCategory];
    if (patterns) {
      const found = patterns.find(pattern => message.includes(pattern));
      if (found) {
        return found;
      }
    }
    
    return '';
  }

  private findPreciseProducts(searchTerm: string, specificProduct?: string, productType?: string, intentType?: string): Product[] {
    let products: Product[] = [];
    
    if (specificProduct) {
      products = this.productsService.searchProducts(specificProduct);
    } else {
      products = this.productsService.searchProducts(searchTerm);
    }
    
    if (productType) {
      products = products.filter(product => 
        product.name.toLowerCase().includes(productType) ||
        product.brand.toLowerCase().includes(productType)
      );
    }
    
    return this.applyProductLimits(products, intentType);
  }

  private applyProductLimits(products: Product[], intentType?: string): Product[] {
    if (intentType === 'categoria' || intentType === 'general') {
      return products.slice(0, 3);
    }
    
    if (products.length > 5 && intentType === 'general') {
      return products.slice(0, 3);
    }
    
    return products;
  }

  private findRelevantRecipes(searchTerm: string, recipeType?: string): Recipe[] {
    let recipes: Recipe[] = [];
    
    if (recipeType) {
      recipes = this.recipesService.searchRecipes(recipeType);
    } else if (searchTerm) {
      recipes = this.recipesService.searchRecipes(searchTerm);
    } else {
      recipes = this.recipesService.getEasyRecipes().slice(0, 3);
    }
    
    return recipes.slice(0, 2);
  }

  private findRelevantOffers(searchTerm: string): Offer[] {
    let offers: Offer[] = [];
    
    if (searchTerm) {
      offers = this.offersService.searchOffers(searchTerm);
    } else {
      offers = this.offersService.getBestOffers();
    }
    
    if (offers.length === 0) {
      offers = this.offersService.getAllOffers().slice(0, 3);
    }
    
    return offers.slice(0, 3);
  }

  private classifyProductsByAvailability(ingredientList: string[]): { available: any[], unavailable: any[] } {
    const available = [];
    const unavailable = [];
    const allProducts = this.productsService.getAllProducts();
    
    for (const ingredient of ingredientList) {
      const foundProduct = allProducts.find(product => 
        product.name.toLowerCase().includes(ingredient.toLowerCase()) ||
        product.category.toLowerCase().includes(ingredient.toLowerCase())
      );
      
      if (foundProduct) {
        available.push({
          name: foundProduct.name,
          price: foundProduct.price,
          brand: foundProduct.brand,
          inOffer: foundProduct.inOffer,
          offerPrice: foundProduct.offerPrice
        });
      } else {
        const cleanIngredient = this.cleanIngredientName(ingredient);
        if (cleanIngredient && cleanIngredient.length > 1) {
          unavailable.push({
            name: cleanIngredient,
            status: 'No disponible en inventario'
          });
        }
      }
    }
    
    return { available, unavailable };
  }

  private cleanIngredientName(ingredient: string): string {
    return ingredient
      .replace(/[•\*\d\s](cucharaditas?|cucharadas?|tazas?|gramos?|ml|kg)?\s*de\s+/gi, '')
      .replace(/^\s*\d+\s*/, '')
      .replace(/[•\-\*]/g, '')
      .trim();
  }

  private cleanRecipeText(recipeText: string): string {
    let cleaned = recipeText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleaned;
  }

  private extractIngredientsFromRecipe(recipeText: string): string[] {
    const cleanedText = this.cleanRecipeText(recipeText);
    
    const ingredientSectionMatch = cleanedText.match(/(ingredientes?:?|para\s+la\s+receta:?)(.*?)(?=preparación|instrucciones|pasos|procedimiento|$)/i);
    
    if (ingredientSectionMatch) {
      const ingredientSection = ingredientSectionMatch[0];
      
      const ingredientPatterns = [
        /•\s*([^•\n]+)/g,
        /-\s*([^\n]+)/g,
        /\*\s*([^\n]+)/g,
        /(\d+[^•\n]*)/g
      ];
      
      for (const pattern of ingredientPatterns) {
        const matches = ingredientSection.match(pattern);
        if (matches && matches.length > 0) {
          return matches
            .map(m => this.cleanIngredientName(m))
            .filter(m => m.length > 2 && !m.includes(':') && !m.match(/^\d+$/))
            .slice(0, 10);
        }
      }
    }
    
    const commonIngredients = [
      'arroz', 'pollo', 'cebolla', 'pimentón', 'caldo', 'arvejas', 'aceite', 
      'sal', 'pimienta', 'colorante', 'ajo', 'zanahoria', 'tomate', 'queso',
      'leche', 'harina', 'mantequilla', 'huevo', 'carne', 'pescado', 'pasta',
      'fideos', 'limón', 'cilantro', 'perejil', 'orégano', 'albahaca'
    ];
    
    const foundIngredients = commonIngredients.filter(ingredient => 
      cleanedText.toLowerCase().includes(ingredient)
    );
    
    return foundIngredients.length > 0 ? foundIngredients : [];
  }

  private createUnifiedRecipeResponse(recipeText: string, availableProducts: any[], unavailableProducts: any[]): string {
    const cleanedRecipe = this.cleanRecipeText(recipeText);
    
    let response = "Receta Completa\n\n";
    response += cleanedRecipe + "\n\n";
    
    if (availableProducts.length > 0) {
      response += "✅ Productos Disponibles en Líder\n";
      availableProducts.forEach(product => {
        response += `• ${product.name} - ${product.brand} - $${product.inOffer ? product.offerPrice : product.price}`;
        if (product.inOffer) response += " 🔥 OFERTA";
        response += "\n";
      });
      response += "\n";
    }
    
    if (unavailableProducts.length > 0) {
      response += "❌ Productos que Necesitas Comprar\n";
      unavailableProducts.forEach(product => {
        response += `• ${product.name}\n`;
      });
    }
    
    return response;
  }

  private analyzeIntent(message: string): { 
    hasProductIntent: boolean;
    hasRecipeIntent: boolean;
    hasOfferIntent: boolean;
    searchTerm: string;
    intentType: 'precio' | 'ubicacion' | 'ofertas' | 'general' | 'categoria' | 'receta';
    specificProduct?: string;
    productType?: string;
    recipeType?: string;
  } {
    const lowerMessage = message.toLowerCase().trim();
    
    const knownProducts = ['leche', 'arroz', 'aceite', 'té', 'atún', 'harina', 'queso', 'vino', 'mantequilla'];
    const priceKeywords = ['precio', 'cuánto', 'vale', 'cuesta', 'valor'];
    const locationKeywords = ['dónde', 'ubicación', 'pasillo', 'estante', 'sección', 'encuentro'];
    const offerKeywords = ['oferta', 'descuento', 'promoción', 'rebaja', 'ofertas', 'barato', 'económico'];
    const categoryKeywords = ['tipos', 'clases', 'variedades', 'categorías'];
    
    const recipeKeywords = ['receta', 'cocinar', 'preparar', 'hacer', 'cocina', 'cómo hacer', 'recetas', 'plato', 'comida', 'preparación'];
    const specificRecipeKeywords = ['quesadilla', 'ensalada', 'marinada', 'pan', 'arroz', 'atún', 'carne', 'mediterránea', 
                                   'lasaña', 'pastel', 'sopa', 'postre', 'torta', 'guiso', 'estofado', 'asado', 'parrilla'];
    
    let hasOfferIntent = offerKeywords.some(keyword => lowerMessage.includes(keyword));
    
    let hasRecipeIntent = false;
    let recipeType = '';
    
    if (recipeKeywords.some(keyword => lowerMessage.includes(keyword))) {
      hasRecipeIntent = true;
      
      const foundRecipe = specificRecipeKeywords.find(recipe => lowerMessage.includes(recipe));
      if (foundRecipe) {
        recipeType = foundRecipe;
      } else {
        if (lowerMessage.includes('atún')) recipeType = 'atún';
        else if (lowerMessage.includes('queso')) recipeType = 'queso';
        else if (lowerMessage.includes('vino')) recipeType = 'marinada';
        else if (lowerMessage.includes('mantequilla')) recipeType = 'pan';
        else if (lowerMessage.includes('arroz')) recipeType = 'arroz';
        else if (lowerMessage.includes('pasta') || lowerMessage.includes('fideos')) recipeType = 'pasta';
        else if (lowerMessage.includes('pollo')) recipeType = 'pollo';
        else if (lowerMessage.includes('pescado')) recipeType = 'pescado';
        else recipeType = 'general';
      }
    }
    
    let foundProduct = '';
    let specificProduct = '';
    let productType = '';
    
    knownProducts.forEach(product => {
      if (lowerMessage.includes(product)) {
        foundProduct = product;
        const productMatch = this.findSpecificProduct(lowerMessage, product);
        if (productMatch) specificProduct = productMatch;
        const typeMatch = this.findProductType(lowerMessage, product);
        if (typeMatch) productType = typeMatch;
      }
    });
    
    let intentType: 'precio' | 'ubicacion' | 'ofertas' | 'general' | 'categoria' | 'receta' = 'general';
    
    if (hasOfferIntent) {
      intentType = 'ofertas';
    } else if (hasRecipeIntent) {
      intentType = 'receta';
    } else if (priceKeywords.some(keyword => lowerMessage.includes(keyword))) {
      intentType = 'precio';
    } else if (locationKeywords.some(keyword => lowerMessage.includes(keyword))) {
      intentType = 'ubicacion';
    } else if (categoryKeywords.some(keyword => lowerMessage.includes(keyword)) || 
               lowerMessage.includes('todas las') || 
               lowerMessage.includes('todos los')) {
      intentType = 'categoria';
    }
    
    return {
      hasProductIntent: !!foundProduct,
      hasRecipeIntent,
      hasOfferIntent,
      searchTerm: foundProduct,
      intentType,
      specificProduct,
      productType,
      recipeType
    };
  }

  private createPreciseContext(userMessage: string, products: Product[], recipes: Recipe[], offers: Offer[], intentType: string): string {
    let context = `Cliente pregunta: "${userMessage}"\n\n`;
    
    if (products.length > 0) {
      const productDetails = products.map(product => {
        const priceInfo = product.inOffer ? 
          `💰 OFERTA: $${product.offerPrice} (Normal: $${product.price})` : 
          `💰 Precio: $${product.price}`;
        
        const locationInfo = product.supermarketLocation ? 
          `📍 ${product.supermarketLocation.aisle}, ${product.supermarketLocation.section}, ${product.supermarketLocation.shelf}` : '';
        
        return `🛒 ${product.name} ${product.brand}\n${priceInfo}\n${locationInfo}`;
      }).join('\n\n');
      
      context += `INFORMACIÓN DE PRODUCTOS LÍDER:\n${productDetails}\n\n`;
    }
    
    if (offers.length > 0) {
      const offerDetails = offers.map(offer => {
        if (offer.discount > 0) {
          return `🔥 OFERTA ESPECIAL\n🛒 ${offer.product}\n💰 Precio original: $${offer.originalPrice} | OFERTA: $${offer.price}\n🎯 Ahorras: $${offer.originalPrice - offer.price} (${offer.discount}% de descuento)\n📦 Categoría: ${offer.category}\n⏰ Válido hasta: ${offer.validUntil}`;
        } else {
          return `🛒 ${offer.product}\n💰 Precio: $${offer.price}\n📦 Categoría: ${offer.category}\n⏰ Disponible hasta: ${offer.validUntil}`;
        }
      }).join('\n\n');
      
      context += `OFERTAS ACTUALES LÍDER:\n${offerDetails}\n\n`;
    }
    
    if (recipes.length > 0) {
      const recipeDetails = recipes.map(recipe => {
        return `🍳 ${recipe.name}\n📝 ${recipe.description}\n⏱️ Tiempo: ${recipe.time} | Dificultad: ${recipe.difficulty}\n🥘 Categoría: ${recipe.category}\n📋 Ingrediente principal: ${recipe.mainIngredient}\n🛒 INGREDIENTES EXACTOS:\n${recipe.ingredients.map(ing => `• ${ing}`).join('\n')}\n👩‍🍳 PASOS EXACTOS:\n${recipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`;
      }).join('\n\n');
      
      context += `RECETAS OFICIALES LÍDER:\n${recipeDetails}\n\n`;
    }
    
    let contextInstruction = '';
    switch (intentType) {
      case 'precio':
        contextInstruction = 'Responde enfocándote SOLO en los precios exactos y ofertas.';
        break;
      case 'ubicacion':
        contextInstruction = 'Responde enfocándote SOLO en las ubicaciones exactas dentro de la tienda.';
        break;
      case 'ofertas':
        contextInstruction = 'Responde destacando SOLO las ofertas actuales. Menciona precios originales, precios de oferta, ahorros y fechas de vencimiento. Sé entusiasta con los descuentos.';
        break;
      case 'categoria':
        contextInstruction = 'Responde mostrando una variedad representativa (máximo 3 productos).';
        break;
      case 'receta':
        contextInstruction = 'Proporciona una receta completa y deliciosa con pasos detallados. Sé entusiasta y amigable en tu explicación. Incluye una sección clara de ingredientes.';
        break;
      default:
        contextInstruction = 'Responde con información balanceada y útil.';
    }
    
    context += `INSTRUCCIÓN: ${contextInstruction}\n\nResponde como Liderín de manera alegre y servicial.`;
    
    return context;
  }
} 
 
 
