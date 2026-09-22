import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonContent, IonButton, IonIcon, ToastController
} from '@ionic/angular/standalone';
import { RouterModule, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, cartOutline, timeOutline, restaurantOutline,
  closeOutline, checkmarkCircleOutline, listOutline, chevronForwardOutline
} from 'ionicons/icons';
import { WALMART_RECIPES } from '../data/recipes.data';
import { ProductsService } from '../services/products';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.page.html',
  styleUrls: ['./recipes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader, IonContent,
    IonButton, IonIcon
  ]
})
export class RecipesPage {
  recipes = WALMART_RECIPES;
  selectedRecipe: any = null;
  showRecipeModal = false;
  
  constructor(
    private router: Router,
    private toastController: ToastController,
    private productsService: ProductsService
  ) {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'cart-outline': cartOutline,
      'time-outline': timeOutline,
      'restaurant-outline': restaurantOutline,
      'close-outline': closeOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'list-outline': listOutline,
      'chevron-forward-outline': chevronForwardOutline
    });
  }

  viewRecipe(recipe: any) {
    this.selectedRecipe = recipe;
    this.showRecipeModal = true;
  }

  closeRecipeModal() {
    this.showRecipeModal = false;
    this.selectedRecipe = null;
  }

  async addIngredientsToBudget(recipe: any) {
    // Obtener presupuesto activo o crear uno
    const saved = localStorage.getItem('liderin_budgets');
    let budgetsArray: any[] = [];
    if (saved) {
      try {
        budgetsArray = JSON.parse(saved);
      } catch (e) {
        budgetsArray = [];
      }
    }

    let activeBudget = budgetsArray[0];
    if (!activeBudget) {
      activeBudget = {
        date: new Date().toISOString(),
        budget: 20000,
        totalSpent: 0,
        items: []
      };
      budgetsArray.unshift(activeBudget);
    }

    let addedCount = 0;
    for (const ing of recipe.ingredients) {
      // Buscar en el catálogo si existe un producto relacionado
      const matchedProduct = this.productsService.searchProducts(ing)[0];
      if (matchedProduct) {
        const effectivePrice = (matchedProduct.inOffer && matchedProduct.offerPrice) ? matchedProduct.offerPrice : matchedProduct.price;
        activeBudget.items.unshift({ ...matchedProduct, quantity: 1 });
        activeBudget.totalSpent += effectivePrice;
        addedCount++;
      } else {
        // Crear un producto estimado
        const estimatedPrice = 1200;
        activeBudget.items.unshift({
          id: Date.now() + Math.random(),
          name: ing,
          brand: 'Receta',
          category: 'Abarrotes',
          price: estimatedPrice,
          quantity: 1,
          barcode: 'RECETA-' + Date.now()
        });
        activeBudget.totalSpent += estimatedPrice;
        addedCount++;
      }
    }

    localStorage.setItem('liderin_budgets', JSON.stringify(budgetsArray));

    const toast = await this.toastController.create({
      message: `¡${addedCount} ingredientes de "${recipe.name}" añadidos al presupuesto!`,
      duration: 3500,
      position: 'bottom',
      color: 'success',
      buttons: [
        {
          text: 'Ver Carro',
          role: 'info',
          handler: () => {
            this.closeRecipeModal();
            this.router.navigate(['/presupuesto']);
          }
        }
      ]
    });
    await toast.present();
    this.closeRecipeModal();
  }
}