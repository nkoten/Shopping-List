# DECISIONS - Shopping List App (Lista de Compras)

Este documento registra as decisões de design, arquitetura, progresso e próximos passos para garantir continuidade no desenvolvimento e fácil transição de contexto.

---

## 1. Arquitetura e Decisões de Tecnologia

### Contexto de Execução
- **Framework**: React 19 + Vite 6 + Tailwind CSS v4.
- **Plataforma**: Web SPA otimizada para PWA (Progressive Web App).
- **Persistência (DDB)**: LocalStorage (offline-first), garantindo funcionamento 100% autônomo offline.
- **Portabilidade**: Funcionalidade integrada para exportação/importação de backups em formato JSON de forma global ou individual por lista.
- **Modo PWA**: Configuração de manifesto (`manifest.json`), service worker (`sw.js`) e ícone vetorial de gato (`icon.svg`) para instalação nativa no Android com suporte offline completo.
- **Integração de Scanner**: Utilização de câmera integrada ao navegador com fallback para simulação interativa de escaneamento de códigos de barra brasileiros e busca dinâmica em tempo real no banco de dados aberto **Open Food Facts**.

### Temas (Inspirados em "Meow Money Manager")
- **Tema Claro (Soft Pastel Mint/Cream)**: Cores suaves, cantos arredondados generosos, estética limpa e "fofa" (cute aesthetic).
- **Tema Escuro (Midnight Pastel Plum/Navy)**: Tons escuros quentes de ameixa/marinho com destaques em pastel para contraste agradável e sem fadiga visual.

### Autenticação (JWT / Modo Visitante)
- **Modo Híbrido**: Fluxo de login JWT simulado localmente de forma robusta. Permite cadastro, login e persistência por conta ou modo "Visitante" (Guest) sem autenticação obrigatória.

---

## 2. Status do MVP e Funcionalidades

### Progresso das Funcionalidades
- [x] Criação do arquivo de decisões `DECISIONS.md`
- [x] Splash Screen (3 segundos com animação sutil de carregamento e tema fofo de gato)
- [x] Sistema de Contas (Registro, Login JWT simulado e Modo Visitante)
- [x] Dashboard Home:
  - Criação de listas com cores personalizadas (Hex ou Paleta pré-definida) e numeração automática ("Lista #n")
  - Exibição em cards dropdown elegantes com cabeçalho colorido da lista
  - Estatísticas da lista (formato `x/y` de itens marcados) e contagem total
  - Menu de 3 pontos com ações: Adicionar Item, Limpar Lista, Exportar Backup, Enviar para WhatsApp, Editar Nome/Cor, Excluir Lista
- [x] Itens da Lista:
  - Formato de linha única com nome, quantidade e valor total (em BRL R$)
  - Toque para marcar/desmarcar com alteração visual de background
  - Ações individuais de edição (lápis) e exclusão (lixeira)
- [x] FAB (Floating Action Button):
  - Interface flutuante para adicionar novos itens
  - Reconhecimento automático de quantidade (ex: "3 bananas" ou "bananas 3")
  - Criação rápida de itens em chips dinâmicos (com botão X de remoção)
  - Seleção da lista de destino por chips coloridos
- [x] Menu/Modal de Edição de Itens:
  - Ajuste de nome, quantidade, preço unitário, comentário opcional, transferência de lista, exclusão e anexo de foto
- [x] Scanner de Código de Barras (Integração Open Food Facts):
  - Interface que utiliza a câmera do dispositivo e busca dados do produto na API gratuita e pública do Open Food Facts.

---

## 3. Próximos Passos de Implementação (Propostos para o Usuário)
1. **DDB Cloud (Firestore)**: Substituir o LocalStorage por sincronização em tempo real na nuvem do Google Firebase Firestore para que múltiplos aparelhos possam acessar a mesma lista simultaneamente.
2. **Integração Auth Real**: Habilitar autenticação real (via Firebase Auth) para segurança adicional e controle de acesso a contas.
3. **Notificações Push**: Enviar lembretes automáticos quando o usuário passar perto de um supermercado cadastrado ou para compras recorrentes.
