// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface ControlledInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

/** Input that keeps local state and flushes onChange on blur or after debounce. */
const ControlledInput: React.FC<ControlledInputProps> = ({ value, onChange, debounceMs = 400, ...rest }) => {
  const [local, setLocal] = useState(value);

  useEffect(() => { setLocal(value); }, [value]);

  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(t);
  }, [local, value, onChange, debounceMs]);

  return (
    <Input
      {...rest}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => { if (local !== value) onChange(local); rest.onBlur?.(e); }}
    />
  );
};

export default ControlledInput;