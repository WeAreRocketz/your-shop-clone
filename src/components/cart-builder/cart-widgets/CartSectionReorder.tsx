// @ts-nocheck
import React from 'react';
import { GripVertical, ChevronUp, ChevronDown, Truck, ShoppingCart, Image, Timer, Code, ShoppingBag, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface CartSectionReorderProps {
  sectionOrder: string[];
  onChange: (order: string[]) => void;
  widgetEnabledMap: Record<string, boolean>;
  freeShippingEnabled: boolean;
  lastSectionPosition?: 'with-items' | 'with-footer';
  onLastSectionPositionChange?: (position: 'with-items' | 'with-footer') => void;
}

const sectionMeta: Record<string, { label: string; icon: React.ElementType }> = {
  freeShipping: { label: 'Frete Grátis', icon: Truck },
  items: { label: 'Itens do Carrinho', icon: ShoppingCart },
};

const widgetTypeMeta: Record<string, { label: string; icon: React.ElementType }> = {
  banner: { label: 'Banner Slider', icon: Image },
  countdown: { label: 'Contador', icon: Timer },
  html: { label: 'HTML Customizado', icon: Code },
  upsell: { label: 'Upsell', icon: ShoppingBag },
};

const getSectionMeta = (sectionId: string) => {
  if (sectionMeta[sectionId]) {
    return sectionMeta[sectionId];
  }

  const widgetType = Object.keys(widgetTypeMeta).find((type) => sectionId.startsWith(type));
  return widgetType ? widgetTypeMeta[widgetType] : { label: sectionId, icon: Code };
};

const CartSectionReorder: React.FC<CartSectionReorderProps> = ({
  sectionOrder,
  onChange,
  widgetEnabledMap,
  freeShippingEnabled,
  lastSectionPosition = 'with-items',
  onLastSectionPositionChange,
}) => {
  const move = (idx: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sectionOrder.length) return;
    const newOrder = [...sectionOrder];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    onChange(newOrder);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('section-idx', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData('section-idx'));
    if (isNaN(fromIdx) || fromIdx === targetIdx) return;
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    onChange(newOrder);
  };

  const isActive = (id: string) => {
    if (id === 'freeShipping') return freeShippingEnabled;
    if (id === 'items') return true;
    return widgetEnabledMap[id] ?? false;
  };

  // Find last active section index
  let lastActiveIdx = -1;
  sectionOrder.forEach((id, idx) => {
    if (isActive(id)) lastActiveIdx = idx;
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Ordem das Seções</h3>
      <p className="text-xs text-muted-foreground">
        Arraste ou use as setas para reordenar as seções do carrinho. Seções desativadas aparecem esmaecidas.
      </p>

      <div className="space-y-1.5">
        {sectionOrder.map((sectionId, idx) => {
          const meta = getSectionMeta(sectionId);
          const Icon = meta.icon;
          const active = isActive(sectionId);
          const isLast = idx === lastActiveIdx && active;

          return (
            <div
              key={sectionId}
              draggable
              onDragStart={e => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                active
                  ? 'bg-secondary border-border'
                  : 'bg-secondary/30 border-border/50 opacity-50'
              }`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1">{meta.label}</span>
              {isLast && lastSectionPosition === 'with-footer' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">Fixo</span>
              )}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => move(idx, 'up')}
                  disabled={idx === 0}
                  className="p-0.5 rounded hover:bg-background disabled:opacity-30 text-muted-foreground"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => move(idx, 'down')}
                  disabled={idx === sectionOrder.length - 1}
                  className="p-0.5 rounded hover:bg-background disabled:opacity-30 text-muted-foreground"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last section position toggle */}
      {onLastSectionPositionChange && lastActiveIdx >= 0 && (
        <div className="mt-3 p-3 rounded-lg border border-border bg-secondary/30 space-y-2">
          <p className="text-xs font-medium text-foreground">Posição do último item ativo</p>
          <div className="flex gap-2">
            <button
              onClick={() => onLastSectionPositionChange('with-items')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                lastSectionPosition === 'with-items'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-secondary'
              }`}
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              Com os produtos
            </button>
            <button
              onClick={() => onLastSectionPositionChange('with-footer')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                lastSectionPosition === 'with-footer'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-secondary'
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Colado ao subtotal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartSectionReorder;
