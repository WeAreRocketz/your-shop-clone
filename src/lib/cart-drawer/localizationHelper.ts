// @ts-nocheck
import { CartDrawerConfig, StoreLanguage, StoreCurrency, STORE_CURRENCIES } from './types';

export function getCurrencySymbol(currency: StoreCurrency): string {
  return STORE_CURRENCIES.find(c => c.value === currency)?.symbol || 'R$';
}

const translations: Record<StoreLanguage, any> = {
  'pt-BR': {
    headerTitle: 'Carrinho',
    emptyTitle: 'Seu carrinho está vazio',
    emptySubtitle: 'Adicione produtos para continuar',
    freeShippingMessage: 'Faltam {{amount}} para frete grátis!',
    freeShippingAchieved: 'Você ganhou frete grátis!',
    checkoutText: 'Finalizar Compra',
    continueText: 'Continuar Comprando',
  },
  'en-US': {
    headerTitle: 'Cart',
    emptyTitle: 'Your cart is empty',
    emptySubtitle: 'Add products to continue',
    freeShippingMessage: 'Add {{amount}} more for free shipping!',
    freeShippingAchieved: 'You got free shipping!',
    checkoutText: 'Checkout',
    continueText: 'Continue Shopping',
  },
  'es-ES': {
    headerTitle: 'Carrito',
    emptyTitle: 'Tu carrito está vacío',
    emptySubtitle: 'Añade productos para continuar',
    freeShippingMessage: '¡Faltan {{amount}} para envío gratis!',
    freeShippingAchieved: '¡Tienes envío gratis!',
    checkoutText: 'Finalizar Compra',
    continueText: 'Seguir Comprando',
  },
  'fr-FR': {
    headerTitle: 'Panier',
    emptyTitle: 'Votre panier est vide',
    emptySubtitle: 'Ajoutez des produits pour continuer',
    freeShippingMessage: 'Encore {{amount}} pour la livraison gratuite!',
    freeShippingAchieved: 'Livraison gratuite obtenue!',
    checkoutText: 'Commander',
    continueText: 'Continuer mes achats',
  },
  'de-DE': {
    headerTitle: 'Warenkorb',
    emptyTitle: 'Ihr Warenkorb ist leer',
    emptySubtitle: 'Fügen Sie Produkte hinzu',
    freeShippingMessage: 'Noch {{amount}} bis Versandkostenfrei!',
    freeShippingAchieved: 'Versandkostenfrei!',
    checkoutText: 'Zur Kasse',
    continueText: 'Weiter einkaufen',
  },
  'it-IT': {
    headerTitle: 'Carrello',
    emptyTitle: 'Il tuo carrello è vuoto',
    emptySubtitle: 'Aggiungi prodotti per continuare',
    freeShippingMessage: 'Ancora {{amount}} per la spedizione gratuita!',
    freeShippingAchieved: 'Spedizione gratuita!',
    checkoutText: 'Checkout',
    continueText: 'Continua acquisti',
  },
};

export function applyLocalizationToCartDrawer(
  config: CartDrawerConfig,
  language: StoreLanguage,
  currency: StoreCurrency,
): CartDrawerConfig {
  const t = translations[language] || translations['pt-BR'];
  const symbol = getCurrencySymbol(currency);
  return {
    ...config,
    header: { ...config.header, title: t.headerTitle },
    emptyCart: { ...config.emptyCart, title: t.emptyTitle, subtitle: t.emptySubtitle },
    freeShipping: {
      ...config.freeShipping,
      currency: symbol,
      message: t.freeShippingMessage,
      achievedMessage: t.freeShippingAchieved,
    },
    checkoutButton: { ...config.checkoutButton, text: t.checkoutText },
    continueButton: { ...config.continueButton, text: t.continueText },
  };
}