// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { Package, Trash2, Plus } from 'lucide-react';
import { CartUpsellWidget, CartUpsellProduct, ShopifyProduct, ShopifyVariant, ShopifyProductOption, ShopifyVariantImage } from '@/lib/cart-drawer/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ColorInput from '../ColorInput';
import ProductSelectorModal from '../ProductSelectorModal';
import { formatCurrency } from '@/lib/cart-drawer/currencyFormat';

interface ProductVariantsData {
  options: ShopifyProductOption[];
  variants: ShopifyVariant[];
  images: ShopifyVariantImage[];
}

interface UpsellProductPickerProps {
  widget: CartUpsellWidget;
  onUpdate: (u: Partial<CartUpsellWidget>) => void;
  upsellProducts: ShopifyProduct[];
  fetchProductVariants?: (shopifyProductId: string) => Promise<ProductVariantsData | null>;
  /** Currency symbol from the cart drawer config (config.freeShipping.currency). Defaults to 'R$'. */
  currency?: string;
}

const InputGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const UpsellProductPicker: React.FC<UpsellProductPickerProps> = ({ widget, onUpdate, upsellProducts, fetchProductVariants, currency = 'R$' }) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState<string | null>(null);

  const addUpsellProduct = useCallback(async (product: ShopifyProduct) => {
    const newProduct: CartUpsellProduct = {
      id: `up${Date.now()}`,
      title: product.title,
      imageUrl: product.image_url || '',
      price: product.price != null ? formatCurrency(product.price, currency) : formatCurrency(0, currency),
      comparePrice: product.compare_at_price != null ? formatCurrency(product.compare_at_price, currency) : undefined,
      productHandle: product.handle,
      shopifyProductId: product.shopify_id,
    };

    // Fetch variants if available
    if (fetchProductVariants) {
      setLoadingVariants(newProduct.id);
      try {
        const data = await fetchProductVariants(product.shopify_id);
        if (data && data.variants.length > 1) {
          newProduct.variants = data.variants;
          newProduct.selectedVariantId = data.variants[0].id;
        }
      } catch (err) {
        console.error('Error fetching variants:', err);
      }
      setLoadingVariants(null);
    }

    onUpdate({ products: [...widget.products, newProduct] });
  }, [widget.products, onUpdate, fetchProductVariants, currency]);

  const updateProduct = (idx: number, updates: Partial<CartUpsellProduct>) => {
    const products = widget.products.map((p, i) => i === idx ? { ...p, ...updates } : p);
    onUpdate({ products });
  };

  const removeProduct = (idx: number) => {
    onUpdate({ products: widget.products.filter((_, i) => i !== idx) });
  };

  const addManualProduct = () => {
    onUpdate({
      products: [...widget.products, { id: `up${Date.now()}`, title: 'Novo Produto', imageUrl: '', price: formatCurrency(0, currency), productHandle: '' }],
    });
  };

  const handleVariantChange = (idx: number, variantId: string) => {
    const product = widget.products[idx];
    if (!product.variants) return;
    const variant = product.variants.find(v => v.id === Number(variantId));
    if (!variant) return;
    const price = typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price;
    const comparePrice = variant.compare_at_price ? (typeof variant.compare_at_price === 'string' ? parseFloat(variant.compare_at_price) : variant.compare_at_price) : null;
    updateProduct(idx, {
      selectedVariantId: variant.id,
      price: formatCurrency(price, currency),
      comparePrice: comparePrice ? formatCurrency(comparePrice, currency) : undefined,
    });
  };

  return (
    <div className="space-y-3">
      <InputGroup label="Título da Seção">
        <Input value={widget.title} onChange={e => onUpdate({ title: e.target.value })} className="bg-secondary border-border" />
      </InputGroup>

      {widget.products.map((product, idx) => (
        <div key={product.id} className="space-y-2 p-2 rounded-lg bg-background border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              {product.shopifyProductId ? (
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3 text-primary" />
                  Produto {idx + 1}
                </span>
              ) : (
                `Produto ${idx + 1} (manual)`
              )}
            </span>
            <button onClick={() => removeProduct(idx)} className="text-destructive hover:text-destructive/80">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Product image + title preview */}
          {product.imageUrl && (
            <div className="flex items-center gap-2">
              <img src={product.imageUrl} alt={product.title} className="w-10 h-10 rounded object-cover border border-border" />
              <span className="text-xs text-foreground font-medium truncate">{product.title}</span>
            </div>
          )}

          {/* Variant info (read-only — customer selects in cart) */}
          {product.variants && product.variants.length > 1 && (
            <p className="text-[11px] text-muted-foreground">
              {product.variants.length} variantes disponíveis (seleção no carrinho)
            </p>
          )}

          {loadingVariants === product.id && (
            <p className="text-xs text-muted-foreground animate-pulse">Carregando variantes...</p>
          )}

          {/* Manual fields (always visible for manual, collapsed for shopify-linked) */}
          {!product.shopifyProductId && (
            <>
              <InputGroup label="Título">
                <Input value={product.title} onChange={e => updateProduct(idx, { title: e.target.value })} className="bg-secondary border-border text-xs" />
              </InputGroup>
              <InputGroup label="URL da Imagem">
                <Input value={product.imageUrl} onChange={e => updateProduct(idx, { imageUrl: e.target.value })} className="bg-secondary border-border text-xs" placeholder="https://..." />
              </InputGroup>
              <InputGroup label="Handle do Produto (Shopify)">
                <Input value={product.productHandle || ''} onChange={e => updateProduct(idx, { productHandle: e.target.value })} className="bg-secondary border-border text-xs" placeholder="ex: camiseta-preta" />
              </InputGroup>
              <div className="grid grid-cols-2 gap-2">
                <InputGroup label="Preço">
                  <Input value={product.price} onChange={e => updateProduct(idx, { price: e.target.value })} className="bg-secondary border-border text-xs" />
                </InputGroup>
                <InputGroup label="Preço Original">
                  <Input value={product.comparePrice || ''} onChange={e => updateProduct(idx, { comparePrice: e.target.value })} className="bg-secondary border-border text-xs" />
                </InputGroup>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Add product buttons */}
      <div className="flex gap-2">
        {upsellProducts.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setSelectorOpen(true)} className="flex-1 text-xs">
            <Package className="w-3.5 h-3.5 mr-1" /> Escolher Produto
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={addManualProduct} className="flex-1 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Manual
        </Button>
      </div>

      <ColorInput label="Cor do Título" value={widget.style.titleColor} onChange={v => onUpdate({ style: { ...widget.style, titleColor: v } })} />
      <ColorInput label="Fundo do Card" value={widget.style.cardBgColor} onChange={v => onUpdate({ style: { ...widget.style, cardBgColor: v } })} />
      <ColorInput label="Cor do Botão" value={widget.style.buttonBgColor} onChange={v => onUpdate({ style: { ...widget.style, buttonBgColor: v } })} />
      <ColorInput label="Texto do Botão" value={widget.style.buttonTextColor} onChange={v => onUpdate({ style: { ...widget.style, buttonTextColor: v } })} />

      <InputGroup label="Texto do Botão">
        <Input value={widget.style.buttonText} onChange={e => onUpdate({ style: { ...widget.style, buttonText: e.target.value } })} className="bg-secondary border-border" />
      </InputGroup>
      <InputGroup label="Border Radius do Botão">
        <Input value={widget.style.buttonBorderRadius} onChange={e => onUpdate({ style: { ...widget.style, buttonBorderRadius: e.target.value } })} className="bg-secondary border-border" />
      </InputGroup>

      <ProductSelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={addUpsellProduct}
        products={upsellProducts}
      />
    </div>
  );
};

export default UpsellProductPicker;
