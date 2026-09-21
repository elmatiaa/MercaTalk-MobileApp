import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, listOutline, trashOutline, createOutline, addCircleOutline } from 'ionicons/icons';
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

  constructor(private router: Router) {
    addIcons({ 'arrow-back': arrowBack, 'list-outline': listOutline, 'trash-outline': trashOutline, 'create-outline': createOutline, 'add-circle-outline': addCircleOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadBudgets();
  }

  loadBudgets() {
    const data = localStorage.getItem('liderin_budgets');
    if (data) {
      this.savedBudgets = JSON.parse(data);
    } else {
      this.savedBudgets = [];
    }
  }

  editBudget(index: number) {
    this.router.navigate(['/presupuesto'], { queryParams: { index } });
  }

  deleteBudget(index: number) {
    this.savedBudgets.splice(index, 1);
    localStorage.setItem('liderin_budgets', JSON.stringify(this.savedBudgets));
  }

  createNew() {
    this.router.navigate(['/presupuesto']);
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
