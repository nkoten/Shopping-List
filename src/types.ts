/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  token?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  color: string; // HEX color code
  createdAt: number;
  userId: string | null; // null for guest mode
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unitPrice: number; // in BRL (R$)
  comment?: string;
  checked: boolean;
  photo: string | null; // Base64 representation or URL
  barcode?: string;
  createdAt: number;
}

export type ThemeMode = 'light' | 'dark';

export interface AppBackup {
  version: string;
  lists: ShoppingList[];
  items: ShoppingItem[];
  timestamp: number;
}
