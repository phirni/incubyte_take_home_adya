import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import type { Session } from '../types';

export default function AuthScreen({ onAuth, onGuest, notice }: { onAuth: (s: Session) => void; onGuest: () => void; notice: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const fn = isRegister ? api.register : api.login;
      onAuth(await fn(email.trim(), password));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-4 py-10 md:grid-cols-2">
      <div>
        <p className="font-display text-7xl font-bold leading-none tracking-wide sm:text-8xl">Garage</p>
        <p className="mt-4 max-w-sm text-dim">
          Browse the dealership’s vehicles, check what’s in stock, and buy one. Admins manage the inventory.
        </p>
      </div>

      <form onSubmit={submit} className="border border-rail bg-panel p-6" noValidate>
        <h1 className="font-display text-3xl font-semibold">{isRegister ? 'Create account' : 'Sign in'}</h1>
        {notice && <p role="status" className="mt-3 text-sm text-amber">{notice}</p>}

        <label className="mt-5 block text-sm text-dim" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required className="field mt-1"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="mt-4 block text-sm text-dim" htmlFor="password">
          Password{isRegister && ' (8 characters or more)'}
        </label>
        <input id="password" type="password" required minLength={isRegister ? 8 : undefined}
          autoComplete={isRegister ? 'new-password' : 'current-password'} className="field mt-1"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <p role="alert" className="mt-4 text-sm text-bad">{error}</p>}

        <button className="btn btn-primary mt-6 w-full" disabled={busy || !email || !password}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>
        <button type="button" className="mt-4 text-sm text-dim underline underline-offset-4 hover:text-chalk"
          onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}>
          {isRegister ? 'Have an account? Sign in' : 'New here? Create an account'}
        </button>
        <div className="my-5 border-t border-rail" />
        <button type="button" className="btn w-full" onClick={onGuest}>Continue as guest</button>
        <p className="mt-2 text-xs text-dim">Preview sample inventory. Sign in to purchase or manage vehicles.</p>
      </form>
    </main>
  );
}
