/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Cat,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  Check,
  Moon,
  Sun,
  Camera,
  Upload,
  Download,
  Share2,
  FilePlus,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  User,
  Database,
  LogOut,
  Info,
  Sparkles,
  ShoppingBag,
  Settings,
} from 'lucide-react';
import {
  ShoppingList,
  ShoppingItem,
  ThemeMode,
  AppBackup,
  User as UserType,
} from './types';
import BarcodeScanner from './components/BarcodeScanner';

// Default mock lists for beautiful first-load representation
const INITIAL_LISTS: ShoppingList[] = [];

const INITIAL_ITEMS: ShoppingItem[] = [];

// Hex Preset Palette for list creation
const COLOR_PRESETS = [
  '#A8DF8E', // Mint Green
  '#FFC5C5', // Soft Coral Pink
  '#C3ACD0', // Lavender
  '#B9F3FC', // Pastel Sky
  '#F3F0CA', // Soft Sunflower
  '#FFCC70', // Pastel Orange
  '#8ECA62', // Deeper Green
  '#D8A7B1', // Dusk Rose
];

export default function App() {
  // Splash Screen State (3 seconds)
  const [showSplash, setShowSplash] = useState(true);

  // App Theme State
  const [theme, setTheme] = useState<ThemeMode>('light');

  // Auth States
  const [user, setUser] = useState<UserType | null>(null);
  const [authMode, setAuthMode] = useState<
    'login' | 'register' | 'guest' | null
  >(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Main Database States
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);

  // Collapse state for list cards (listId -> boolean)
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>(
    {},
  );

  // Active Dropdowns (listId -> boolean)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modals Configuration
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [listName, setListName] = useState('');
  const [listColor, setListColor] = useState('#A8DF8E');

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [itemComment, setItemComment] = useState('');
  const [itemTargetListId, setItemTargetListId] = useState('');
  const [itemPhoto, setItemPhoto] = useState<string | null>(null);

  // Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Avatar and Settings States
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // FAB Menu States
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [fabInputValue, setFabInputValue] = useState('');
  const [fabTempChips, setFabTempChips] = useState<
    Array<{ name: string; quantity: number }>
  >([]);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Image Preview Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Splash Screen Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 2. Load initially from LocalStorage
  useEffect(() => {
    // Load theme
    const storedTheme = localStorage.getItem(
      'shopping_list_theme',
    ) as ThemeMode;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme('light');
    }

    // Load user session
    const storedUser = localStorage.getItem('shopping_list_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setAuthMode('guest'); // Bypass auth
      } catch (e) {
        setAuthMode('login');
      }
    } else {
      // Direct to login selection on startup (or Guest mode by default)
      setAuthMode('guest'); // Guest default so they can test immediately!
    }

    // Load Lists and Items
    const storedLists = localStorage.getItem('shopping_list_data_lists');
    const storedItems = localStorage.getItem('shopping_list_data_items');

    if (storedLists) {
      try {
        setLists(JSON.parse(storedLists));
      } catch (e) {
        setLists(INITIAL_LISTS);
      }
    } else {
      setLists(INITIAL_LISTS);
    }

    if (storedItems) {
      try {
        setItems(JSON.parse(storedItems));
      } catch (e) {
        setItems(INITIAL_ITEMS);
      }
    } else {
      setItems(INITIAL_ITEMS);
    }
  }, []);

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem('shopping_list_data_lists', JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem('shopping_list_data_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('shopping_list_theme', theme);
    // Set HTML theme attribute
    const rootEl = document.documentElement;
    if (theme === 'dark') {
      rootEl.classList.add('dark');
    } else {
      rootEl.classList.remove('dark');
    }
  }, [theme]);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper: Parse item name and quantity automatically
  const parseQuantityAndName = (
    text: string,
  ): { name: string; quantity: number } => {
    const trimmed = text.trim();
    // Match starting number (e.g., "3 bananas" or "3x bananas")
    const startNumMatch = trimmed.match(/^(\d+)(x|X)?\s+(.+)$/);
    if (startNumMatch) {
      return {
        quantity: parseInt(startNumMatch[1], 10),
        name: startNumMatch[3].trim(),
      };
    }
    // Match ending number (e.g., "bananas 3" or "bananas 3x")
    const endNumMatch = trimmed.match(/^(.+)\s+(\d+)(x|X)?$/);
    if (endNumMatch) {
      return {
        quantity: parseInt(endNumMatch[2], 10),
        name: endNumMatch[1].trim(),
      };
    }
    return {
      quantity: 1,
      name: trimmed,
    };
  };

  // FAB Input KeyPress / Change Handler
  const handleFabInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Check if ends with a comma
    if (val.endsWith(',')) {
      const cleanVal = val.slice(0, -1).trim();
      if (cleanVal) {
        const parsed = parseQuantityAndName(cleanVal);
        setFabTempChips([...fabTempChips, parsed]);
      }
      setFabInputValue('');
    } else {
      setFabInputValue(val);
    }
  };

  const handleFabInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleanVal = fabInputValue.trim();
      if (cleanVal) {
        const parsed = parseQuantityAndName(cleanVal);
        setFabTempChips([...fabTempChips, parsed]);
        setFabInputValue('');
      }
    }
  };

  // Add all temp chips from FAB to a selected list
  const handleAddChipsToList = (listId: string) => {
    let finalItemsToAdd: Array<{ name: string; quantity: number }> = [
      ...fabTempChips,
    ];

    // Also parse whatever is currently in the input field
    const remainingText = fabInputValue.trim();
    if (remainingText) {
      finalItemsToAdd.push(parseQuantityAndName(remainingText));
    }

    if (finalItemsToAdd.length === 0) {
      showToast('Por favor, digite um item antes!');
      return;
    }

    const newItems: ShoppingItem[] = finalItemsToAdd.map((chip, index) => ({
      id: `item-${Date.now()}-${index}`,
      listId,
      name: chip.name,
      quantity: chip.quantity,
      unitPrice: 0, // start with 0, can be edited later
      checked: false,
      photo: null,
      createdAt: Date.now() + index,
    }));

    setItems([...items, ...newItems]);
    setFabTempChips([]);
    setFabInputValue('');
    setIsFabMenuOpen(false);

    // Automatically expand the list we just added items to
    setExpandedLists((prev) => ({ ...prev, [listId]: true }));
    showToast(`${newItems.length} item(s) adicionado(s) com sucesso!`);
  };

  // JWT Authenticate Simulation
  const handleAuthSubmit = (mode: 'login' | 'register') => {
    setAuthError('');
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setAuthError('Preencha todos os campos!');
      return;
    }

    if (mode === 'register') {
      // Save credentials locally for simulation
      const usersRaw = localStorage.getItem('simulated_users') || '[]';
      const usersList = JSON.parse(usersRaw);

      if (usersList.some((u: any) => u.username === usernameInput)) {
        setAuthError('Nome de usuário já existe!');
        return;
      }

      const newUserObj = {
        id: `user-${Date.now()}`,
        username: usernameInput,
        password: passwordInput, // simulated hash
      };
      usersList.push(newUserObj);
      localStorage.setItem('simulated_users', JSON.stringify(usersList));

      // Simulate JWT creation
      const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ id: newUserObj.id, username: newUserObj.username }))}.simulated-sig`;
      const sessionUser: UserType = {
        id: newUserObj.id,
        username: newUserObj.username,
        token: fakeToken,
      };

      localStorage.setItem('shopping_list_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      showToast('Registro realizado com sucesso!');
    } else {
      // Login mode
      const usersRaw = localStorage.getItem('simulated_users') || '[]';
      const usersList = JSON.parse(usersRaw);
      const matched = usersList.find(
        (u: any) =>
          u.username === usernameInput && u.password === passwordInput,
      );

      if (matched) {
        const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ id: matched.id, username: matched.username }))}.simulated-sig`;
        const sessionUser: UserType = {
          id: matched.id,
          username: matched.username,
          token: fakeToken,
        };

        localStorage.setItem('shopping_list_user', JSON.stringify(sessionUser));
        setUser(sessionUser);
        showToast('Login realizado com sucesso!');
      } else {
        setAuthError('Usuário ou senha inválidos!');
        return;
      }
    }

    // Reset fields
    setUsernameInput('');
    passwordInput;
    setPasswordInput('');
  };

  const handleLogout = () => {
    localStorage.removeItem('shopping_list_user');
    setUser(null);
    showToast('Sessão encerrada.');
  };

  // List actions
  const handleOpenCreateList = () => {
    setEditingList(null);
    setListName(`Lista ${lists.length + 1}`);
    setListColor(
      COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
    );
    setIsListModalOpen(true);
  };

  const handleOpenEditList = (list: ShoppingList) => {
    setEditingList(list);
    setListName(list.name);
    setListColor(list.color);
    setIsListModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveList = () => {
    if (!listName.trim()) {
      showToast('Nome da lista é obrigatório!');
      return;
    }

    if (editingList) {
      // Update existing list
      setLists(
        lists.map((l) =>
          l.id === editingList.id
            ? { ...l, name: listName, color: listColor }
            : l,
        ),
      );
      showToast('Lista atualizada!');
    } else {
      // Create new
      const newList: ShoppingList = {
        id: `list-${Date.now()}`,
        name: listName,
        color: listColor,
        createdAt: Date.now(),
        userId: user ? user.id : null,
      };
      setLists([...lists, newList]);
      showToast('Nova lista criada!');
    }
    setIsListModalOpen(false);
  };

  const handleDeleteList = (listId: string) => {
    if (confirm('Deseja realmente excluir esta lista e todos os seus itens?')) {
      setLists(lists.filter((l) => l.id !== listId));
      setItems(items.filter((item) => item.listId !== listId));
      showToast('Lista excluída com sucesso.');
      setActiveMenuId(null);
    }
  };

  // Reset list items (turn all checked into unchecked, or keep them)
  const handleResetList = (listId: string) => {
    if (confirm('Deseja desmarcar todos os itens desta lista?')) {
      setItems(
        items.map((item) =>
          item.listId === listId ? { ...item, checked: false } : item,
        ),
      );
      showToast('Lista reiniciada!');
      setActiveMenuId(null);
    }
  };

  // Excluir todos os itens da lista
  const handleClearListItems = (listId: string) => {
    if (confirm('Deseja deletar permanentemente todos os itens desta lista?')) {
      setItems(items.filter((item) => item.listId !== listId));
      showToast('Todos os itens foram removidos da lista.');
      setActiveMenuId(null);
    }
  };

  // Item Toggle Check
  const handleToggleItemCheck = (itemId: string) => {
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  // Item edit actions
  const handleOpenEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemQuantity(item.quantity);
    setItemUnitPrice(item.unitPrice);
    setItemComment(item.comment || '');
    setItemTargetListId(item.listId);
    setItemPhoto(item.photo);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!itemName.trim()) {
      showToast('Nome do item é obrigatório!');
      return;
    }

    if (editingItem) {
      setItems(
        items.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                name: itemName,
                quantity: itemQuantity,
                unitPrice: itemUnitPrice,
                comment: itemComment,
                listId: itemTargetListId,
                photo: itemPhoto,
              }
            : i,
        ),
      );
      showToast('Item atualizado com sucesso!');
      setIsItemModalOpen(false);
    } else {
      // Add new directly
      const newItem: ShoppingItem = {
        id: `item-${Date.now()}`,
        listId: itemTargetListId,
        name: itemName,
        quantity: itemQuantity,
        unitPrice: itemUnitPrice,
        comment: itemComment,
        checked: false,
        photo: itemPhoto,
        createdAt: Date.now(),
      };
      setItems([...items, newItem]);
      showToast('Item adicionado!');
      setIsItemModalOpen(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Deseja realmente remover este item?')) {
      setItems(items.filter((i) => i.id !== itemId));
      showToast('Item removido.');
      if (isItemModalOpen) {
        setIsItemModalOpen(false);
      }
    }
  };

  // Backup Import & Export
  const handleExportBackup = () => {
    const backup: AppBackup = {
      version: '1.0',
      lists,
      items,
      timestamp: Date.now(),
    };

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `lista-de-compras-backup-${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup JSON exportado com sucesso!');
  };

  const handleImportBackupClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.lists && parsed.items) {
          // Verify and merge
          if (
            confirm(
              'Isto irá sobrescrever as listas e itens atuais com o conteúdo do backup. Continuar?',
            )
          ) {
            setLists(parsed.lists);
            setItems(parsed.items);
            showToast('Backup JSON importado com sucesso!');
          }
        } else {
          showToast('Formato de backup inválido.');
        }
      } catch (err) {
        showToast('Erro ao processar arquivo de backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  // Export specific list as Backup
  const handleExportListBackup = (list: ShoppingList) => {
    const listItems = items.filter((i) => i.listId === list.id);
    const backup = {
      version: '1.0',
      list,
      items: listItems,
      timestamp: Date.now(),
    };

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `backup-lista-${list.name.replace(/\s+/g, '-').toLowerCase()}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Backup da lista "${list.name}" exportado!`);
    setActiveMenuId(null);
  };

  // WhatsApp formatted share
  const handleShareToWhatsApp = (list: ShoppingList) => {
    const listItems = items.filter((i) => i.listId === list.id);
    if (listItems.length === 0) {
      showToast('Não há itens nesta lista para enviar!');
      return;
    }

    let text = `*🛍️ LISTA DE COMPRAS: ${list.name.toUpperCase()}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const unchecked = listItems.filter((i) => !i.checked);
    const checked = listItems.filter((i) => i.checked);

    if (unchecked.length > 0) {
      text += `*📌 Ítens para comprar:*\n`;
      unchecked.forEach((i) => {
        const priceStr =
          i.unitPrice > 0
            ? ` (R$ ${(i.unitPrice * i.quantity).toFixed(2)})`
            : '';
        text += `◽ _${i.quantity}x_  *${i.name}*${priceStr}${i.comment ? ` [Obs: ${i.comment}]` : ''}\n`;
      });
      text += `\n`;
    }

    if (checked.length > 0) {
      text += `*✅ Já comprados:*\n`;
      checked.forEach((i) => {
        text += `~_${i.quantity}x_  ${i.name}~\n`;
      });
      text += `\n`;
    }

    // Calculate totals
    const totalCost = listItems.reduce(
      (acc, i) => acc + i.unitPrice * i.quantity,
      0,
    );
    if (totalCost > 0) {
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `*💰 Valor Total Estimado:* R$ ${totalCost.toFixed(2)}\n`;
    }
    text += `\n_Gerado por Shopping List - Meow Style_ 🐾`;

    const encodedText = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank');
    setActiveMenuId(null);
    showToast('Lista formatada enviada para o WhatsApp!');
  };

  // File Upload Helper to Base64 (for item product photos)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Imagem muito grande! O limite de tamanho é 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setItemPhoto(reader.result as string);
      showToast('Foto anexada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  // Open Food Facts Scan Success Callback
  const handleBarcodeScanSuccess = (productName: string, details?: string) => {
    setItemName(productName);
    if (details) {
      setItemComment(details);
    }
    setIsScannerOpen(false);
    showToast(`Produto carregado da Open Food Facts!`);
  };

  return (
    <div
      id="app-root"
      class="min-h-screen font-sans bg-[#FAF8F5] dark:bg-[#22272a] text-gray-800 dark:text-gray-100 transition-colors duration-300 pb-24 relative select-none"
    >
      {/* 1. SPLASH SCREEN (3 SECONDS) */}
      {showSplash && (
        <div
          id="splash-screen"
          class="fixed inset-0 bg-[#FAF8F5] dark:bg-[#22272a] z-50 flex flex-col items-center justify-center p-6 text-center transition-all duration-500"
        >
          <div class="relative w-48 h-48 mb-6 flex items-center justify-center">
            {/* Glowing circle back */}
            <div class="absolute inset-0 bg-[#A8DF8E]/30 dark:bg-[#8ECA62]/20 rounded-full animate-ping opacity-60"></div>

            {/* Cute Cat SVG Logo */}
            <div class="relative z-10 w-40 h-40 bg-white dark:bg-[#2c3439] p-4 rounded-full border-4 border-[#A8DF8E] dark:border-[#433D50] shadow-xl flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                class="w-28 h-28"
              >
                {/* Ears */}
                <path
                  d="M160,180 L130,90 L210,140 Z"
                  fill="#E8D8C8"
                  stroke="#4F6F52"
                  stroke-width="14"
                />
                <path
                  d="M352,180 L382,90 L302,140 Z"
                  fill="#E8D8C8"
                  stroke="#4F6F52"
                  stroke-width="14"
                />
                {/* Head */}
                <ellipse
                  cx="256"
                  cy="190"
                  rx="110"
                  ry="85"
                  fill="#FAF8F5"
                  stroke="#4F6F52"
                  stroke-width="16"
                />
                {/* Eyes */}
                <ellipse cx="210" cy="185" rx="10" ry="14" fill="#3A4D39" />
                <ellipse cx="302" cy="185" rx="10" ry="14" fill="#3A4D39" />
                {/* Nose */}
                <path
                  d="M256,198 C250,198 244,202 244,208 C244,214 251,216 256,211 Z"
                  fill="#FF8A8A"
                  stroke="#4F6F52"
                  stroke-width="4"
                />
                {/* Basket bottom */}
                <path
                  d="M140,280 L372,280 L340,400 L172,400 Z"
                  fill="#F4F2DE"
                  stroke="#4F6F52"
                  stroke-width="12"
                />
              </svg>
            </div>
          </div>

          <h1 class="text-3xl font-display font-bold text-[#3A4D39] dark:text-[#A8DF8E] tracking-tight">
            Shopping List
          </h1>
          <p class="text-xs font-mono text-gray-400 dark:text-gray-500 tracking-widest mt-1">
            MEOW STYLE • PWA READY
          </p>

          {/* Progress bar */}
          <div class="w-48 h-2 bg-gray-200 dark:bg-[#232a2d] rounded-full mt-8 overflow-hidden">
            <div
              class="h-full bg-[#A8DF8E] dark:bg-emerald-500 rounded-full animate-pulse-slow"
              style={{ width: '85%' }}
            ></div>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400 mt-4 animate-pulse">
            Preparando suas listas de compras... 🐾
          </p>
        </div>
      )}

      {/* 2. AUTH / USER SIGN IN SCREEN IF NEEDED */}
      {authMode && authMode !== 'guest' && !user && (
        <div
          id="auth-screen"
          class="fixed inset-0 bg-[#FAF8F5] dark:bg-[#22272a] z-40 flex items-center justify-center p-4"
        >
          <div class="bg-white dark:bg-[#2c3439] w-full max-w-md rounded-3xl p-8 meow-shadow-lg border-2 border-gray-100 dark:border-[#1b1f22]">
            <div class="text-center mb-8">
              <div class="w-16 h-16 bg-[#A8DF8E]/10 dark:bg-emerald-800/10 text-[#3A4D39] dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Cat class="w-8 h-8" />
              </div>
              <h2 class="text-2xl font-display font-bold text-gray-800 dark:text-gray-100">
                {authMode === 'login' ? 'Conectar Conta' : 'Criar Nova Conta'}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Acesse suas listas com segurança de qualquer dispositivo
              </p>
            </div>

            {authError && (
              <div class="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-300 p-3 rounded-xl text-xs flex gap-2 mb-4 border border-red-200 dark:border-red-900/40">
                <AlertCircle class="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Nome de Usuário
                </label>
                <input
                  id="auth-username"
                  type="text"
                  placeholder="Ex: noah.kd"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  class="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#232a2d] border border-transparent focus:border-[#A8DF8E] text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Senha
                </label>
                <input
                  id="auth-password"
                  type="password"
                  placeholder="Sua senha secreta"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  class="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#232a2d] border border-transparent focus:border-[#A8DF8E] text-sm"
                />
              </div>

              {authMode === 'login' ? (
                <button
                  id="auth-login-submit"
                  onClick={() => handleAuthSubmit('login')}
                  class="w-full py-3 bg-[#A8DF8E] hover:bg-[#96ce7c] text-gray-800 font-semibold rounded-2xl transition-all shadow-md mt-2"
                >
                  Entrar
                </button>
              ) : (
                <button
                  id="auth-register-submit"
                  onClick={() => handleAuthSubmit('register')}
                  class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-all shadow-md mt-2"
                >
                  Criar Conta
                </button>
              )}

              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2">
                {authMode === 'login' ? (
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError('');
                    }}
                    class="hover:underline"
                  >
                    Não tem conta? Cadastre-se
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    class="hover:underline"
                  >
                    Já tem conta? Faça Login
                  </button>
                )}

                <button
                  onClick={() => setAuthMode('guest')}
                  class="text-[#3A4D39] dark:text-[#A8DF8E] font-bold hover:underline"
                >
                  Continuar como Visitante 🐾
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. APP MAIN INTERFACE */}
      {/* HEADER SECTION */}
      <header class="sticky top-0 bg-[#FAF8F5]/80 dark:bg-[#22272a]/80 backdrop-blur-md z-30 px-6 py-4 border-b border-gray-100 dark:border-[#232a2d]/30 flex justify-between items-center max-w-7xl mx-auto">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 bg-[#A8DF8E]/20 text-[#3A4D39] dark:text-[#A8DF8E] rounded-full flex items-center justify-center font-bold">
            <Cat class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-xl font-display font-bold tracking-tight text-gray-800 dark:text-gray-100 flex items-center gap-1">
              Lista de Compras
            </h1>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
              {user ? `CONECTADO: @${user.username}` : 'SESSÃO LOCAL 🐾'}
            </p>
          </div>
        </div>

        {/* Global Controls - Avatar Button */}
        <div class="flex items-center gap-2">
          <div class="relative">
            <button
              id="avatar-menu-trigger"
              onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
              class="w-10 h-10 rounded-full bg-white dark:bg-[#2c3439] border-2 border-[#A8DF8E] dark:border-[#8ECA62]/60 hover:scale-105 transition-all duration-200 flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-md cursor-pointer"
            >
              {user ? (
                <span class="text-xs font-bold font-display uppercase text-[#3A4D39] dark:text-[#A8DF8E]">
                  {user.username.substring(0, 2)}
                </span>
              ) : (
                <User class="w-4 h-4 text-[#3A4D39] dark:text-[#A8DF8E]" />
              )}
            </button>

            {/* Floating Avatar Menu */}
            {isAvatarMenuOpen && (
              <>
                {/* Invisible backdrop to close the menu */}
                <div
                  class="fixed inset-0 z-30"
                  onClick={() => setIsAvatarMenuOpen(false)}
                ></div>
                <div class="absolute right-0 mt-2 w-56 bg-white dark:bg-[#2c3439] rounded-2xl shadow-xl border border-gray-100 dark:border-[#FAF8F5]/10 py-2.5 z-40 text-sm animate-fade-in text-gray-800 dark:text-gray-100 meow-shadow-lg">
                  {user ? (
                    <div class="px-4 py-2 border-b border-gray-50 dark:border-[#232a2d]/30 mb-1.5">
                      <p class="text-xs font-semibold text-gray-400 uppercase">
                        Sessão Ativa
                      </p>
                      <p class="font-bold text-gray-800 dark:text-gray-100 truncate">
                        @{user.username}
                      </p>
                    </div>
                  ) : (
                    <div class="px-4 py-2 border-b border-gray-50 dark:border-[#232a2d]/30 mb-1.5">
                      <p class="text-xs font-semibold text-gray-400 uppercase">
                        Sessão Local
                      </p>
                      <p class="font-bold text-gray-500 dark:text-gray-400">
                        Modo Visitante 🐾
                      </p>
                    </div>
                  )}

                  {/* Option: Login/Register (if guest) */}
                  {!user ? (
                    <button
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        setAuthMode('login');
                        setAuthError('');
                      }}
                      class="w-full text-left px-4 py-2 hover:bg-[#A8DF8E]/15 dark:hover:bg-[#A8DF8E]/10 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                    >
                      <User class="w-4 h-4 text-emerald-500" />
                      <span>Entrar / Criar Conta</span>
                    </button>
                  ) : null}

                  {/* Option: Settings */}
                  <button
                    onClick={() => {
                      setIsAvatarMenuOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                    class="w-full text-left px-4 py-2 hover:bg-[#A8DF8E]/15 dark:hover:bg-[#A8DF8E]/10 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                  >
                    <Settings class="w-4 h-4 text-amber-500" />
                    <span>Configurações</span>
                  </button>

                  {user ? (
                    <>
                      <div class="border-t border-gray-50 dark:border-[#232a2d]/30 my-1.5"></div>
                      <button
                        onClick={() => {
                          setIsAvatarMenuOpen(false);
                          handleLogout();
                        }}
                        class="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2.5 font-medium text-red-500 transition-colors cursor-pointer"
                      >
                        <LogOut class="w-4 h-4" />
                        <span>Sair da Conta</span>
                      </button>
                    </>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main class="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* LIST BUILDER ACTIONS */}
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-display font-bold text-gray-700 dark:text-gray-300">
            Suas Listas
          </h2>
          <button
            id="create-list-btn"
            onClick={handleOpenCreateList}
            class="inline-flex items-center gap-1 px-3.5 py-2 bg-[#A8DF8E] dark:bg-emerald-800/30 text-[#3A4D39] dark:text-[#8ECA62] rounded-2xl text-xs font-bold hover:opacity-90 transition-all shadow-sm cursor-pointer"
          >
            <FilePlus class="w-3.5 h-3.5" /> Nova Lista
          </button>
        </div>

        {/* RENDER LIST OF SHOPPING LISTS */}
        {lists.length === 0 ? (
          <div class="text-center py-12 px-6 bg-white dark:bg-[#2c3439] rounded-3xl meow-shadow border border-dashed border-gray-200 dark:border-[#1b1f22]">
            <Cat class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 animate-bounce-slow" />
            <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Nenhuma lista criada ainda!
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Clique em "Nova Lista" acima ou use o FAB no canto inferior para
              começar.
            </p>
          </div>
        ) : (
          <div id="lists-accordion-container" class="space-y-4">
            {lists.map((list) => {
              const listItems = items.filter((item) => item.listId === list.id);
              const checkedItems = listItems.filter((item) => item.checked);
              const isExpanded = expandedLists[list.id] !== false; // expanded by default
              const isMenuOpen = activeMenuId === list.id;

              // Calculate total list price
              const totalCost = listItems.reduce(
                (acc, i) => acc + i.unitPrice * i.quantity,
                0,
              );

              return (
                <div
                  key={list.id}
                  id={`list-card-${list.id}`}
                  class="bg-white dark:bg-[#2c3439] rounded-3xl overflow-visible meow-shadow border border-gray-100 dark:border-[#FAF8F5]/5 flex flex-col"
                >
                  {/* TITLE BAR (custom color) */}
                  <div
                    id={`list-card-header-${list.id}`}
                    class="list-card-header px-5 py-4 flex items-center justify-between text-slate-800 font-semibold relative select-none rounded-t-3xl transition-colors"
                    style={{ backgroundColor: list.color }}
                  >
                    {/* Toggle expand by clicking the header info area */}
                    <div
                      onClick={() =>
                        setExpandedLists({
                          ...expandedLists,
                          [list.id]: !isExpanded,
                        })
                      }
                      class="flex-1 cursor-pointer flex flex-col"
                    >
                      <span class="font-display font-bold text-base text-slate-900 flex items-center gap-1.5">
                        {list.name}
                      </span>
                      <span class="text-[10px] text-slate-700 font-mono mt-0.5">
                        {listItems.length}{' '}
                        {listItems.length === 1 ? 'item' : 'itens'} no total
                      </span>
                    </div>

                    {/* Actions Menu Trigger & Expand Arrow */}
                    <div class="flex items-center gap-1">
                      {/* Cost indicator */}
                      {totalCost > 0 && (
                        <span class="text-xs font-mono font-bold bg-white/80 text-emerald-800 px-2 py-1 rounded-full shadow-sm mr-1">
                          R$ {totalCost.toFixed(2)}
                        </span>
                      )}

                      {/* 3-dot dropdown menu trigger */}
                      <div class="relative">
                        <button
                          id={`list-menu-trigger-${list.id}`}
                          onClick={() =>
                            setActiveMenuId(isMenuOpen ? null : list.id)
                          }
                          class="p-1.5 rounded-full hover:bg-black/5 text-slate-700 hover:text-slate-900 transition-colors"
                        >
                          <MoreVertical class="w-4 h-4" />
                        </button>

                        {/* DROPDOWN CONTAINER */}
                        {isMenuOpen && (
                          <div
                            id={`list-dropdown-${list.id}`}
                            class="absolute right-0 mt-2 w-52 bg-white dark:bg-[#232a2d] rounded-2xl shadow-xl border border-gray-100 dark:border-[#FAF8F5]/10 py-2 z-20 text-xs"
                          >
                            <button
                              onClick={() => {
                                // Simulate adding direct item
                                setEditingItem(null);
                                setItemName('');
                                setItemQuantity(1);
                                setItemUnitPrice(0);
                                setItemComment('');
                                setItemTargetListId(list.id);
                                setItemPhoto(null);
                                setIsItemModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              class="w-full text-left px-4 py-2.5 hover:bg-[#A8DF8E]/20 dark:hover:bg-[#A8DF8E]/10 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                            >
                              <Plus class="w-3.5 h-3.5" /> Adicionar Novo Item
                            </button>
                            <button
                              onClick={() => handleResetList(list.id)}
                              class="w-full text-left px-4 py-2.5 hover:bg-[#A8DF8E]/20 dark:hover:bg-[#A8DF8E]/10 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                            >
                              <Check class="w-3.5 h-3.5 text-gray-400" />{' '}
                              Desmarcar Todos
                            </button>
                            <button
                              onClick={() => handleClearListItems(list.id)}
                              class="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 text-red-500"
                            >
                              <Trash2 class="w-3.5 h-3.5" /> Limpar Lista
                              (Zerar)
                            </button>
                            <button
                              onClick={() => handleExportListBackup(list)}
                              class="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                            >
                              <Download class="w-3.5 h-3.5" /> Exportar Backup
                              Lista
                            </button>
                            <button
                              onClick={() => handleShareToWhatsApp(list)}
                              class="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"
                            >
                              <MessageCircle class="w-3.5 h-3.5" /> Enviar p/
                              WhatsApp
                            </button>
                            <div class="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                            <button
                              onClick={() => handleOpenEditList(list)}
                              class="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                            >
                              <Pencil class="w-3.5 h-3.5" /> Editar Lista
                              (Nome/Cor)
                            </button>
                            <button
                              onClick={() => handleDeleteList(list.id)}
                              class="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 class="w-3.5 h-3.5" /> Excluir Lista
                              Inteira
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expand / Collapse trigger */}
                      <button
                        onClick={() =>
                          setExpandedLists({
                            ...expandedLists,
                            [list.id]: !isExpanded,
                          })
                        }
                        class="p-1.5 rounded-full hover:bg-black/5 text-slate-700 hover:text-slate-900 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp class="w-4 h-4" />
                        ) : (
                          <ChevronDown class="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* SECONDARY BAR (x/y item check count) */}
                  <div
                    class={`bg-gray-50 dark:bg-[#232a2d]/40 px-5 py-2 flex justify-between items-center border-t border-gray-100 dark:border-[#FAF8F5]/5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 font-mono select-none ${!isExpanded ? 'rounded-b-3xl' : ''}`}
                  >
                    <span>PROGRESSO</span>
                    <span class="bg-[#A8DF8E]/20 text-[#3A4D39] dark:text-[#A8DF8E] px-2 py-0.5 rounded-full">
                      {checkedItems.length}/{listItems.length} Comprados
                    </span>
                  </div>

                  {/* ITEM LAYOUT BODY */}
                  {isExpanded && (
                    <div class="p-3 bg-white dark:bg-[#2c3439] border-t border-gray-100 dark:border-[#FAF8F5]/5 space-y-1 rounded-b-3xl">
                      {listItems.length === 0 ? (
                        <div class="text-center py-6 text-gray-400 text-xs">
                          Nenhum item nesta lista. Use o botão + para adicionar!
                        </div>
                      ) : (
                        listItems.map((item) => (
                          <div
                            key={item.id}
                            id={`item-row-${item.id}`}
                            class={`flex items-center justify-between p-2.5 rounded-xl transition-all select-none border border-transparent ${
                              item.checked
                                ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/20 opacity-85 text-gray-500 dark:text-gray-400'
                                : 'bg-gray-50 dark:bg-[#232a2d]/30 hover:bg-gray-100/70 dark:hover:bg-[#232a2d]/50'
                            }`}
                          >
                            {/* Toggle checkbox & name */}
                            <div
                              onClick={() => handleToggleItemCheck(item.id)}
                              class="flex-1 flex items-center gap-3 cursor-pointer overflow-hidden"
                            >
                              {/* Circle Checkbox */}
                              <div
                                class={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                  item.checked
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#22272a]'
                                }`}
                              >
                                {item.checked && (
                                  <Check class="w-3.5 h-3.5 stroke-[3px]" />
                                )}
                              </div>

                              <div class="flex flex-col min-w-0">
                                <span
                                  class={`text-sm font-semibold truncate ${item.checked ? 'line-through text-gray-400' : ''}`}
                                >
                                  {item.name}
                                </span>
                                {item.comment && (
                                  <span class="text-[10px] text-gray-400 truncate max-w-xs italic">
                                    {item.comment}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity and Price Details */}
                            <div class="flex items-center gap-2.5 shrink-0">
                              <div class="text-right flex flex-col font-mono text-[11px] leading-tight text-gray-500 dark:text-gray-400 mr-1.5">
                                <span class="font-bold text-gray-800 dark:text-gray-200">
                                  {item.quantity}x
                                </span>
                                {item.unitPrice > 0 && (
                                  <span>
                                    R${' '}
                                    {(item.unitPrice * item.quantity).toFixed(
                                      2,
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Photo Attachment Preview Thumb */}
                              {item.photo && (
                                <button
                                  onClick={() => setLightboxImage(item.photo)}
                                  class="w-7 h-7 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer shrink-0"
                                >
                                  <img
                                    src={item.photo}
                                    alt="Produto"
                                    class="w-full h-full object-cover"
                                  />
                                </button>
                              )}

                              {/* Pencil Edit and Trash Delete Buttons */}
                              <div class="flex gap-0.5 border-l border-gray-200 dark:border-gray-700/50 pl-1.5">
                                <button
                                  id={`edit-item-btn-${item.id}`}
                                  onClick={() => handleOpenEditItem(item)}
                                  class="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-[#433D50] text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                >
                                  <Pencil class="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`delete-item-btn-${item.id}`}
                                  onClick={() => handleDeleteItem(item.id)}
                                  class="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 class="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. FAB (FLOATING ACTION BUTTON) & QUICK WORKFLOW DRAWER */}
      <div
        id="fab-container"
        class="fixed bottom-6 right-6 z-30 flex flex-col items-end"
      >
        {isFabMenuOpen && (
          <div
            id="fab-quick-menu"
            class="bg-white dark:bg-[#2c3439] p-5 rounded-3xl meow-shadow-lg border-2 border-gray-100 dark:border-[#1b1f22] w-[calc(100vw-2rem)] max-w-sm mb-4 flex flex-col space-y-4"
          >
            <div class="flex justify-between items-center">
              <span class="font-display font-bold text-sm text-[#3A4D39] dark:text-emerald-400 flex items-center gap-1.5">
                <ShoppingBag class="w-4 h-4 text-emerald-500" /> Adicionar
                Rápido de Itens
              </span>
              <button
                id="close-fab-menu-btn"
                onClick={() => setIsFabMenuOpen(false)}
                class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X class="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Smart comma/enter item input */}
            <div class="space-y-1">
              <div class="relative">
                <input
                  id="fab-smart-input"
                  type="text"
                  placeholder="Ex: 3 bananas, maçãs, sabão 2"
                  value={fabInputValue}
                  onChange={handleFabInputChange}
                  onKeyDown={handleFabInputKeyDown}
                  class="w-full pr-10 pl-4 py-3 bg-gray-50 dark:bg-[#232a2d] text-gray-800 dark:text-gray-100 rounded-2xl text-sm border border-transparent focus:border-[#A8DF8E]"
                  autoFocus
                />

                {/* Barcode scan camera option trigger */}
                <button
                  id="scan-from-fab-btn"
                  onClick={() => setIsScannerOpen(true)}
                  title="Escanear Código de Barras"
                  class="absolute right-3 top-3 p-1 rounded-lg bg-[#A8DF8E] dark:bg-emerald-800/30 text-[#3A4D39] dark:text-[#8ECA62] hover:opacity-90 transition-opacity"
                >
                  <Camera class="w-4 h-4" />
                </button>
              </div>
              <p class="text-[10px] text-gray-400 dark:text-gray-500">
                Pressione <span class="font-semibold text-gray-500">Enter</span>{' '}
                ou <span class="font-semibold text-gray-500">Vírgula</span> para
                transformar em chip. Suporta quantidade no início ou fim!
              </p>
            </div>

            {/* Render confirmed chips */}
            {fabTempChips.length > 0 && (
              <div
                id="fab-chips-container"
                class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-gray-50 dark:bg-[#232a2d]/30 rounded-xl"
              >
                {fabTempChips.map((chip, idx) => (
                  <span
                    key={idx}
                    class="inline-flex items-center gap-1 bg-[#A8DF8E]/30 dark:bg-emerald-800/20 text-[#3A4D39] dark:text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full"
                  >
                    <span>
                      {chip.quantity}x {chip.name}
                    </span>
                    <button
                      onClick={() =>
                        setFabTempChips(
                          fabTempChips.filter((_, i) => i !== idx),
                        )
                      }
                      class="hover:text-red-500 cursor-pointer"
                    >
                      <X class="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Select Target List color-chips */}
            <div class="space-y-2">
              <span class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Vincular &amp; Salvar Na Lista:
              </span>

              {lists.length === 0 ? (
                <div class="text-xs text-amber-500">
                  Crie uma lista primeiro para salvar os itens!
                </div>
              ) : (
                <div id="fab-target-lists-chips" class="grid grid-cols-2 gap-2">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => handleAddChipsToList(list.id)}
                      class="flex items-center gap-1.5 p-2 rounded-xl text-left text-xs font-bold border hover:opacity-90 transition-opacity"
                      style={{
                        backgroundColor: `${list.color}15`,
                        borderColor: list.color,
                        color: theme === 'dark' ? '#FAF8F5' : '#3A4D39',
                      }}
                    >
                      <span
                        class="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: list.color }}
                      ></span>
                      <span class="truncate">{list.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary FAB Circle Trigger */}
        <button
          id="main-fab-btn"
          onClick={() => {
            setIsFabMenuOpen(!isFabMenuOpen);
            // reset fields
            setFabInputValue('');
          }}
          class="w-[68px] h-[68px] bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
        >
          {isFabMenuOpen ? <X class="w-6 h-6" /> : <Plus class="w-6 h-6" />}

          {/* Notification badge if temp items are pending */}
          {fabTempChips.length > 0 && !isFabMenuOpen && (
            <span class="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
              {fabTempChips.length}
            </span>
          )}
        </button>
      </div>

      {/* 5. CREATE / EDIT LIST MODAL */}
      {isListModalOpen && (
        <div
          id="list-editor-modal"
          class="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div class="bg-white dark:bg-[#2c3439] w-full max-w-sm rounded-3xl p-6 meow-shadow-lg border-2 border-gray-100 dark:border-[#1b1f22]">
            <h3 class="font-display font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">
              {editingList ? 'Editar Lista' : 'Nova Lista'}
            </h3>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Nome da Lista
                </label>
                <input
                  id="list-name-input"
                  type="text"
                  placeholder="Ex: Frutas, Supermercado..."
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  class="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#232a2d] border border-transparent focus:border-[#A8DF8E]"
                />
              </div>

              {/* HEX Color selector & Input */}
              <div class="space-y-2">
                <label class="block text-xs font-semibold text-gray-400 uppercase">
                  Cor de Identificação
                </label>

                {/* Preconfigured color circles */}
                <div class="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setListColor(color)}
                      class={`w-8 h-8 rounded-full transition-transform ${
                        listColor.toLowerCase() === color.toLowerCase()
                          ? 'scale-110 ring-4 ring-[#A8DF8E]/55'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Manual Hex code Input with Color preview */}
                <div class="flex items-center gap-3 pt-1">
                  <div class="relative flex-1">
                    <span class="absolute left-3 top-2.5 text-gray-400 text-sm font-semibold">
                      #
                    </span>
                    <input
                      id="list-color-hex"
                      type="text"
                      placeholder="HEX (Ex: A8DF8E)"
                      value={listColor.replace('#', '')}
                      onChange={(e) => {
                        const raw = e.target.value.slice(0, 6);
                        setListColor(`#${raw}`);
                      }}
                      class="w-full pl-7 pr-4 py-2 bg-gray-50 dark:bg-[#232a2d] rounded-xl text-xs font-mono"
                    />
                  </div>
                  {/* Dynamic circle preview */}
                  <div
                    class="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0"
                    style={{ backgroundColor: listColor }}
                  />
                </div>
              </div>

              {/* Dialog buttons */}
              <div class="flex items-center justify-end gap-2 pt-4">
                <button
                  id="cancel-list-save"
                  onClick={() => setIsListModalOpen(false)}
                  class="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="save-list-btn"
                  onClick={handleSaveList}
                  class="px-5 py-2.5 bg-[#A8DF8E] hover:bg-[#99d17f] text-gray-800 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Salvar Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. EDIT ITEM DETAIL MODAL */}
      {isItemModalOpen && (
        <div
          id="item-editor-modal"
          class="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div class="bg-white dark:bg-[#2c3439] w-full max-w-md rounded-3xl p-6 meow-shadow-lg border-2 border-gray-100 dark:border-[#1b1f22] my-8">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-display font-bold text-lg text-gray-800 dark:text-gray-100">
                {editingItem ? 'Editar Item da Lista' : 'Adicionar Item'}
              </h3>

              {/* Scan Barcode button */}
              <button
                id="scan-from-item-modal-btn"
                onClick={() => setIsScannerOpen(true)}
                class="px-3 py-1.5 bg-[#A8DF8E] text-[#3A4D39] text-xs font-bold rounded-lg hover:opacity-90 flex items-center gap-1 transition-all"
              >
                <Camera class="w-3.5 h-3.5" /> Escanear Código
              </button>
            </div>

            <div class="space-y-4">
              {/* Name */}
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Nome do Item
                </label>
                <input
                  id="item-name-input"
                  type="text"
                  placeholder="Ex: Detergente Líquido"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  class="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#232a2d] border border-transparent focus:border-[#A8DF8E]"
                />
              </div>

              {/* Quantity and Price Row */}
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">
                    Quantidade
                  </label>
                  <div class="flex items-center bg-gray-50 dark:bg-[#232a2d] rounded-xl overflow-hidden border border-transparent">
                    <button
                      onClick={() =>
                        setItemQuantity(Math.max(1, itemQuantity - 1))
                      }
                      class="px-3.5 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold"
                    >
                      -
                    </button>
                    <input
                      id="item-quantity-input"
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) =>
                        setItemQuantity(
                          Math.max(1, parseInt(e.target.value, 10) || 1),
                        )
                      }
                      class="w-full text-center bg-transparent border-none text-sm font-mono font-bold"
                    />
                    <button
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                      class="px-3.5 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">
                    Preço Unitário (R$)
                  </label>
                  <input
                    id="item-price-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={itemUnitPrice === 0 ? '' : itemUnitPrice}
                    onChange={(e) =>
                      setItemUnitPrice(
                        Math.max(0, parseFloat(e.target.value) || 0),
                      )
                    }
                    class="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#232a2d] border border-transparent focus:border-[#A8DF8E] font-mono text-sm text-right"
                  />
                </div>
              </div>

              {/* Total calculation indicator */}
              <div class="bg-gray-50 dark:bg-[#232a2d]/30 p-3 rounded-2xl flex justify-between items-center text-xs font-mono">
                <span class="text-gray-400 uppercase">Subtotal Estimado:</span>
                <span class="font-bold text-emerald-600 dark:text-[#A8DF8E] text-sm">
                  R$ {(itemQuantity * itemUnitPrice).toFixed(2)}
                </span>
              </div>

              {/* Dropdown transfer list */}
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Vincular a Lista
                </label>
                <select
                  id="item-list-dropdown"
                  value={itemTargetListId}
                  onChange={(e) => setItemTargetListId(e.target.value)}
                  class="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#232a2d] text-sm border border-transparent focus:border-[#A8DF8E]"
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comment */}
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Comentário / Observação
                </label>
                <textarea
                  id="item-comment-input"
                  placeholder="Ex: Comprar da marca X ou tamanho grande"
                  value={itemComment}
                  onChange={(e) => setItemComment(e.target.value)}
                  rows={2}
                  class="w-full px-4 py-2 bg-gray-50 dark:bg-[#232a2d] border border-transparent focus:border-[#A8DF8E] rounded-xl text-sm"
                />
              </div>

              {/* Photo Upload / Attachment */}
              <div class="space-y-2">
                <label class="block text-xs font-semibold text-gray-400 uppercase">
                  Foto do Produto (opcional)
                </label>

                <div class="flex items-center gap-3">
                  <button
                    onClick={() =>
                      document.getElementById('camera-image-input')?.click()
                    }
                    class="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-[#232a2d] text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Upload class="w-3.5 h-3.5" /> Enviar Foto
                  </button>
                  <input
                    id="camera-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    class="hidden"
                  />

                  {itemPhoto && (
                    <button
                      onClick={() => setItemPhoto(null)}
                      class="text-xs text-red-500 hover:underline font-semibold"
                    >
                      Remover Foto
                    </button>
                  )}
                </div>

                {itemPhoto && (
                  <div class="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 mt-2">
                    <img
                      src={itemPhoto}
                      alt="Preview"
                      class="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Save / Delete / Cancel actions */}
              <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#FAF8F5]/10">
                {editingItem ? (
                  <button
                    id="delete-item-modal-btn"
                    onClick={() => handleDeleteItem(editingItem.id)}
                    class="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all"
                  >
                    <Trash2 class="w-3.5 h-3.5" /> Excluir
                  </button>
                ) : (
                  <div />
                )}

                <div class="flex items-center gap-2">
                  <button
                    id="cancel-item-save"
                    onClick={() => setIsItemModalOpen(false)}
                    class="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="save-item-btn"
                    onClick={handleSaveItem}
                    class="px-5 py-2.5 bg-[#A8DF8E] hover:bg-[#99d17f] text-gray-800 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. USER SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div
          id="settings-modal"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div class="bg-[#FAF8F5] dark:bg-[#22272a] w-full max-w-md rounded-3xl p-6 meow-shadow-lg border-2 border-gray-100 dark:border-[#1b1f22] max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Header */}
            <div class="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#232a2d]/40 mb-5">
              <h3 class="text-xl font-display font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Settings class="w-5 h-5 text-amber-500 animate-spin-slow" />
                Configurações
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                class="p-1.5 rounded-full bg-white dark:bg-[#2c3439] text-gray-400 hover:text-gray-600 dark:hover:text-white border border-gray-100 dark:border-transparent transition-colors cursor-pointer"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div class="space-y-6">
              {/* Theme Settings section */}
              <div class="bg-white dark:bg-[#2c3439] rounded-2xl p-4 border border-gray-100 dark:border-transparent meow-shadow">
                <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Aparência
                </h4>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Modo Escuro
                  </span>
                  <button
                    onClick={() =>
                      setTheme(theme === 'light' ? 'dark' : 'light')
                    }
                    class="p-2 bg-[#FAF8F5] dark:bg-[#22272a] rounded-xl text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-[#232a2d]/40 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon class="w-4 h-4 text-slate-700" />
                        <span class="text-xs font-semibold">Ativar</span>
                      </>
                    ) : (
                      <>
                        <Sun class="w-4 h-4 text-amber-300" />
                        <span class="text-xs font-semibold">Desativar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Backup section */}
              <div class="bg-white dark:bg-[#2c3439] rounded-2xl p-4 border border-gray-100 dark:border-transparent meow-shadow space-y-4">
                <div>
                  <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Cópia de Segurança (Backup)
                  </h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Seus dados de listas e itens de compras estão salvos de
                    forma 100% segura no seu navegador. Exporte ou importe
                    arquivos de backup abaixo.
                  </p>
                </div>

                <div class="grid grid-cols-1 gap-2 pt-1">
                  <button
                    onClick={handleExportBackup}
                    class="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    <Download class="w-4 h-4" /> Exportar Backup JSON
                  </button>
                  <button
                    onClick={handleImportBackupClick}
                    class="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#FAF8F5] dark:bg-[#22272a] text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-xl font-bold text-xs border border-gray-200 dark:border-[#232a2d]/40 transition-all cursor-pointer"
                  >
                    <Upload class="w-4 h-4" /> Importar Backup
                  </button>
                </div>
              </div>

              {/* Session Status Section */}
              <div class="bg-white dark:bg-[#2c3439] rounded-2xl p-4 border border-gray-100 dark:border-transparent meow-shadow">
                <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Conta do Usuário
                </h4>
                {user ? (
                  <div class="space-y-3">
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-500">Usuário:</span>
                      <span class="font-bold">@{user.username}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsSettingsModalOpen(false);
                        handleLogout();
                      }}
                      class="w-full py-2.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Sair desta Conta
                    </button>
                  </div>
                ) : (
                  <div class="space-y-2">
                    <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Você está usando o app como visitante. Crie uma conta para
                      salvar e gerenciar suas listas com segurança.
                    </p>
                    <button
                      onClick={() => {
                        setIsSettingsModalOpen(false);
                        setAuthMode('login');
                        setAuthError('');
                      }}
                      class="w-full py-2.5 bg-[#A8DF8E] hover:bg-[#96ce7c] text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Entrar ou Registrar-se
                    </button>
                  </div>
                )}
              </div>

              {/* Version info footer */}
              <div class="text-center text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                SHOPPING LIST MEOW STYLE • VERSÃO 1.0.0
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. BARCODE CAMERA SCANNER OVERLAY */}
      {isScannerOpen && (
        <BarcodeScanner
          onScanSuccess={handleBarcodeScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* 8. LIGHTBOX PREVIEW MODAL */}
      {lightboxImage && (
        <div
          id="lightbox-overlay"
          onClick={() => setLightboxImage(null)}
          class="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div class="relative max-w-xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={lightboxImage}
              alt="Produto Ampliado"
              class="w-full h-full object-contain"
            />
            <button
              onClick={() => setLightboxImage(null)}
              class="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 9. GLOBAL TOAST ALERTS */}
      {toastMessage && (
        <div
          id="toast-notification"
          class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#3A4D39] dark:bg-emerald-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl z-50 animate-bounce flex items-center gap-2 max-w-xs text-center border border-emerald-500/30"
        >
          <Sparkles class="w-4 h-4 text-[#A8DF8E]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
