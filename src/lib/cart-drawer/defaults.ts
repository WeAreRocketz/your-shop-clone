import { CartDrawerConfig } from './types';

export const defaultCartDrawerConfig: CartDrawerConfig = {
  enabled: true,
  style: {
    overlayColor: 'rgba(0,0,0,0.5)',
    drawerBgColor: '#FFFFFF',
    headerBgColor: '#FFFFFF',
    headerTextColor: '#111111',
    itemBgColor: '#FFFFFF',
    itemTextColor: '#111111',
    itemPriceColor: '#111111',
    footerBgColor: '#F8F8F8',
    subtotalColor: '#111111',
    dividerColor: '#E5E5E5',
  },
  header: { title: 'Carrinho', fontSize: '18px', fontWeight: '600' },
  emptyCart: {
    title: 'Seu carrinho está vazio',
    subtitle: 'Adicione produtos para continuar',
    iconSize: '64px',
  },
  quantityControls: {
    buttonBgColor: '#F4F4F4',
    buttonTextColor: '#111111',
    buttonBorderRadius: '6px',
  },
  freeShipping: {
    enabled: true,
    threshold: 200,
    currency: 'R$',
    message: 'Faltam {{amount}} para frete grátis!',
    achievedMessage: 'Você ganhou frete grátis!',
    progressBarColor: '#10B981',
    progressBgColor: '#E5E5E5',
  },
  checkoutButton: {
    text: 'Finalizar Compra',
    backgroundColor: '#111111',
    textColor: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
  },
  continueButton: {
    text: 'Continuar Comprando',
    textColor: '#666666',
    fontSize: '14px',
  },
  animation: { type: 'slide', duration: '300ms' },
  widgets: [],
  sectionOrder: ['freeShipping', 'items'],
  lastSectionPosition: 'with-footer',
};