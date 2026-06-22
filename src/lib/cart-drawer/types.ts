// Types for the Cart Builder, extracted/adapted from the Ghozt project.

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string | number;
  compare_at_price: string | number | null;
  sku: string | null;
  inventory_quantity: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  image_id: number | null;
  featured_image?: {
    id: number;
    src: string;
    alt: string | null;
  } | null;
}

export interface ShopifyProductOption {
  id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyVariantImage {
  id: number;
  src: string;
  variant_ids: number[];
}

export interface ShopifyProduct {
  id: string;
  store_id: string;
  shopify_id: string;
  title: string;
  handle: string;
  image_url: string | null;
  price: number | null;
  compare_at_price: number | null;
  product_type?: string | null;
  vendor?: string | null;
  status?: string;
}

export type StoreLanguage = 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT';
export type StoreCurrency =
  | 'BRL'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'MXN'
  | 'ARS'
  | 'CLP'
  | 'COP'
  | 'PEN';

export const STORE_LANGUAGES: { value: StoreLanguage; label: string }[] = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'it-IT', label: 'Italiano' },
];

export const STORE_CURRENCIES: { value: StoreCurrency; symbol: string; label: string }[] = [
  { value: 'BRL', symbol: 'R$', label: 'Real (R$)' },
  { value: 'USD', symbol: '$', label: 'Dólar ($)' },
  { value: 'EUR', symbol: '€', label: 'Euro (€)' },
  { value: 'GBP', symbol: '£', label: 'Libra (£)' },
  { value: 'MXN', symbol: '$', label: 'Peso Mexicano ($)' },
  { value: 'ARS', symbol: '$', label: 'Peso Argentino ($)' },
  { value: 'CLP', symbol: '$', label: 'Peso Chileno ($)' },
  { value: 'COP', symbol: '$', label: 'Peso Colombiano ($)' },
  { value: 'PEN', symbol: 'S/', label: 'Sol Peruano (S/)' },
];

// --- Cart Widgets ---

export type CartWidgetType = 'banner' | 'countdown' | 'html' | 'upsell';

export interface CartBannerItem {
  id: string;
  imageUrl: string;
  linkUrl: string;
  alt: string;
}

export interface CartBannerWidget {
  id: string;
  type: 'banner';
  enabled: boolean;
  position: number;
  banners: CartBannerItem[];
  borderRadius: string;
  autoSlide: boolean;
  autoSlideInterval: number;
}

export interface CartCountdownWidget {
  id: string;
  type: 'countdown';
  enabled: boolean;
  position: number;
  mode: 'fixed' | 'session';
  fixedDate: string;
  sessionMinutes: number;
  message: string;
  expiredMessage: string;
  style: {
    bgColor: string;
    textColor: string;
    numberColor: string;
    numberBgColor: string;
  };
}

export interface CartHtmlWidget {
  id: string;
  type: 'html';
  enabled: boolean;
  position: number;
  content: string;
}

export interface CartUpsellProduct {
  id: string;
  title: string;
  imageUrl: string;
  price: string;
  comparePrice?: string;
  productHandle?: string;
  shopifyProductId?: string;
  selectedVariantId?: number;
  variants?: ShopifyVariant[];
}

export interface CartUpsellWidget {
  id: string;
  type: 'upsell';
  enabled: boolean;
  position: number;
  title: string;
  products: CartUpsellProduct[];
  style: {
    titleColor: string;
    cardBgColor: string;
    buttonBgColor: string;
    buttonTextColor: string;
    buttonBorderRadius: string;
    buttonText: string;
  };
}

export type CartWidget =
  | CartBannerWidget
  | CartCountdownWidget
  | CartHtmlWidget
  | CartUpsellWidget;

// --- Cart Drawer ---

export interface CartDrawerConfig {
  enabled: boolean;
  style: {
    overlayColor: string;
    drawerBgColor: string;
    headerBgColor: string;
    headerTextColor: string;
    itemBgColor: string;
    itemTextColor: string;
    itemPriceColor: string;
    footerBgColor: string;
    subtotalColor: string;
    dividerColor: string;
  };
  header: {
    title: string;
    fontSize: string;
    fontWeight: string;
  };
  emptyCart: {
    title: string;
    subtitle: string;
    iconSize: string;
  };
  quantityControls: {
    buttonBgColor: string;
    buttonTextColor: string;
    buttonBorderRadius: string;
  };
  freeShipping: {
    enabled: boolean;
    threshold: number;
    currency: string;
    message: string;
    achievedMessage: string;
    progressBarColor: string;
    progressBgColor: string;
  };
  checkoutButton: {
    text: string;
    backgroundColor: string;
    textColor: string;
    fontSize: string;
    fontWeight: string;
    borderRadius: string;
  };
  continueButton: {
    text: string;
    textColor: string;
    fontSize: string;
  };
  bundleBadge?: {
    text?: string;
    backgroundColor?: string;
    textColor?: string;
    useGradient?: boolean;
    gradientFrom?: string;
    gradientTo?: string;
  };
  footerCustomContent?: {
    enabled?: boolean;
    type?: 'image' | 'html';
    imageUrl?: string;
    imageLinkUrl?: string;
    imageAlt?: string;
    html?: string;
    marginTop?: string;
    marginBottom?: string;
    align?: 'left' | 'center' | 'right';
  };
  animation: {
    type: 'slide' | 'fade';
    duration: string;
  };
  widgets?: CartWidget[];
  sectionOrder?: string[];
  lastSectionPosition?: 'with-items' | 'with-footer';
}