import { useState } from 'react';
import { authAPI } from './api';

interface User {
  id: string;
  username: string;
  displayName: string;
}

interface Props {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await authAPI.login(username, password);
      } else {
        user = await authAPI.register(username, password, displayName || username);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', color: 'var(--text-main)',
      fontFamily: "'Cascadia Code', 'Fira Code', 'Segoe UI', monospace",
    }}>
      <style>{`
        :root {
          --bg: #1e1e1e; --bg-alt: #252526; --bg-card: #252526;
          --border: #3c3c3c; --border-subtle: #2d2d2d;
          --text-main: #d4d4d4; --text-dim: #999; --text-subtle: #666;
          --accent: #007acc; --hover: #2d2d2d;
          --shadow: 0 10px 30px rgba(0,0,0,.6);
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Cascadia Code', 'Fira Code', 'Segoe UI', monospace; }
        button, input { font-family: inherit; }
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <form onSubmit={submit} style={{
        width: 360, padding: 32, background: 'var(--bg-alt)',
        border: '1px solid var(--border)', borderRadius: 16,
        boxShadow: 'var(--shadow)', animation: 'fadeIn .3s ease-out',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #007acc, #0098ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>K</span>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.03em' }}>Kezban</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-dim)',
                fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
              }}>
              {m}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={username} onChange={e => setUsername(e.target.value)}
            placeholder="Username" autoFocus required
            style={{
              padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-main)', fontSize: 14, outline: 'none',
            }}
          />
          <input
            value={password} onChange={e => setPassword(e.target.value)}
            type="password" placeholder="Password" required
            style={{
              padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-main)', fontSize: 14, outline: 'none',
            }}
          />
          {mode === 'register' && (
            <input
              value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="Display Name (optional)"
              style={{
                padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text-main)', fontSize: 14, outline: 'none',
              }}
            />
          )}
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: '8px 12px', background: '#f4474722',
            color: '#f44747', fontSize: 12, borderRadius: 6, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', marginTop: 20, padding: '10px 0',
          background: loading ? 'var(--text-subtle)' : 'var(--accent)',
          border: 'none', borderRadius: 8, color: '#fff',
          fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
          transition: 'background .15s',
        }}>
          {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
