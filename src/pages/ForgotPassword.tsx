import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nuova-password`,
    });
    setBusy(false);
    if (err) {
      setError('Non è stato possibile inviare l’email. Riprova tra qualche minuto.');
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout backTo="/accedi" title="Email inviata" subtitle={`Se ${email} è registrata, riceverai un link per scegliere una nuova password. Controlla anche lo spam.`}>
        <Link to="/accedi" className="btn btn-red btn-block">Torna all’accesso</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout backTo="/accedi" title="Password dimenticata" subtitle="Inserisci la tua email: ti mandiamo un link per sceglierne una nuova.">
      <form className="form" onSubmit={submit}>
        <label className="field">
          Email
          <input type="email" autoComplete="email" required placeholder="nome@email.it" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-red btn-block" disabled={busy}>
          {busy ? 'Invio in corso…' : 'Invia il link'}
        </button>
      </form>
      <p className="auth-switch">
        <Link to="/accedi" className="link">Torna all’accesso</Link>
      </p>
    </AuthLayout>
  );
}
