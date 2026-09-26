import { Injectable } from '@angular/core';

export interface ShoppingItem {
  id?: string | number;
  barcode?: string | number;
  name?: string;
  [key: string]: any;
}

export interface ShoppingList {
  items?: ShoppingItem[];
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ListComparisonService {
  constructor() {}

  /**
   * Compara dos listas de compras y retorna un porcentaje de similitud (0-100)
   * basado en el Índice de Jaccard.
   */
    public getDetailedComparison(listA: ShoppingList, listB: ShoppingList) {
    const itemsA = listA?.items || [];
    const itemsB = listB?.items || [];

    const matchedIndicesB = new Set<number>();
    const commonItems: ShoppingItem[] = [];
    const onlyInA: ShoppingItem[] = [];
    
    for (const itemA of itemsA) {
      let matched = false;
      for (let i = 0; i < itemsB.length; i++) {
        if (matchedIndicesB.has(i)) continue;
        
        const itemB = itemsB[i];
        if (this.isMatch(itemA, itemB)) {
          commonItems.push(itemA);
          matchedIndicesB.add(i);
          matched = true;
          break;
        }
      }
      if (!matched) {
        onlyInA.push(itemA);
      }
    }

    const onlyInB: ShoppingItem[] = [];
    for (let i = 0; i < itemsB.length; i++) {
      if (!matchedIndicesB.has(i)) {
        onlyInB.push(itemsB[i]);
      }
    }

    const intersectionCount = commonItems.length;
    const unionCount = itemsA.length + itemsB.length - intersectionCount;
    const jaccardIndex = unionCount === 0 ? (itemsA.length === 0 && itemsB.length === 0 ? 1 : 0) : intersectionCount / unionCount;
    const similarity = Math.round(jaccardIndex * 100);

    return { similarity, commonItems, onlyInA, onlyInB };
  }

  public getJaccardSimilarity(listA: ShoppingList, listB: ShoppingList): number {
    const itemsA = listA?.items || [];
    const itemsB = listB?.items || [];

    if (itemsA.length === 0 && itemsB.length === 0) return 100;
    if (itemsA.length === 0 || itemsB.length === 0) return 0;

    // Para evitar emparejar un mismo item de B múltiples veces, mantenemos un track
    const matchedIndicesB = new Set<number>();
    let intersectionCount = 0;

    for (const itemA of itemsA) {
      for (let i = 0; i < itemsB.length; i++) {
        if (matchedIndicesB.has(i)) continue;
        
        const itemB = itemsB[i];
        if (this.isMatch(itemA, itemB)) {
          intersectionCount++;
          matchedIndicesB.add(i);
          break;
        }
      }
    }

    const unionCount = itemsA.length + itemsB.length - intersectionCount;
    if (unionCount === 0) return 0;

    const jaccardIndex = intersectionCount / unionCount;
    return Math.round(jaccardIndex * 100);
  }

  /**
   * Lógica de Matching en Cascada
   */
  private isMatch(itemA: ShoppingItem, itemB: ShoppingItem): boolean {
    // 1. Coincidencia exacta de barcode
    if (itemA.barcode && itemB.barcode && String(itemA.barcode) === String(itemB.barcode)) {
      return true;
    }

    // 2. Coincidencia exacta de id
    if (itemA.id && itemB.id && String(itemA.id) === String(itemB.id)) {
      return true;
    }

    const nameA = itemA.name || '';
    const nameB = itemB.name || '';

    if (!nameA && !nameB) return false;

    // 3. Coincidencia de name normalizado
    const normA = this.normalizeString(nameA);
    const normB = this.normalizeString(nameB);

    if (normA && normB && normA === normB) {
      return true;
    }

    // 4. Similitud de name por Distancia de Levenshtein (> 85%)
    if (normA && normB) {
      const distance = this.levenshteinDistance(normA, normB);
      const maxLength = Math.max(normA.length, normB.length);
      if (maxLength > 0) {
        const similarity = ((maxLength - distance) / maxLength) * 100;
        if (similarity > 85) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Helper privado para normalizar strings (minúsculas, sin tildes, sin espacios extra)
   */
  private normalizeString(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD') // Separa caracteres acentuados de su tilde
      .replace(/[\u0300-\u036f]/g, '') // Elimina los acentos
      .replace(/\s+/g, ' ') // Espacios múltiples por uno solo
      .trim();
  }

  /**
   * Helper privado para calcular distancia de Levenshtein
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}


