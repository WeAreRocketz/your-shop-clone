// @ts-nocheck
// Minimal stub for the cart-builder ported from Ghozt. Returns no products /
// no fetch capability — callers may pass real implementations via props.
import React, { createContext, useContext } from 'react';
import type { ShopifyProduct } from '@/lib/cart-drawer/types';

interface ShopifyContextValue {
  products: ShopifyProduct[];
  fetchProductVariants: ((shopifyProductId: string) => Promise<any>) | null;
  store: any | null;
  updateStoreLocalization: (input: { language?: string; currency?: string }) => void;
}

const ShopifyContext = createContext<ShopifyContextValue>({
  products: [],
  fetchProductVariants: null,
  store: null,
  updateStoreLocalization: () => {},
});

export const ShopifyProvider: React.FC<{ value?: Partial<ShopifyContextValue>; children: React.ReactNode }> = ({ value, children }) => (
  <ShopifyContext.Provider value={{ products: [], fetchProductVariants: null, store: null, updateStoreLocalization: () => {}, ...value }}>
    {children}
  </ShopifyContext.Provider>
);

export function useShopify() {
  return useContext(ShopifyContext);
}