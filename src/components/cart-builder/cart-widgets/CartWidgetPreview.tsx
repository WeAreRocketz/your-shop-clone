// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { CartWidget, CartBannerWidget, CartCountdownWidget, CartHtmlWidget, CartUpsellWidget, CartUpsellProduct } from '@/lib/cart-drawer/types';
import { formatCurrency, reformatPriceString } from '@/lib/cart-drawer/currencyFormat';

interface CartWidgetPreviewProps {
  widgets: CartWidget[];
  dividerColor: string;
  /** Currency symbol from cart drawer config (config.freeShipping.currency). Defaults to 'R$'. */
  currency?: string;
}

const CartWidgetPreview: React.FC<CartWidgetPreviewProps> = ({ widgets, dividerColor, currency = 'R$' }) => {
  const sorted = [...widgets]
    .filter(w => w.enabled)
    .sort((a, b) => a.position - b.position);

  if (sorted.length === 0) return null;

  return (
    <div>
      {sorted.map(widget => (
        <div key={widget.id} style={{ borderBottom: `1px solid ${dividerColor}` }}>
          {widget.type === 'banner' && <BannerPreview widget={widget} />}
          {widget.type === 'countdown' && <CountdownPreview widget={widget} />}
          {widget.type === 'html' && <HtmlPreview widget={widget} />}
          {widget.type === 'upsell' && <UpsellPreview widget={widget} currency={currency} />}
        </div>
      ))}
    </div>
  );
};

// === Banner Preview ===
const BannerPreview: React.FC<{ widget: CartBannerWidget }> = ({ widget }) => {
  const [current, setCurrent] = useState(0);
  const validBanners = widget.banners.filter(b => b.imageUrl);

  useEffect(() => {
    if (!widget.autoSlide || validBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % validBanners.length);
    }, widget.autoSlideInterval);
    return () => clearInterval(timer);
  }, [widget.autoSlide, widget.autoSlideInterval, validBanners.length]);

  if (validBanners.length === 0) {
    return (
      <div className="px-4 py-3">
        <div
          className="h-16 flex items-center justify-center text-xs"
          style={{
            background: '#f3f4f6',
            borderRadius: widget.borderRadius,
            color: '#9ca3af',
          }}
        >
          📷 Adicione uma imagem ao banner
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <div className="relative overflow-hidden" style={{ borderRadius: widget.borderRadius }}>
        <img
          src={validBanners[current]?.imageUrl}
          alt={validBanners[current]?.alt}
          className="w-full h-auto object-cover"
          style={{ maxHeight: '120px' }}
        />
        {validBanners.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {validBanners.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === current ? '#fff' : 'rgba(255,255,255,0.5)' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// === Countdown Preview ===
const CountdownPreview: React.FC<{ widget: CartCountdownWidget }> = ({ widget }) => {
  const [time, setTime] = useState(() => {
    if (widget.mode === 'session') return widget.sessionMinutes * 60;
    const target = new Date(widget.fixedDate).getTime();
    return Math.max(0, Math.floor((target - Date.now()) / 1000));
  });

  useEffect(() => {
    if (time <= 0) return;
    const timer = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [time]);

  // Reset when config changes
  useEffect(() => {
    if (widget.mode === 'session') {
      setTime(widget.sessionMinutes * 60);
    } else {
      const target = new Date(widget.fixedDate).getTime();
      setTime(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    }
  }, [widget.mode, widget.sessionMinutes, widget.fixedDate]);

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const isExpired = time <= 0;

  return (
    <div className="px-4 py-3" style={{ background: widget.style.bgColor }}>
      {isExpired ? (
        <p className="text-center text-xs font-medium" style={{ color: widget.style.textColor }}>
          {widget.expiredMessage}
        </p>
      ) : (
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <p className="text-xs font-medium m-0" style={{ color: widget.style.textColor }}>
            {widget.message}
          </p>
          <div className="flex items-center gap-1">
            {[pad(hours), pad(minutes), pad(seconds)].map((val, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-xs font-bold" style={{ color: widget.style.textColor }}>:</span>}
                <span
                  className="inline-flex items-center justify-center w-7 h-6 rounded text-xs font-bold"
                  style={{ background: widget.style.numberBgColor, color: widget.style.numberColor }}
                >
                  {val}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// === HTML Preview ===
const HtmlPreview: React.FC<{ widget: CartHtmlWidget }> = ({ widget }) => (
  <div className="px-4 py-3" dangerouslySetInnerHTML={{ __html: widget.content }} />
);

// === Upsell Preview ===
const UpsellPreview: React.FC<{ widget: CartUpsellWidget; currency: string }> = ({ widget, currency }) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});

  const getSelectedVariant = (product: CartUpsellProduct) => {
    if (!product.variants || product.variants.length <= 1) return null;
    const selectedId = selectedVariants[product.id] || product.selectedVariantId || product.variants[0].id;
    return product.variants.find(v => v.id === selectedId) || product.variants[0];
  };

  const getDisplayPrice = (product: CartUpsellProduct) => {
    const variant = getSelectedVariant(product);
    if (!variant) {
      // Re-format any legacy price string (e.g. "R$ 69,90") to the active currency
      return {
        price: reformatPriceString(product.price, currency),
        comparePrice: product.comparePrice ? reformatPriceString(product.comparePrice, currency) : undefined,
      };
    }
    const price = typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price;
    const comparePrice = variant.compare_at_price
      ? (typeof variant.compare_at_price === 'string' ? parseFloat(variant.compare_at_price) : variant.compare_at_price)
      : null;
    return {
      price: formatCurrency(price, currency),
      comparePrice: comparePrice ? formatCurrency(comparePrice, currency) : undefined,
    };
  };

  return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold mb-2" style={{ color: widget.style.titleColor }}>
        {widget.title}
      </p>
      <div className="space-y-2">
        {widget.products.map(product => {
          const { price, comparePrice } = getDisplayPrice(product);
          const hasVariants = product.variants && product.variants.length > 1;
          return (
            <div
              key={product.id}
              className="rounded-lg overflow-hidden"
              style={{ background: widget.style.cardBgColor }}
            >
              <div className="flex items-center gap-2.5 p-2">
                <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-gray-100">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📷</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1" style={{ color: widget.style.titleColor }}>
                    {product.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-semibold" style={{ color: widget.style.titleColor }}>
                      {price}
                    </span>
                    {comparePrice && (
                      <span className="text-[10px] line-through" style={{ color: '#9ca3af' }}>
                        {comparePrice}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="shrink-0 text-[11px] font-semibold px-3 py-1.5 border-none cursor-default"
                  style={{
                    background: widget.style.buttonBgColor,
                    color: widget.style.buttonTextColor,
                    borderRadius: widget.style.buttonBorderRadius,
                  }}
                >
                  {widget.style.buttonText}
                </button>
              </div>
              {hasVariants && (
                <div className="px-2 pb-2">
                  <select
                    className="w-full text-[11px] px-2 py-1.5 rounded border appearance-auto"
                    style={{
                      borderColor: `${widget.style.titleColor}33`,
                      background: widget.style.cardBgColor || 'rgba(255,255,255,0.9)',
                      color: widget.style.titleColor,
                    }}
                    value={selectedVariants[product.id] || product.selectedVariantId || product.variants![0].id}
                    onChange={e => setSelectedVariants(prev => ({ ...prev, [product.id]: Number(e.target.value) }))}
                  >
                    {product.variants!.map(v => (
                      <option key={v.id} value={v.id}>{v.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CartWidgetPreview;
