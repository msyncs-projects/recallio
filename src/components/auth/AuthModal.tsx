'use client';

import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Cloud,
  HardDrive,
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useRem } from '@/context/RemContext';
import { RecallioLogo } from '@/components/ui/RecallioLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, syncWithCloud } = useRem();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showDbGuide, setShowDbGuide] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Anmeldung fehlgeschlagen.');
          setErrorCode(res.code || null);
          setLoading(false);
          return;
        }
        setSuccessMessage('Erfolgreich angemeldet! Notizen werden synchronisiert...');
      } else {
        const res = await register(name, email, password);
        if (!res.success) {
          setError(res.error || 'Registrierung fehlgeschlagen.');
          setErrorCode(res.code || null);
          setLoading(false);
          return;
        }
        setSuccessMessage('Konto erfolgreich erstellt! Willkommen bei Recallio.');
      }

      // Sync cloud data
      await syncWithCloud();

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten');
      setLoading(false);
    }
  };

  const isDbError = errorCode === 'DATABASE_UNAVAILABLE' || (error && error.includes('DATABASE_URL'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <RecallioLogo size={32} />
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                {mode === 'signin' ? 'Willkommen zurück' : 'Konto erstellen'}
              </h2>
              <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-indigo-500" />
                <span>Cloud PostgreSQL & Multi-Device Sync</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setErrorCode(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setErrorCode(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Registrieren
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>

            {/* If database is unavailable, provide seamless Local-First alternative & guide */}
            {isDbError && (
              <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Möchtest du Recallio ohne Cloud-Konto nutzen?
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shrink-0"
                  >
                    Als Gast fortfahren
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDbGuide(!showDbGuide)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:underline"
                >
                  <Database className="w-3 h-3" />
                  <span>Wie hinterlege ich DATABASE_URL in Vercel?</span>
                  {showDbGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showDbGuide && (
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/80 text-[11px] text-zinc-700 dark:text-zinc-300 space-y-1.5 border border-rose-100 dark:border-rose-900/40">
                    <p className="font-semibold text-zinc-900 dark:text-white">In 3 Schritten Cloud-Sync aktivieren:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Öffne das Vercel Dashboard deines Projekts <strong>recallio</strong>.</li>
                      <li>Gehe auf <strong>Settings &rarr; Environment Variables</strong>.</li>
                      <li>Füge <code>DATABASE_URL</code> mit deinem PostgreSQL-Verbindungsstring hinzu (z. B. von Prisma Postgres, Neon oder Supabase).</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Vollständiger Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              E-Mail-Adresse
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Passwort
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-pulse">Wird verarbeitet...</span>
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>In Cloud-Konto einloggen</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cloud-Konto erstellen</span>
              </>
            )}
          </button>
        </form>

        {/* Local-First Guest button */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
            <span>Als Gast fortfahren (Lokaler IndexedDB Speicher)</span>
          </button>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Deine Notizen, Karteikarten und Lernstatistiken bleiben immer sicher und blitzschnell lokal in deinem Browser gespeichert.
          </p>
        </div>
      </div>
    </div>
  );
};
