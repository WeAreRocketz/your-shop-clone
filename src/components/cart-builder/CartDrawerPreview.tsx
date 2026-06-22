// @ts-nocheck
import React from 'react';
import { CartDrawerConfig, StoreLanguage } from '@/lib/cart-drawer/types';
import { normalizeCartSectionOrder } from '@/lib/cart-drawer/cartSectionOrder';
import CartWidgetPreview from './cart-widgets/CartWidgetPreview';
import { formatCurrency } from '@/lib/cart-drawer/currencyFormat';

interface CartDrawerPreviewProps {
  config: CartDrawerConfig;
  language?: StoreLanguage;
}

const previewTranslations: Record<StoreLanguage, {
  productTitle: string;
  bundleTitle: string;
  size: string;
  color: string;
  black: string;
  quantityShort: string;
  remove: string;
  subtotal: string;
}> = {
  'pt-BR': { productTitle: 'Produto Exemplo Premium', bundleTitle: 'Kit Especial - 3 Unidades', size: 'Tamanho', color: 'Cor', black: 'Preto', quantityShort: 'Qtd', remove: 'Remover', subtotal: 'Subtotal' },
  'en-US': { productTitle: 'Premium Sample Product', bundleTitle: 'Special Kit - 3 Units', size: 'Size', color: 'Color', black: 'Black', quantityShort: 'Qty', remove: 'Remove', subtotal: 'Subtotal' },
  'es-ES': { productTitle: 'Producto Ejemplo Premium', bundleTitle: 'Kit Especial - 3 Unidades', size: 'Talla', color: 'Color', black: 'Negro', quantityShort: 'Cant', remove: 'Eliminar', subtotal: 'Subtotal' },
  'fr-FR': { productTitle: 'Produit Exemple Premium', bundleTitle: 'Kit Spécial - 3 Unités', size: 'Taille', color: 'Couleur', black: 'Noir', quantityShort: 'Qté', remove: 'Supprimer', subtotal: 'Sous-total' },
  'de-DE': { productTitle: 'Premium Beispielprodukt', bundleTitle: 'Spezial-Set - 3 Stück', size: 'Größe', color: 'Farbe', black: 'Schwarz', quantityShort: 'Anz', remove: 'Entfernen', subtotal: 'Zwischensumme' },
  'it-IT': { productTitle: 'Prodotto Esempio Premium', bundleTitle: 'Kit Speciale - 3 Unità', size: 'Taglia', color: 'Colore', black: 'Nero', quantityShort: 'Qtà', remove: 'Rimuovi', subtotal: 'Subtotale' },
};

const CartDrawerPreview: React.FC<CartDrawerPreviewProps> = ({ config, language = 'pt-BR' }) => {
  const t = previewTranslations[language] || previewTranslations['pt-BR'];
  const style = config.style || {} as CartDrawerConfig['style'];
  const header = config.header || {} as CartDrawerConfig['header'];
  const checkoutButton = config.checkoutButton || {} as CartDrawerConfig['checkoutButton'];
  const continueButton = config.continueButton || {} as CartDrawerConfig['continueButton'];
  const freeShipping = config.freeShipping || { enabled: false } as CartDrawerConfig['freeShipping'];
  const quantityControls = config.quantityControls || {} as CartDrawerConfig['quantityControls'];
  const bundleBadge = config.bundleBadge || {};
  const footerCustom = config.footerCustomContent || {};
  const currency = (config.freeShipping && config.freeShipping.currency) || 'R$';

  const badgeBg = bundleBadge.useGradient
    ? `linear-gradient(135deg, ${bundleBadge.gradientFrom || '#7c3aed'}, ${bundleBadge.gradientTo || '#a855f7'})`
    : (bundleBadge.backgroundColor || '#7c3aed');
  const badgeColor = bundleBadge.textColor || '#ffffff';
  const badgeText = (bundleBadge.text || 'BUNDLE').replace('{quantity}', '3');

  const mockItems = [
    {
      id: '1',
      title: t.productTitle,
      variant: `${t.size}: M / ${t.color}: ${t.black}`,
      price: formatCurrency(129.9, currency),
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&h=160&fit=crop',
      isBundle: false,
    },
    {
      id: '2',
      title: t.bundleTitle,
      variant: `${t.size}: G`,
      price: formatCurrency(249.9, currency),
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&h=160&fit=crop',
      isBundle: true,
    },
  ];

  const subtotal = formatCurrency(509.7, currency);
  const shippingProgress = 70;
  const shippingRemaining = formatCurrency(89.3, currency);

  // Default section order
  const sectionOrder = normalizeCartSectionOrder(config.sectionOrder, config.widgets);
  const lastSectionPosition = config.lastSectionPosition || 'with-items';

  // Find last active section
  const isActiveSection = (id: string) => {
    if (id === 'freeShipping') return freeShipping.enabled;
    if (id === 'items') return true;
    const widget = config.widgets?.find(w => w.id === id);
    return widget?.enabled ?? false;
  };
  let lastActiveId: string | null = null;
  sectionOrder.forEach(id => { if (isActiveSection(id)) lastActiveId = id; });

  // Render individual section by ID
  const renderSection = (sectionId: string) => {
    if (sectionId === 'freeShipping') {
      if (!freeShipping.enabled) return null;
      return (
        <div
          key="freeShipping"
          className="px-5 py-3"
          style={{ background: `${freeShipping.progressBgColor}33`, borderBottom: `1px solid ${style.dividerColor}` }}
        >
          <p className="text-[13px] mb-2 text-center" style={{ color: style.itemTextColor }}>
            {freeShipping.message.replace('{remaining}', shippingRemaining)}
          </p>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: freeShipping.progressBgColor }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ background: freeShipping.progressBarColor, width: `${shippingProgress}%` }}
            />
          </div>
        </div>
      );
    }

    if (sectionId === 'items') {
      return (
        <div key="items" className="px-5 py-4">
          {mockItems.map((item) => (
            <div key={item.id} className="flex gap-3 py-3" style={{ borderBottom: `1px solid ${style.dividerColor}` }}>
              <div className="w-[70px] h-[70px] rounded-lg overflow-hidden shrink-0" style={{ background: '#f3f4f6' }}>
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: style.itemTextColor }}>
                  {item.title}
                </p>
                <p className="text-xs" style={{ color: '#9ca3af' }}>{item.variant}</p>
                {item.isBundle && (
                  <span
                    className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded w-fit uppercase tracking-wide"
                    style={{ background: badgeBg, color: badgeColor }}
                  >
                    {badgeText}
                  </span>
                )}
                <p className="text-sm font-semibold mt-auto" style={{ color: style.itemPriceColor }}>
                  {item.price}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {item.isBundle ? (
                    <div className="flex items-center px-3 py-1 rounded text-[13px]" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                      {t.quantityShort}: {item.quantity}
                    </div>
                  ) : (
                    <div className="flex items-center overflow-hidden" style={{ border: `1px solid ${style.dividerColor}`, borderRadius: quantityControls.buttonBorderRadius }}>
                      <button className="w-7 h-7 flex items-center justify-center border-none cursor-default text-base" style={{ background: quantityControls.buttonBgColor, color: quantityControls.buttonTextColor }}>−</button>
                      <span className="w-8 text-center text-sm font-medium" style={{ color: style.itemTextColor, background: '#fff' }}>{item.quantity}</span>
                      <button className="w-7 h-7 flex items-center justify-center border-none cursor-default text-base" style={{ background: quantityControls.buttonBgColor, color: quantityControls.buttonTextColor }}>+</button>
                    </div>
                  )}
                  <button className="border-none bg-transparent cursor-default p-1 text-xs" style={{ color: '#ef4444' }}>{t.remove}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // It's a widget ID - render the specific widget
    const widget = config.widgets?.find(w => w.id === sectionId);
    if (!widget || !widget.enabled) return null;
    return (
      <div key={sectionId}>
        <CartWidgetPreview widgets={[widget]} dividerColor={style.dividerColor} currency={currency} />
      </div>
    );
  };

  // Split sections: scrollable vs fixed-to-footer
  const scrollableSections = lastSectionPosition === 'with-footer' && lastActiveId
    ? sectionOrder.filter(id => id !== lastActiveId)
    : sectionOrder;
  const fixedSection = lastSectionPosition === 'with-footer' && lastActiveId ? lastActiveId : null;

  return (
    <div className="w-full max-w-[420px] mx-auto h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border/50">
      <div className="flex-1 flex flex-col min-h-0" style={{ background: style.drawerBgColor }}>
        {/* Header - always first */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ background: style.headerBgColor, borderBottom: `1px solid ${style.dividerColor}` }}
        >
          <h2 className="m-0" style={{ fontSize: header.fontSize, fontWeight: header.fontWeight, color: style.headerTextColor }}>
            {header.title}
          </h2>
          <button className="p-2 border-none bg-transparent cursor-default" style={{ color: style.headerTextColor }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body - sections rendered in configured order */}
        <div className="flex-1 overflow-y-auto">
          {scrollableSections.map(sectionId => renderSection(sectionId))}
        </div>

        {/* Fixed section above footer */}
        {fixedSection && (
          <div className="shrink-0" style={{ borderTop: `1px solid ${style.dividerColor}` }}>
            {renderSection(fixedSection)}
          </div>
        )}

        {/* Footer - always last */}
        <div className="px-5 py-4 shrink-0" style={{ background: style.footerBgColor, borderTop: `1px solid ${style.dividerColor}` }}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-base" style={{ color: style.itemTextColor }}>{t.subtotal}</span>
            <span className="font-bold text-base" style={{ color: style.subtotalColor }}>{subtotal}</span>
          </div>
          <button
            className="w-full border-none cursor-default mb-2 transition-opacity"
            style={{
              padding: '14px 20px',
              background: checkoutButton.backgroundColor,
              color: checkoutButton.textColor,
              fontSize: checkoutButton.fontSize,
              fontWeight: checkoutButton.fontWeight,
              borderRadius: checkoutButton.borderRadius,
            }}
          >
            {checkoutButton.text}
          </button>
          {footerCustom.enabled && (
            <div
              style={{
                marginTop: footerCustom.marginTop || '12px',
                marginBottom: footerCustom.marginBottom || '0px',
                textAlign: (footerCustom.align as any) || 'center',
              }}
            >
              {footerCustom.type === 'image' && footerCustom.imageUrl ? (
                <img
                  src={footerCustom.imageUrl}
                  alt={footerCustom.imageAlt || ''}
                  style={{ display: 'inline-block', maxWidth: '100%', height: 'auto' }}
                />
              ) : footerCustom.type === 'html' && footerCustom.html ? (
                <div dangerouslySetInnerHTML={{ __html: footerCustom.html }} />
              ) : (
                <div className="text-xs text-muted-foreground italic">Conteúdo personalizado abaixo do botão de compra</div>
              )}
            </div>
          )}
          <button
            className="w-full border-none bg-transparent cursor-default text-center py-2.5"
            style={{ color: continueButton.textColor, fontSize: continueButton.fontSize }}
          >
            {continueButton.text}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDrawerPreview;
