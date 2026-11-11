import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import { IconArrowRight } from '../components/Icons';
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
    <AuthLayout title="Entra nel tuo percorso" subtitle="Usa l’email con cui ti sei iscritto a Brand To Client.">
      <form className="form" onSubmit={submit}>
        <label className="field">
          Email
          <input type="email" autoComplete="email" required placeholder="nome@email.it" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          Password
          <PasswordInput autoComplete="current-password" required placeholder="La tua password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-red btn-block" disabled={busy}>
          {busy ? 'Accesso…' : <>Entra <IconArrowRight size={20} strokeWidth={2.4} /></>}
        </button>
        <Link to="/password-dimenticata" className="link auth-forgot">Hai dimenticato la password?</Link>
      </form>
      <div className="auth-sep" />
      <p className="auth-switch">
        Prima volta qui? <Link to="/registrati" className="link">Crea il tuo account</Link>
      </p>
    </AuthLayout>
  );
}
