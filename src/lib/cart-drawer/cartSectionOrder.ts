import { CartWidget } from './types';

export const BASE_CART_SECTION_IDS = ['freeShipping', 'items'] as const;

export const normalizeCartSectionOrder = (
  sectionOrder: string[] | undefined,
  widgets: CartWidget[] | undefined,
): string[] => {
  const widgetIds = [...(widgets || [])]
    .sort((a, b) => a.position - b.position)
    .map((widget) => widget.id);

  const validIds = new Set<string>([...BASE_CART_SECTION_IDS, ...widgetIds]);
  const normalized: string[] = [];

  for (const id of sectionOrder || BASE_CART_SECTION_IDS) {
    if (validIds.has(id) && !normalized.includes(id)) {
      normalized.push(id);
    }
  }

  if (!normalized.includes('freeShipping')) {
    normalized.unshift('freeShipping');
  }

  if (!normalized.includes('items')) {
    const freeShippingIndex = normalized.indexOf('freeShipping');
    normalized.splice(freeShippingIndex >= 0 ? freeShippingIndex + 1 : 0, 0, 'items');
  }

  for (const widgetId of widgetIds) {
    if (!normalized.includes(widgetId)) {
      normalized.push(widgetId);
    }
  }

  return normalized.filter((id) => validIds.has(id));
};