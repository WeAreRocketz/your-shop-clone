import { useState, useEffect, useRef, useCallback } from 'react';

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  /** Data to watch for changes */
  data: T;
  /** Save function — receives the data to persist */
  onSave: (data: T) => void | Promise<void>;
  /** Debounce delay in ms (default: 2000) */
  debounceMs?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback on successful save */
  onSuccess?: () => void;
  /** Callback on save error */
  onError?: (error: unknown) => void;
}

interface UseAutoSaveReturn {
  /** Current auto-save status */
  status: AutoSaveStatus;
  /** Force an immediate save */
  saveNow: () => void;
  /** Force an immediate save and AWAIT its completion */
  flush: () => Promise<void>;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Mark current state as saved (e.g. after manual save) */
  markSaved: () => void;
}

/**
 * Auto-save hook with debounce, status tracking, and manual override.
 * 
 * Watches `data` for deep changes (via JSON serialization) and triggers
 * `onSave` after a configurable debounce period.
 */
export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 2000,
  enabled = true,
  onSuccess,
  onError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<T>(data);
  const initialDataRef = useRef<string>(JSON.stringify(data));
  const isFirstRender = useRef(true);
  const onSaveRef = useRef(onSave);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Keep refs fresh
  onSaveRef.current = onSave;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  dataRef.current = data;

  const executeSave = useCallback(async () => {
    setStatus('saving');
    try {
      await onSaveRef.current(dataRef.current);
      setStatus('saved');
      setHasUnsavedChanges(false);
      initialDataRef.current = JSON.stringify(dataRef.current);
      onSuccessRef.current?.();
      // Reset to idle after showing "saved" briefly
      setTimeout(() => setStatus('idle'), 1500);
    } catch (err) {
      setStatus('error');
      onErrorRef.current?.(err);
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, []);

  // Watch for data changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!enabled) return;

    const serialized = JSON.stringify(data);
    if (serialized === initialDataRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(true);
    setStatus('pending');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(executeSave, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, enabled, debounceMs, executeSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    executeSave();
  }, [executeSave]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await executeSave();
  }, [executeSave]);

  const markSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setStatus('saved');
    initialDataRef.current = JSON.stringify(dataRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => setStatus('idle'), 1500);
  }, []);

  return { status, saveNow, flush, hasUnsavedChanges, markSaved };
}
