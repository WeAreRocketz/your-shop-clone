// @ts-nocheck
import React, { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { motion } from 'motion/react';
import { useAutoSave } from '@/hooks/useAutoSave';
import AutoSaveIndicator from './AutoSaveIndicator';
import { ArrowLeft, ShoppingCart, Palette, Type, MessageSquare, Truck, MousePointer2, Sparkles, LayoutGrid, Globe, Download, Upload } from 'lucide-react';
import { CartDrawerConfig, CartWidget, StoreLanguage, StoreCurrency, ShopifyProduct, ShopifyVariant, ShopifyProductOption, ShopifyVariantImage, STORE_LANGUAGES, STORE_CURRENCIES } from '@/lib/cart-drawer/types';
import { defaultCartDrawerConfig } from '@/lib/cart-drawer/defaults';
import { applyLocalizationToCartDrawer, getCurrencySymbol } from '@/lib/cart-drawer/localizationHelper';
import { normalizeCartSectionOrder } from '@/lib/cart-drawer/cartSectionOrder';
import { useShopify } from '@/contexts/ShopifyContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CartDrawerPreview from './CartDrawerPreview';
import CartWidgetEditor from './cart-widgets/CartWidgetEditor';
import CartSectionReorder from './cart-widgets/CartSectionReorder';
import ColorInput from './ColorInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showSuccess, showError } from '@/lib/cart-drawer/toast';

interface ProductVariantsData {
  options: ShopifyProductOption[];
  variants: ShopifyVariant[];
  images: ShopifyVariantImage[];
}

interface CartBuilderProps {
  onClose: () => void;
  onSave: (config: CartDrawerConfig) => void;
  onPublish?: (config: CartDrawerConfig) => Promise<boolean>;
  initialConfig?: CartDrawerConfig;
  onNavigateToProject?: () => void;
  language?: StoreLanguage;
  currency?: StoreCurrency;
  upsellProducts?: ShopifyProduct[];
  fetchProductVariants?: (shopifyProductId: string) => Promise<ProductVariantsData | null>;
  /** Extra controls rendered in the top bar (e.g. cart name + store install/uninstall). */
  topBarExtras?: React.ReactNode;
}

// Reusable section wrapper
const Section: React.FC<{ title: string; icon?: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      {title}
    </h3>
    <div className="space-y-3 pl-0.5">{children}</div>
  </div>
);

const InputGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const CartBuilder: React.FC<CartBuilderProps> = ({
  onClose,
  onSave,
  onPublish,
  initialConfig,
  onNavigateToProject,
  language: languageProp,
  currency: currencyProp,
  upsellProducts = [],
  fetchProductVariants,
  topBarExtras,
}) => {
  const { store, updateStoreLocalization } = useShopify();
  const language: StoreLanguage = (store?.language as StoreLanguage) || languageProp || 'pt-BR';
  const currency: StoreCurrency = (store?.currency as StoreCurrency) || currencyProp || 'BRL';
  const [isUpdatingLoc, setIsUpdatingLoc] = useState(false);

  const [config, setConfig] = useState<CartDrawerConfig>(() => {
    const initialWidgets = initialConfig?.widgets || defaultCartDrawerConfig.widgets || [];

    if (!initialConfig) return defaultCartDrawerConfig;

    return {
      ...defaultCartDrawerConfig,
      ...initialConfig,
      style: { ...defaultCartDrawerConfig.style, ...(initialConfig.style || {}) },
      header: { ...defaultCartDrawerConfig.header, ...(initialConfig.header || {}) },
      emptyCart: { ...defaultCartDrawerConfig.emptyCart, ...(initialConfig.emptyCart || {}) },
      quantityControls: { ...defaultCartDrawerConfig.quantityControls, ...(initialConfig.quantityControls || {}) },
      freeShipping: { ...defaultCartDrawerConfig.freeShipping, ...(initialConfig.freeShipping || {}) },
      checkoutButton: { ...defaultCartDrawerConfig.checkoutButton, ...(initialConfig.checkoutButton || {}) },
      continueButton: { ...defaultCartDrawerConfig.continueButton, ...(initialConfig.continueButton || {}) },
      animation: { ...defaultCartDrawerConfig.animation, ...(initialConfig.animation || {}) },
      widgets: initialWidgets,
      sectionOrder: normalizeCartSectionOrder(initialConfig.sectionOrder || defaultCartDrawerConfig.sectionOrder, initialWidgets),
    };
  });
  const [activeTab, setActiveTab] = useState('cores');
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialConfigRef = React.useRef(JSON.stringify(config));

  // Track any config change as unsaved
  React.useEffect(() => {
    if (JSON.stringify(config) !== initialConfigRef.current) {
      setHasUnsavedChanges(true);
    }
  }, [config]);

  // Auto-save
  const { status: autoSaveStatus, markSaved: markAutoSaved } = useAutoSave({
    data: config,
    onSave: (data) => {
      onSave(data);
      setHasUnsavedChanges(false);
    },
    debounceMs: 3000,
    enabled: hasUnsavedChanges,
  });

  const handleApplyTranslation = useCallback(() => {
    const currencySymbol = getCurrencySymbol(currency);
    const translated = applyLocalizationToCartDrawer(config, language, currencySymbol);
    setConfig(translated);
    setHasUnsavedChanges(true);
    showSuccess(`Tradução aplicada: ${language}`);
  }, [config, language, currency]);

  const handleLanguageChange = useCallback(async (lang: StoreLanguage) => {
    if (!store) return;
    setIsUpdatingLoc(true);
    try {
      await updateStoreLocalization(lang, currency);
      const symbol = getCurrencySymbol(currency);
      setConfig(prev => applyLocalizationToCartDrawer(prev, lang, symbol));
      setHasUnsavedChanges(true);
    } finally {
      setIsUpdatingLoc(false);
    }
  }, [store, currency, updateStoreLocalization]);

  const handleCurrencyChange = useCallback(async (curr: StoreCurrency) => {
    if (!store) return;
    setIsUpdatingLoc(true);
    try {
      await updateStoreLocalization(language, curr);
      const symbol = getCurrencySymbol(curr);
      setConfig(prev => applyLocalizationToCartDrawer(prev, language, symbol));
      setHasUnsavedChanges(true);
    } finally {
      setIsUpdatingLoc(false);
    }
  }, [store, language, updateStoreLocalization]);


  const updateConfig = useCallback(<K extends keyof CartDrawerConfig>(
    section: K,
    updates: Partial<CartDrawerConfig[K]>
  ) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section] as object, ...updates },
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = () => {
    onSave(config);
    setHasUnsavedChanges(false);
    markAutoSaved();
    showSuccess('Configurações do carrinho salvas!');
  };

  const handlePublish = async () => {
    if (!onPublish) return;
    setIsPublishing(true);
    try {
      // Save first, then publish
      onSave(config);
      await onPublish(config);
    } finally {
      setIsPublishing(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const payload = {
        type: 'ghozt-cart-config',
        version: 1,
        exportedAt: new Date().toISOString(),
        config,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cart-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Carrinho exportado!');
    } catch (e) {
      showError('Falha ao exportar carrinho');
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming: Partial<CartDrawerConfig> = parsed?.config && typeof parsed.config === 'object' ? parsed.config : parsed;
      if (!incoming || typeof incoming !== 'object') throw new Error('invalid');

      const widgets = (incoming.widgets as CartWidget[]) || defaultCartDrawerConfig.widgets || [];
      const merged: CartDrawerConfig = {
        ...defaultCartDrawerConfig,
        ...incoming,
        style: { ...defaultCartDrawerConfig.style, ...(incoming.style || {}) },
        header: { ...defaultCartDrawerConfig.header, ...(incoming.header || {}) },
        emptyCart: { ...defaultCartDrawerConfig.emptyCart, ...(incoming.emptyCart || {}) },
        quantityControls: { ...defaultCartDrawerConfig.quantityControls, ...(incoming.quantityControls || {}) },
        freeShipping: { ...defaultCartDrawerConfig.freeShipping, ...(incoming.freeShipping || {}) },
        checkoutButton: { ...defaultCartDrawerConfig.checkoutButton, ...(incoming.checkoutButton || {}) },
        continueButton: { ...defaultCartDrawerConfig.continueButton, ...(incoming.continueButton || {}) },
        animation: { ...defaultCartDrawerConfig.animation, ...(incoming.animation || {}) },
        widgets,
        sectionOrder: normalizeCartSectionOrder(incoming.sectionOrder || defaultCartDrawerConfig.sectionOrder, widgets),
      } as CartDrawerConfig;

      setConfig(merged);
      setHasUnsavedChanges(true);
      showSuccess('Carrinho importado! Lembre-se de salvar.');
    } catch {
      showError('Arquivo inválido. Selecione um JSON exportado do Cart Builder.');
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-y-2 px-4 md:px-6 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="glass-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-foreground" />
            <h1 className="text-lg font-bold text-foreground">Cart Builder</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end ml-auto">
          <AutoSaveIndicator status={autoSaveStatus} />
          {topBarExtras}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button variant="outline" onClick={handleImportClick} className="glass-button gap-1.5" title="Importar carrinho de um arquivo JSON">
            <Upload className="w-4 h-4" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExport} className="glass-button gap-1.5" title="Exportar carrinho para um arquivo JSON">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          {store?.is_connected && (
            <div className="flex items-center gap-1.5 border-l border-border pl-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Globe size={14} className="text-muted-foreground" />
                      <Select
                        value={language}
                        onValueChange={(v) => handleLanguageChange(v as StoreLanguage)}
                        disabled={isUpdatingLoc}
                      >
                        <SelectTrigger className="h-7 w-[85px] text-xs border-border bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {STORE_LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value} className="text-xs">
                              {lang.value.split('-')[0].toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Idioma do carrinho (aplica traduções padrão)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Select
                        value={currency}
                        onValueChange={(v) => handleCurrencyChange(v as StoreCurrency)}
                        disabled={isUpdatingLoc}
                      >
                        <SelectTrigger className="h-7 w-[80px] text-xs border-border bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {STORE_CURRENCIES.map((curr) => (
                            <SelectItem key={curr.value} value={curr.value} className="text-xs">
                              {curr.symbol} ({curr.value})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Moeda exibida no preview do carrinho</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          <Button variant="outline" onClick={handleApplyTranslation} className="glass-button gap-1.5" disabled={isUpdatingLoc}>
            <Globe className="w-4 h-4" />
            Traduzir ({language})
          </Button>

          <Button onClick={handleSave} variant="outline" className="glass-button">
            Salvar
          </Button>
          {onPublish && (
            <Button 
              onClick={handlePublish} 
              disabled={isPublishing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              {isPublishing ? 'Publicando...' : 'Publicar na Loja'}
            </Button>
          )}
        </div>
      </div>

      {/* Main area: sidebar + preview (Apple-style split, preview pinned to right half) */}
      <div className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[minmax(360px,42%)_1fr]">
        {/* Sidebar Controls */}
        <div className="min-h-0 overflow-y-auto border-r border-border bg-background">
          <div className="p-5 space-y-6 max-w-[460px] mx-auto">
            {/* Enable toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-foreground" />
                <span className="text-sm font-medium text-foreground">Cart Drawer Ativo</span>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-5 glass-panel h-auto p-1">
                <TabsTrigger value="cores" className="text-xs py-2 data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <Palette className="w-3.5 h-3.5 mr-1" />
                  Cores
                </TabsTrigger>
                <TabsTrigger value="textos" className="text-xs py-2 data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <Type className="w-3.5 h-3.5 mr-1" />
                  Textos
                </TabsTrigger>
                <TabsTrigger value="frete" className="text-xs py-2 data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <Truck className="w-3.5 h-3.5 mr-1" />
                  Frete
                </TabsTrigger>
                <TabsTrigger value="botoes" className="text-xs py-2 data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <MousePointer2 className="w-3.5 h-3.5 mr-1" />
                  Botões
                </TabsTrigger>
                <TabsTrigger value="widgets" className="text-xs py-2 data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <LayoutGrid className="w-3.5 h-3.5 mr-1" />
                  Widgets
                </TabsTrigger>
              </TabsList>

              {/* === CORES TAB === */}
              <TabsContent value="cores" className="space-y-6 mt-4">
                <Section title="Overlay & Drawer" icon={Palette}>
                  <InputGroup label="Cor do Overlay">
                    <Input
                      value={config.style.overlayColor}
                      onChange={e => updateConfig('style', { overlayColor: e.target.value })}
                      className="bg-secondary border-border text-xs font-mono"
                      placeholder="rgba(0, 0, 0, 0.5)"
                    />
                  </InputGroup>
                  <ColorInput
                    label="Fundo do Drawer"
                    value={config.style.drawerBgColor}
                    onChange={v => updateConfig('style', { drawerBgColor: v })}
                  />
                  <ColorInput
                    label="Cor dos Divisores"
                    value={config.style.dividerColor}
                    onChange={v => updateConfig('style', { dividerColor: v })}
                  />
                </Section>

                <Section title="Header" icon={Palette}>
                  <ColorInput
                    label="Fundo do Header"
                    value={config.style.headerBgColor}
                    onChange={v => updateConfig('style', { headerBgColor: v })}
                  />
                  <ColorInput
                    label="Texto do Header"
                    value={config.style.headerTextColor}
                    onChange={v => updateConfig('style', { headerTextColor: v })}
                  />
                </Section>

                <Section title="Itens do Carrinho" icon={Palette}>
                  <ColorInput
                    label="Fundo dos Itens"
                    value={config.style.itemBgColor}
                    onChange={v => updateConfig('style', { itemBgColor: v })}
                  />
                  <ColorInput
                    label="Texto dos Itens"
                    value={config.style.itemTextColor}
                    onChange={v => updateConfig('style', { itemTextColor: v })}
                  />
                  <ColorInput
                    label="Preço dos Itens"
                    value={config.style.itemPriceColor}
                    onChange={v => updateConfig('style', { itemPriceColor: v })}
                  />
                </Section>

                <Section title="Footer" icon={Palette}>
                  <ColorInput
                    label="Fundo do Footer"
                    value={config.style.footerBgColor}
                    onChange={v => updateConfig('style', { footerBgColor: v })}
                  />
                  <ColorInput
                    label="Cor do Subtotal"
                    value={config.style.subtotalColor}
                    onChange={v => updateConfig('style', { subtotalColor: v })}
                  />
                </Section>

                <Section title="Controles de Quantidade" icon={Palette}>
                  <ColorInput
                    label="Fundo do Botão"
                    value={config.quantityControls.buttonBgColor}
                    onChange={v => updateConfig('quantityControls', { buttonBgColor: v })}
                  />
                  <ColorInput
                    label="Texto do Botão"
                    value={config.quantityControls.buttonTextColor}
                    onChange={v => updateConfig('quantityControls', { buttonTextColor: v })}
                  />
                  <InputGroup label="Border Radius">
                    <Input
                      value={config.quantityControls.buttonBorderRadius}
                      onChange={e => updateConfig('quantityControls', { buttonBorderRadius: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="6px"
                    />
                  </InputGroup>
                </Section>

                <Section title="Badge de Bundle" icon={Palette}>
                  <InputGroup label="Texto (use {quantity})">
                    <Input
                      value={config.bundleBadge?.text ?? 'Kit {quantity}un'}
                      onChange={e => updateConfig('bundleBadge', { text: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="Kit {quantity}un"
                    />
                  </InputGroup>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Usar gradiente</span>
                    <Switch
                      checked={config.bundleBadge?.useGradient ?? true}
                      onCheckedChange={v => updateConfig('bundleBadge', { useGradient: v })}
                    />
                  </div>
                  {(config.bundleBadge?.useGradient ?? true) ? (
                    <>
                      <ColorInput
                        label="Gradiente - Cor inicial"
                        value={config.bundleBadge?.gradientFrom || '#7c3aed'}
                        onChange={v => updateConfig('bundleBadge', { gradientFrom: v })}
                      />
                      <ColorInput
                        label="Gradiente - Cor final"
                        value={config.bundleBadge?.gradientTo || '#a855f7'}
                        onChange={v => updateConfig('bundleBadge', { gradientTo: v })}
                      />
                    </>
                  ) : (
                    <ColorInput
                      label="Cor de Fundo"
                      value={config.bundleBadge?.backgroundColor || '#7c3aed'}
                      onChange={v => updateConfig('bundleBadge', { backgroundColor: v })}
                    />
                  )}
                  <ColorInput
                    label="Cor do Texto"
                    value={config.bundleBadge?.textColor || '#ffffff'}
                    onChange={v => updateConfig('bundleBadge', { textColor: v })}
                  />
                </Section>
              </TabsContent>

              {/* === TEXTOS TAB === */}
              <TabsContent value="textos" className="space-y-6 mt-4">
                <Section title="Header" icon={MessageSquare}>
                  <InputGroup label="Título do Carrinho">
                    <Input
                      value={config.header.title}
                      onChange={e => updateConfig('header', { title: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </InputGroup>
                  <InputGroup label="Tamanho da Fonte">
                    <Input
                      value={config.header.fontSize}
                      onChange={e => updateConfig('header', { fontSize: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="18px"
                    />
                  </InputGroup>
                  <InputGroup label="Peso da Fonte">
                    <Select
                      value={config.header.fontWeight}
                      onValueChange={v => updateConfig('header', { fontWeight: v })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="500">Medium</SelectItem>
                        <SelectItem value="600">Semibold</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </InputGroup>
                </Section>

                <Section title="Carrinho Vazio" icon={MessageSquare}>
                  <InputGroup label="Título">
                    <Input
                      value={config.emptyCart.title}
                      onChange={e => updateConfig('emptyCart', { title: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </InputGroup>
                  <InputGroup label="Subtítulo">
                    <Input
                      value={config.emptyCart.subtitle}
                      onChange={e => updateConfig('emptyCart', { subtitle: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </InputGroup>
                  <InputGroup label="Tamanho do Ícone">
                    <Input
                      value={config.emptyCart.iconSize}
                      onChange={e => updateConfig('emptyCart', { iconSize: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="48px"
                    />
                  </InputGroup>
                </Section>

                <Section title="Animação" icon={Sparkles}>
                  <InputGroup label="Tipo de Animação">
                    <Select
                      value={config.animation.type}
                      onValueChange={v => updateConfig('animation', { type: v as 'slide' | 'fade' })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="fade">Fade</SelectItem>
                      </SelectContent>
                    </Select>
                  </InputGroup>
                  <InputGroup label="Duração">
                    <Input
                      value={config.animation.duration}
                      onChange={e => updateConfig('animation', { duration: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="300ms"
                    />
                  </InputGroup>
                </Section>
              </TabsContent>

              {/* === FRETE TAB === */}
              <TabsContent value="frete" className="space-y-6 mt-4">
                <Section title="Frete Grátis" icon={Truck}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Barra de Progresso</span>
                    <Switch
                      checked={config.freeShipping.enabled}
                      onCheckedChange={v => updateConfig('freeShipping', { enabled: v })}
                    />
                  </div>

                  {config.freeShipping.enabled && (
                    <>
                      <InputGroup label="Valor Mínimo">
                        <Input
                          type="number"
                          value={config.freeShipping.threshold}
                          onChange={e => updateConfig('freeShipping', { threshold: Number(e.target.value) })}
                          className="bg-secondary border-border"
                        />
                      </InputGroup>
                      <InputGroup label="Moeda">
                        <Input
                          value={config.freeShipping.currency}
                          onChange={e => updateConfig('freeShipping', { currency: e.target.value })}
                          className="bg-secondary border-border"
                          placeholder="R$"
                        />
                      </InputGroup>
                      <InputGroup label="Mensagem (use {remaining})">
                        <Input
                          value={config.freeShipping.message}
                          onChange={e => updateConfig('freeShipping', { message: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </InputGroup>
                      <InputGroup label="Mensagem de Frete Grátis Atingido">
                        <Input
                          value={config.freeShipping.achievedMessage}
                          onChange={e => updateConfig('freeShipping', { achievedMessage: e.target.value })}
                          className="bg-secondary border-border"
                        />
                      </InputGroup>
                      <ColorInput
                        label="Cor da Barra de Progresso"
                        value={config.freeShipping.progressBarColor}
                        onChange={v => updateConfig('freeShipping', { progressBarColor: v })}
                      />
                      <ColorInput
                        label="Fundo da Barra"
                        value={config.freeShipping.progressBgColor}
                        onChange={v => updateConfig('freeShipping', { progressBgColor: v })}
                      />
                    </>
                  )}
                </Section>
              </TabsContent>

              {/* === BOTÕES TAB === */}
              <TabsContent value="botoes" className="space-y-6 mt-4">
                <Section title="Botão de Checkout" icon={MousePointer2}>
                  <InputGroup label="Texto">
                    <Input
                      value={config.checkoutButton.text}
                      onChange={e => updateConfig('checkoutButton', { text: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </InputGroup>
                  <ColorInput
                    label="Cor de Fundo"
                    value={config.checkoutButton.backgroundColor}
                    onChange={v => updateConfig('checkoutButton', { backgroundColor: v })}
                  />
                  <ColorInput
                    label="Cor do Texto"
                    value={config.checkoutButton.textColor}
                    onChange={v => updateConfig('checkoutButton', { textColor: v })}
                  />
                  <InputGroup label="Tamanho da Fonte">
                    <Input
                      value={config.checkoutButton.fontSize}
                      onChange={e => updateConfig('checkoutButton', { fontSize: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="16px"
                    />
                  </InputGroup>
                  <InputGroup label="Peso da Fonte">
                    <Select
                      value={config.checkoutButton.fontWeight}
                      onValueChange={v => updateConfig('checkoutButton', { fontWeight: v })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="500">Medium</SelectItem>
                        <SelectItem value="600">Semibold</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </InputGroup>
                  <InputGroup label="Border Radius">
                    <Input
                      value={config.checkoutButton.borderRadius}
                      onChange={e => updateConfig('checkoutButton', { borderRadius: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="8px"
                    />
                  </InputGroup>
                </Section>

                <Section title="Botão Continuar Comprando" icon={MousePointer2}>
                  <InputGroup label="Texto">
                    <Input
                      value={config.continueButton.text}
                      onChange={e => updateConfig('continueButton', { text: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </InputGroup>
                  <ColorInput
                    label="Cor do Texto"
                    value={config.continueButton.textColor}
                    onChange={v => updateConfig('continueButton', { textColor: v })}
                  />
                  <InputGroup label="Tamanho da Fonte">
                    <Input
                      value={config.continueButton.fontSize}
                      onChange={e => updateConfig('continueButton', { fontSize: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="14px"
                    />
                  </InputGroup>
                </Section>

                <Section title="Conteúdo abaixo do botão de compra" icon={Sparkles}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Ativar conteúdo personalizado</span>
                    <Switch
                      checked={config.footerCustomContent?.enabled ?? false}
                      onCheckedChange={v => updateConfig('footerCustomContent', { enabled: v })}
                    />
                  </div>

                  {config.footerCustomContent?.enabled && (
                    <>
                      <InputGroup label="Tipo">
                        <Select
                          value={config.footerCustomContent?.type || 'image'}
                          onValueChange={v => updateConfig('footerCustomContent', { type: v as 'image' | 'html' })}
                        >
                          <SelectTrigger className="bg-secondary border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="image">Imagem</SelectItem>
                            <SelectItem value="html">HTML / Liquid</SelectItem>
                          </SelectContent>
                        </Select>
                      </InputGroup>

                      {(config.footerCustomContent?.type || 'image') === 'image' ? (
                        <>
                          <InputGroup label="URL da Imagem">
                            <Input
                              value={config.footerCustomContent?.imageUrl || ''}
                              onChange={e => updateConfig('footerCustomContent', { imageUrl: e.target.value })}
                              className="bg-secondary border-border"
                              placeholder="https://..."
                            />
                          </InputGroup>
                          <InputGroup label="Texto Alternativo (alt)">
                            <Input
                              value={config.footerCustomContent?.imageAlt || ''}
                              onChange={e => updateConfig('footerCustomContent', { imageAlt: e.target.value })}
                              className="bg-secondary border-border"
                              placeholder="Selos de segurança"
                            />
                          </InputGroup>
                          <InputGroup label="Link (opcional)">
                            <Input
                              value={config.footerCustomContent?.imageLinkUrl || ''}
                              onChange={e => updateConfig('footerCustomContent', { imageLinkUrl: e.target.value })}
                              className="bg-secondary border-border"
                              placeholder="https://..."
                            />
                          </InputGroup>
                        </>
                      ) : (
                        <InputGroup label="HTML / Liquid">
                          <textarea
                            value={config.footerCustomContent?.html || ''}
                            onChange={e => updateConfig('footerCustomContent', { html: e.target.value })}
                            className="w-full min-h-[120px] rounded-md bg-secondary border border-border text-sm font-mono p-2 text-foreground"
                            placeholder="<div>Compra 100% segura</div>"
                          />
                        </InputGroup>
                      )}

                      <InputGroup label="Alinhamento">
                        <Select
                          value={config.footerCustomContent?.align || 'center'}
                          onValueChange={v => updateConfig('footerCustomContent', { align: v as 'left' | 'center' | 'right' })}
                        >
                          <SelectTrigger className="bg-secondary border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="left">Esquerda</SelectItem>
                            <SelectItem value="center">Centro</SelectItem>
                            <SelectItem value="right">Direita</SelectItem>
                          </SelectContent>
                        </Select>
                      </InputGroup>

                      <div className="grid grid-cols-2 gap-2">
                        <InputGroup label="Margem Superior">
                          <Input
                            value={config.footerCustomContent?.marginTop || '12px'}
                            onChange={e => updateConfig('footerCustomContent', { marginTop: e.target.value })}
                            className="bg-secondary border-border"
                            placeholder="12px"
                          />
                        </InputGroup>
                        <InputGroup label="Margem Inferior">
                          <Input
                            value={config.footerCustomContent?.marginBottom || '0px'}
                            onChange={e => updateConfig('footerCustomContent', { marginBottom: e.target.value })}
                            className="bg-secondary border-border"
                            placeholder="0px"
                          />
                        </InputGroup>
                      </div>
                    </>
                  )}
                </Section>
              </TabsContent>

              {/* === WIDGETS TAB === */}
              <TabsContent value="widgets" className="space-y-6 mt-4" data-tour="tour-cart-sections">
                <CartSectionReorder
                  sectionOrder={config.sectionOrder || ['freeShipping', 'items']}
                  onChange={(order) => setConfig(prev => ({ ...prev, sectionOrder: order }))}
                  widgetEnabledMap={Object.fromEntries((config.widgets || []).map(w => [w.id, w.enabled]))}
                  freeShippingEnabled={config.freeShipping.enabled}
                  lastSectionPosition={config.lastSectionPosition || 'with-items'}
                  onLastSectionPositionChange={(pos) => setConfig(prev => ({ ...prev, lastSectionPosition: pos }))}
                />

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Configuração dos Widgets</h3>
                  <CartWidgetEditor
                    widgets={config.widgets || []}
                    onChange={(widgets: CartWidget[]) => setConfig(prev => ({
                      ...prev,
                      widgets,
                      sectionOrder: normalizeCartSectionOrder(prev.sectionOrder, widgets),
                    }))}
                    upsellProducts={upsellProducts}
                    fetchProductVariants={fetchProductVariants}
                    currency={config.freeShipping?.currency || 'R$'}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Preview Area — pinned, centered, fills its half independently of the editor */}
        <div
          className="relative hidden lg:flex min-h-0 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--color-foreground)_6%,transparent),transparent_70%),linear-gradient(to_bottom_right,color-mix(in_oklab,var(--color-muted)_50%,transparent),color-mix(in_oklab,var(--color-background)_100%,transparent))] p-10"
          data-tour="tour-cart-preview"
        >
          <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklab,var(--color-foreground)_8%,transparent)_1px,transparent_0)] [background-size:22px_22px] opacity-40" />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[min(86vh,760px)] w-full max-w-[440px] drop-shadow-[0_40px_80px_-30px_color-mix(in_oklab,var(--color-foreground)_45%,transparent)]"
          >
            <CartDrawerPreview config={config} language={language} />
          </motion.div>
        </div>
        {/* Mobile fallback preview (stacked) */}
        <div className="flex lg:hidden items-center justify-center bg-muted/30 p-6">
          <div className="h-[600px] w-full max-w-[420px]">
            <CartDrawerPreview config={config} language={language} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartBuilder;