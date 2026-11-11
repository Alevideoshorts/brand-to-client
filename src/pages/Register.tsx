import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { supabase } from '../lib/supabase';

export default function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri.');
      return;
    }
    if (!accepted) {
      setError('Per continuare devi accettare la Privacy Policy.');
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: `${firstName.trim()} ${lastName.trim()}`.trim() },
        emailRedirectTo: `${window.location.origin}/attesa`,
      },
    });
    setBusy(false);
    if (err) {
      if (/registered|exists/i.test(err.message)) setError('Esiste già un account con questa email. Prova ad accedere.');
      else if (/password/i.test(err.message)) setError('La password non è abbastanza sicura: usa almeno 8 caratteri, con lettere e numeri.');
      else setError('Non è stato possibile creare l’account. Riprova tra qualche minuto.');
      return;
    }
    if (data.session) navigate('/attesa', { replace: true });
    else setCheckEmail(true);
  };

  if (checkEmail) {
    return (
      <AuthLayout title="Controlla la tua email" subtitle={`Ti abbiamo mandato un link di conferma a ${email}. Aprilo per attivare il tuo account, poi accedi.`}>
        <Link to="/accedi" className="btn btn-primary btn-block">Vai all’accesso</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crea il tuo account"
      subtitle="Registrati con la stessa email che hai usato per l’iscrizione. Appena il tuo accesso viene attivato, trovi qui il corso."
    >
      <form className="form" onSubmit={submit}>
        <div className="form-split">
          <label className="field">
            Nome
            <input type="text" autoComplete="given-name" required placeholder="Mario" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label className="field">
            Cognome
            <input type="text" autoComplete="family-name" required placeholder="Rossi" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
        </div>
        <label className="field">
          Email
          <input type="email" autoComplete="email" required placeholder="nome@email.it" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          Password
          <input type="password" autoComplete="new-password" required minLength={8} placeholder="Almeno 8 caratteri" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>
            Ho letto e accetto la{' '}
            <a className="link" href="https://www.brandtoclient.com/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>
          </span>
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creazione in corso…' : 'Crea account'}
        </button>
      </form>
      <p className="auth-switch">
        Hai già un account? <Link to="/accedi" className="link">Accedi</Link>
      </p>
    </AuthLayout>
  );
}
