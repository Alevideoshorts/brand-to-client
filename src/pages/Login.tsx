import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      if (/confirm/i.test(err.message)) setError('Devi prima confermare la tua email: controlla la posta (anche lo spam).');
      else setError('Email o password non corretti.');
      return;
    }
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from && from !== '/accedi' ? from : '/', { replace: true });
  };

  return (
    <AuthLayout title="Accedi alla piattaforma" subtitle="Lezioni, call di gruppo e community in un unico posto.">
      <form className="form" onSubmit={submit}>
        <label className="field">
          Email
          <input type="email" autoComplete="email" required placeholder="nome@email.it" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          Password
          <input type="password" autoComplete="current-password" required placeholder="La tua password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <div className="form-row-end">
          <Link to="/password-dimenticata" className="link">Password dimenticata?</Link>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Accesso in corso…' : 'Accedi'}
        </button>
      </form>
      <p className="auth-switch">
        Non hai un account? <Link to="/registrati" className="link">Registrati</Link>
      </p>
    </AuthLayout>
  );
}
