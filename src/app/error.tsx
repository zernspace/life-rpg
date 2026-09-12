'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 text-center shadow-2xl">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-xl font-bold tracking-wide text-rose-400 mb-2">CRITICAL SYSTEM GLITCH</h2>
        <p className="text-sm text-slate-400 mb-6">
          A runtime interruption was intercepted. Your database state remains secure.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition"
        >
          <RefreshCw className="w-4 h-4" /> Reboot Interface
        </button>
      </div>
    </div>
  );
}
