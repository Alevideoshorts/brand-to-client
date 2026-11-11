import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError('Non è stato possibile aggiornare la password. Richiedi un nuovo link.');
      return;
    }
    navigate('/', { replace: true });
  };

  if (!loading && !session) {
    return (
      <AuthLayout title="Link scaduto" subtitle="Il link per reimpostare la password non è più valido. Richiedine uno nuovo.">
        <Link to="/password-dimenticata" className="btn btn-primary btn-block">Richiedi un nuovo link</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Scegli una nuova password" subtitle="Usa almeno 8 caratteri.">
      <form className="form" onSubmit={submit}>
        <label className="field">
          Nuova password
          <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || loading}>
          {busy ? 'Salvataggio…' : 'Salva la nuova password'}
        </button>
      </form>
    </AuthLayout>
  );
}
