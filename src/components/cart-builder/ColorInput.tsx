// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorInputProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

const ColorInput: React.FC<ColorInputProps> = ({ value, onChange, label, className, theme = 'dark' }) => {
  const isDark = theme === 'dark';

  const normalizeToHex6 = useCallback((color: string): string => {
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color.toLowerCase();

    const match3 = color.match(/^#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/);
    if (match3) {
      return `#${match3[1]}${match3[1]}${match3[2]}${match3[2]}${match3[3]}${match3[3]}`.toLowerCase();
    }

    try {
      const ctx = document.createElement('canvas').getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        return ctx.fillStyle.toLowerCase();
      }
    } catch {
      return '#000000';
    }

    return '#000000';
  }, []);

  const isValidColor = useCallback((color: string): boolean => {
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color) || /^rgb/i.test(color) || /^[a-z]+$/i.test(color);
  }, []);

  const normalizedValue = useMemo(() => normalizeToHex6(value), [value, normalizeToHex6]);
  const [isOpen, setIsOpen] = useState(false);
  const [draftColor, setDraftColor] = useState(normalizedValue);
  const [inputValue, setInputValue] = useState(normalizedValue);

  const syncFromValue = useCallback(() => {
    setDraftColor(normalizedValue);
    setInputValue(normalizedValue);
  }, [normalizedValue]);

  useEffect(() => {
    if (!isOpen) {
      syncFromValue();
    }
  }, [isOpen, syncFromValue]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      syncFromValue();
      setIsOpen(true);
      return;
    }

    syncFromValue();
    setIsOpen(false);
  }, [syncFromValue]);

  const handlePickerUpdate = useCallback((event: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
    const nextValue = normalizeToHex6((event.target as HTMLInputElement).value);
    setDraftColor(nextValue);
    setInputValue(nextValue);
  }, [normalizeToHex6]);

  const handleTextInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);

    if (isValidColor(nextValue)) {
      setDraftColor(normalizeToHex6(nextValue));
    }
  }, [isValidColor, normalizeToHex6]);

  const handleTextInputBlur = useCallback(() => {
    if (isValidColor(inputValue)) {
      const normalized = normalizeToHex6(inputValue);
      setDraftColor(normalized);
      setInputValue(normalized);
      return;
    }

    setInputValue(draftColor);
  }, [draftColor, inputValue, isValidColor, normalizeToHex6]);

  const commitColor = useCallback(() => {
    const nextColor = isValidColor(inputValue) ? normalizeToHex6(inputValue) : draftColor;
    setDraftColor(nextColor);
    setInputValue(nextColor);

    if (nextColor !== normalizedValue) {
      onChange(nextColor);
    }

    setIsOpen(false);
  }, [draftColor, inputValue, isValidColor, normalizeToHex6, normalizedValue, onChange]);

  const cancelChanges = useCallback(() => {
    syncFromValue();
    setIsOpen(false);
  }, [syncFromValue]);

  const handleTextInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitColor();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelChanges();
    }
  }, [cancelChanges, commitColor]);

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className={cn('text-xs font-medium block', isDark ? 'text-muted-foreground' : 'text-muted-foreground')}>
          {label}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors',
              isDark
                ? 'border-border bg-background/40 hover:bg-accent/40'
                : 'border-border bg-background hover:bg-accent/40'
            )}
          >
            <span
              className={cn('h-8 w-8 shrink-0 rounded-md border border-border')}
              style={{ backgroundColor: normalizedValue }}
            />
            <span className="min-w-0 truncate text-xs text-foreground">{normalizedValue}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-72 space-y-3 border-border bg-background p-3 text-foreground">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 shrink-0 rounded-xl border border-border"
              style={{ backgroundColor: draftColor }}
            />

            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Cor</p>
              <input
                type="text"
                value={inputValue}
                onChange={handleTextInputChange}
                onBlur={handleTextInputBlur}
                onKeyDown={handleTextInputKeyDown}
                placeholder="#282828"
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
                  isDark
                    ? 'border-border bg-background text-foreground placeholder:text-muted-foreground'
                    : 'border-border bg-background text-foreground placeholder:text-muted-foreground'
                )}
              />
            </div>
          </div>

          <input
            type="color"
            value={draftColor}
            onInput={handlePickerUpdate}
            onChange={handlePickerUpdate}
            className="h-11 w-full cursor-pointer rounded-md border border-border bg-background p-1"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancelChanges}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={commitColor}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Aplicar
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ColorInput;
