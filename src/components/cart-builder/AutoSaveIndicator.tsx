// @ts-nocheck
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Check, AlertCircle, Cloud } from 'lucide-react';
import { AutoSaveStatus } from '@/hooks/useAutoSave';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  className?: string;
}

const statusConfig: Record<AutoSaveStatus, { icon: React.ElementType; label: string; color: string }> = {
  idle: { icon: Cloud, label: '', color: 'text-muted-foreground' },
  pending: { icon: Cloud, label: 'Alterações pendentes...', color: 'text-muted-foreground' },
  saving: { icon: Loader2, label: 'Salvando...', color: 'text-primary' },
  saved: { icon: Check, label: 'Salvo', color: 'text-emerald-500' },
  error: { icon: AlertCircle, label: 'Erro ao salvar', color: 'text-destructive' },
};

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ status, className = '' }) => {
  if (status === 'idle') return null;

  const { icon: Icon, label, color } = statusConfig[status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className={`flex items-center gap-1.5 text-xs ${color} ${className}`}
      >
        <Icon className={`w-3.5 h-3.5 ${status === 'saving' ? 'animate-spin' : ''}`} />
        <span>{label}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(AutoSaveIndicator);
