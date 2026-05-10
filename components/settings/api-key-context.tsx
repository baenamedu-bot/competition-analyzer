'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiKeyModal } from './api-key-modal';
import { hasApiKey } from '@/lib/api-key-storage';

interface Ctx {
  open: () => void;
  ensureKey: () => boolean;
  hasKey: boolean;
}

const ApiKeyContext = createContext<Ctx | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [openState, setOpenState] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    setHasKey(hasApiKey());
    function handler() { setHasKey(hasApiKey()); }
    window.addEventListener('apikey:changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('apikey:changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const open = useCallback(() => setOpenState(true), []);
  const ensureKey = useCallback(() => {
    if (hasApiKey()) return true;
    setOpenState(true);
    return false;
  }, []);

  return (
    <ApiKeyContext.Provider value={{ open, ensureKey, hasKey }}>
      {children}
      <ApiKeyModal open={openState} onOpenChange={setOpenState} />
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error('useApiKey must be inside ApiKeyProvider');
  return ctx;
}
