// @ts-nocheck
import React, { useCallback } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Image, Timer, Code, ShoppingBag, Plus, Trash2, X } from 'lucide-react';
import { CartWidget, CartBannerWidget, CartCountdownWidget, CartHtmlWidget, CartUpsellWidget, ShopifyProduct, ShopifyVariant, ShopifyProductOption, ShopifyVariantImage } from '@/lib/cart-drawer/types';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ColorInput from '../ColorInput';
import ControlledInput from '../ControlledInput';
import UpsellProductPicker from './UpsellProductPicker';

interface ProductVariantsData {
  options: ShopifyProductOption[];
  variants: ShopifyVariant[];
  images: ShopifyVariantImage[];
}

interface CartWidgetEditorProps {
  widgets: CartWidget[];
  onChange: (widgets: CartWidget[]) => void;
  upsellProducts?: ShopifyProduct[];
  fetchProductVariants?: (shopifyProductId: string) => Promise<ProductVariantsData | null>;
  /** Currency symbol from the cart drawer config (config.freeShipping.currency). Defaults to 'R$'. */
  currency?: string;
}

const widgetLabels: Record<string, { label: string; icon: React.ElementType }> = {
  banner: { label: 'Banner Slider', icon: Image },
  countdown: { label: 'Contador', icon: Timer },
  html: { label: 'HTML Customizado', icon: Code },
  upsell: { label: 'Upsell', icon: ShoppingBag },
};

const InputGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const CartWidgetEditor: React.FC<CartWidgetEditorProps> = ({ widgets, onChange, upsellProducts = [], fetchProductVariants, currency = 'R$' }) => {
  const sorted = [...widgets].sort((a, b) => a.position - b.position);

  const updateWidget = useCallback((id: string, updates: Partial<CartWidget>) => {
    onChange(widgets.map(w => w.id === id ? { ...w, ...updates } as CartWidget : w));
  }, [widgets, onChange]);

  const removeWidget = useCallback((id: string) => {
    onChange(widgets.filter(w => w.id !== id));
  }, [widgets, onChange]);

  const moveWidget = useCallback((id: string, direction: 'up' | 'down') => {
    const s = [...widgets].sort((a, b) => a.position - b.position);
    const idx = s.findIndex(w => w.id === id);
    if ((direction === 'up' && idx <= 0) || (direction === 'down' && idx >= s.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newWidgets = s.map((w, i) => {
      if (i === idx) return { ...w, position: swapIdx };
      if (i === swapIdx) return { ...w, position: idx };
      return { ...w, position: i };
    });
    onChange(newWidgets);
  }, [widgets, onChange]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('widget-id', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('widget-id');
    if (draggedId === targetId) return;
    const s = [...widgets].sort((a, b) => a.position - b.position);
    const fromIdx = s.findIndex(w => w.id === draggedId);
    const toIdx = s.findIndex(w => w.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...s];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    onChange(reordered.map((w, i) => ({ ...w, position: i })));
  };

  const addWidget = useCallback((type: CartWidget['type']) => {
    const id = `${type}_${Date.now()}`;
    const position = widgets.length;
    let newWidget: CartWidget;
    switch (type) {
      case 'banner':
        newWidget = { id, type: 'banner', enabled: true, position, banners: [{ id: `b${Date.now()}`, imageUrl: '', linkUrl: '', alt: 'Banner 1' }], borderRadius: '8px', autoSlide: false, autoSlideInterval: 4000 } as CartBannerWidget;
        break;
      case 'countdown':
        newWidget = { id, type: 'countdown', enabled: true, position, mode: 'session', sessionMinutes: 15, fixedDate: '', message: 'Oferta expira em:', expiredMessage: 'Oferta expirada!', style: { bgColor: '#1a1a2e', textColor: '#ffffff', numberColor: '#ffffff', numberBgColor: '#e94560' } } as CartCountdownWidget;
        break;
      case 'html':
        newWidget = { id, type: 'html', enabled: true, position, content: '<p>Seu conteúdo aqui</p>' } as CartHtmlWidget;
        break;
      case 'upsell':
        newWidget = { id, type: 'upsell', enabled: true, position, title: 'Você também pode gostar', products: [], style: { titleColor: '#ffffff', cardBgColor: '#1e1e2f', buttonBgColor: '#e94560', buttonTextColor: '#ffffff', buttonText: 'Adicionar', buttonBorderRadius: '8px' } } as CartUpsellWidget;
        break;
      default:
        return;
    }
    onChange([...widgets, newWidget]);
  }, [widgets, onChange]);

  const existingTypes = new Set(widgets.map(w => w.type));

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Arraste para reordenar. Widgets aparecem entre os itens e o footer do carrinho.
      </p>

      {sorted.map((widget, idx) => {
        const meta = widgetLabels[widget.type];
        const Icon = meta.icon;

        return (
          <div
            key={widget.id}
            draggable
            onDragStart={e => handleDragStart(e, widget.id)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, widget.id)}
            className="rounded-xl border border-border bg-secondary/50 overflow-hidden transition-colors"
          >
            {/* Widget header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1">{meta.label}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveWidget(widget.id, 'up')}
                  disabled={idx === 0}
                  className="p-0.5 rounded hover:bg-background disabled:opacity-30 text-muted-foreground"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveWidget(widget.id, 'down')}
                  disabled={idx === sorted.length - 1}
                  className="p-0.5 rounded hover:bg-background disabled:opacity-30 text-muted-foreground"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <Switch
                  checked={widget.enabled}
                  onCheckedChange={v => updateWidget(widget.id, { enabled: v })}
                  className="ml-1"
                />
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive ml-1"
                  title="Remover widget"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Widget config - shown when enabled */}
            {widget.enabled && (
              <div className="p-3 space-y-3 border-t border-border">
                {widget.type === 'banner' && <BannerConfig widget={widget} onUpdate={u => updateWidget(widget.id, u)} />}
                {widget.type === 'countdown' && <CountdownConfig widget={widget} onUpdate={u => updateWidget(widget.id, u)} />}
                {widget.type === 'html' && <HtmlConfig widget={widget} onUpdate={u => updateWidget(widget.id, u)} />}
                {widget.type === 'upsell' && <UpsellProductPicker widget={widget} onUpdate={u => updateWidget(widget.id, u)} upsellProducts={upsellProducts} fetchProductVariants={fetchProductVariants} currency={currency} />}
              </div>
            )}
          </div>
        );
      })}

      {/* Add widget buttons */}
      {(['banner', 'countdown', 'html', 'upsell'] as const).filter(t => !existingTypes.has(t)).length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-medium text-foreground">Adicionar Widget</p>
          <div className="grid grid-cols-2 gap-2">
            {(['banner', 'countdown', 'html', 'upsell'] as const)
              .filter(t => !existingTypes.has(t))
              .map(type => {
                const meta = widgetLabels[type];
                const Icon = meta.icon;
                return (
                  <Button key={type} variant="outline" size="sm" onClick={() => addWidget(type)} className="text-xs justify-start gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </Button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

// === Banner Config ===
const BannerConfig: React.FC<{ widget: CartBannerWidget; onUpdate: (u: Partial<CartBannerWidget>) => void }> = ({ widget, onUpdate }) => {
  const updateBanner = (idx: number, updates: Partial<CartBannerWidget['banners'][0]>) => {
    const banners = widget.banners.map((b, i) => i === idx ? { ...b, ...updates } : b);
    onUpdate({ banners });
  };

  const addBanner = () => {
    if (widget.banners.length >= 3) return;
    onUpdate({
      banners: [...widget.banners, { id: `b${Date.now()}`, imageUrl: '', linkUrl: '', alt: `Banner ${widget.banners.length + 1}` }],
    });
  };

  const removeBanner = (idx: number) => {
    if (widget.banners.length <= 1) return;
    onUpdate({ banners: widget.banners.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      {widget.banners.map((banner, idx) => (
        <div key={banner.id} className="space-y-2 p-2 rounded-lg bg-background border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Banner {idx + 1}</span>
            {widget.banners.length > 1 && (
              <button onClick={() => removeBanner(idx)} className="text-destructive hover:text-destructive/80">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <InputGroup label="URL da Imagem">
            <Input value={banner.imageUrl} onChange={e => updateBanner(idx, { imageUrl: e.target.value })} className="bg-secondary border-border text-xs" placeholder="https://..." />
          </InputGroup>
          <InputGroup label="Link (opcional)">
            <Input value={banner.linkUrl} onChange={e => updateBanner(idx, { linkUrl: e.target.value })} className="bg-secondary border-border text-xs" placeholder="https://..." />
          </InputGroup>
        </div>
      ))}

      {widget.banners.length < 3 && (
        <Button variant="outline" size="sm" onClick={addBanner} className="w-full text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Banner
        </Button>
      )}

      <InputGroup label="Border Radius">
        <Input value={widget.borderRadius} onChange={e => onUpdate({ borderRadius: e.target.value })} className="bg-secondary border-border" placeholder="8px" />
      </InputGroup>

      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground">Slide Automático</span>
        <Switch checked={widget.autoSlide} onCheckedChange={v => onUpdate({ autoSlide: v })} />
      </div>

      {widget.autoSlide && (
        <InputGroup label="Intervalo (ms)">
          <Input type="number" value={widget.autoSlideInterval} onChange={e => onUpdate({ autoSlideInterval: Number(e.target.value) })} className="bg-secondary border-border" />
        </InputGroup>
      )}
    </div>
  );
};

// === Countdown Config ===
const CountdownConfig: React.FC<{ widget: CartCountdownWidget; onUpdate: (u: Partial<CartCountdownWidget>) => void }> = ({ widget, onUpdate }) => (
  <div className="space-y-3">
    <InputGroup label="Modo">
      <Select value={widget.mode} onValueChange={v => onUpdate({ mode: v as 'fixed' | 'session' })}>
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="session">Timer por Sessão</SelectItem>
          <SelectItem value="fixed">Data/Hora Fixa</SelectItem>
        </SelectContent>
      </Select>
    </InputGroup>

    {widget.mode === 'fixed' ? (
      <InputGroup label="Data e Hora">
        <Input type="datetime-local" value={widget.fixedDate} onChange={e => onUpdate({ fixedDate: e.target.value })} className="bg-secondary border-border" />
      </InputGroup>
    ) : (
      <InputGroup label="Minutos">
        <Input type="number" value={widget.sessionMinutes} onChange={e => onUpdate({ sessionMinutes: Number(e.target.value) })} className="bg-secondary border-border" />
      </InputGroup>
    )}

    <InputGroup label="Mensagem">
      <Input value={widget.message} onChange={e => onUpdate({ message: e.target.value })} className="bg-secondary border-border" />
    </InputGroup>
    <InputGroup label="Mensagem ao Expirar">
      <Input value={widget.expiredMessage} onChange={e => onUpdate({ expiredMessage: e.target.value })} className="bg-secondary border-border" />
    </InputGroup>

    <ColorInput label="Fundo" value={widget.style.bgColor} onChange={v => onUpdate({ style: { ...widget.style, bgColor: v } })} />
    <ColorInput label="Texto" value={widget.style.textColor} onChange={v => onUpdate({ style: { ...widget.style, textColor: v } })} />
    <ColorInput label="Números" value={widget.style.numberColor} onChange={v => onUpdate({ style: { ...widget.style, numberColor: v } })} />
    <ColorInput label="Fundo dos Números" value={widget.style.numberBgColor} onChange={v => onUpdate({ style: { ...widget.style, numberBgColor: v } })} />
  </div>
);

// === HTML Config ===
const HtmlConfig: React.FC<{ widget: CartHtmlWidget; onUpdate: (u: Partial<CartHtmlWidget>) => void }> = ({ widget, onUpdate }) => (
  <div className="space-y-3">
    <ControlledInput
      label="Conteúdo HTML"
      value={widget.content}
      onChange={v => onUpdate({ content: v })}
      isTextArea
      rows={4}
      placeholder="<p>Seu HTML aqui...</p>"
    />
  </div>
);

export default CartWidgetEditor;
