import { useState } from 'react';
import { LogOut } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import Garage from './components/Garage';
import type { Session } from './types';

const KEY = 'garage.session';

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(load);
  const [guest, setGuest] = useState(false);
  const [authNotice, setAuthNotice] = useState('');

  const signIn = (s: Session) => {
    localStorage.setItem(KEY, JSON.stringify(s));
    setAuthNotice('');
    setSession(s);
  };
  const signOut = (notice = '') => {
    localStorage.removeItem(KEY);
    setAuthNotice(notice);
    setSession(null);
    setGuest(false);
  };

  if (!session && !guest) return <AuthScreen onAuth={signIn} onGuest={() => setGuest(true)} notice={authNotice} />;

  return (
    <div className="min-h-screen">
      <header className="border-b border-rail">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <h1 className="font-display text-3xl font-bold tracking-wide">Garage</h1>
          <div className="flex items-center gap-3 text-sm">
            {guest ? <span className="border border-amber px-2 py-0.5 text-amber">Guest preview</span> : <span className="hidden text-dim sm:inline">{session!.user.email}</span>}
            {!guest && session!.user.role === 'ADMIN' && (
              <span className="border border-amber px-2 py-0.5 text-amber">Admin</span>
            )}
            <button className="btn" onClick={() => guest ? setGuest(false) : signOut()}>
              <LogOut size={16} aria-hidden /> {guest ? 'Exit preview' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>
      <Garage
        token={session?.token ?? ''}
        isAdmin={session?.user.role === 'ADMIN'}
        guest={guest}
        onExpired={() => signOut('Your session expired. Sign in again.')}
      />
    </div>
  );
}
