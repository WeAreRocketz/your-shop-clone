// @ts-nocheck
// Stub modal — wire to real product fetching when integrating with a store.
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ShopifyProduct } from '@/lib/cart-drawer/types';

interface ProductSelectorModalProps {
  open: boolean;
  onClose: () => void;
  products?: ShopifyProduct[];
  onSelect: (product: ShopifyProduct) => void;
}

const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({ open, onClose, products = [], onSelect }) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Selecionar produto</DialogTitle>
      </DialogHeader>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum produto disponível.</p>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {products.map((p) => (
            <li key={p.id}>
              <Button variant="ghost" className="w-full justify-start" onClick={() => { onSelect(p); onClose(); }}>
                {p.title}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </DialogContent>
  </Dialog>
);

export default ProductSelectorModal;