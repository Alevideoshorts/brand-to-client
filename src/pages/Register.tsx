import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { IconArrowRight } from '../components/Icons';
import { TERMS_VERSION } from '../lib/company';
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
      setError('Per continuare devi accettare i Termini di utilizzo e l’Informativa privacy.');
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: `${firstName.trim()} ${lastName.trim()}`.trim(), terms_version: TERMS_VERSION },
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
      <AuthLayout title="Controlla la tua email" subtitle={`Ti abbiamo mandato un link di conferma a ${email}. Aprilo per attivare il tuo account, poi entra.`}>
        <Link to="/accedi" className="btn btn-red btn-block">Vai all’accesso</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout wide title="Crea il tuo accesso" subtitle="Usa la stessa email dell’iscrizione: appena verifichiamo il tuo pagamento, il percorso si apre.">
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
            Ho letto e accetto i{' '}
            <a className="link" href="/termini" target="_blank" rel="noreferrer">Termini di utilizzo</a>
            {' '}e l’
            <a className="link" href="/privacy" target="_blank" rel="noreferrer">Informativa privacy</a>
          </span>
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-red btn-block" disabled={busy}>
          {busy ? 'Creazione…' : <>Crea l’accesso <IconArrowRight size={20} strokeWidth={2.4} /></>}
        </button>
      </form>
      <div className="auth-sep" />
      <p className="auth-switch">
        Hai già un accesso? <Link to="/accedi" className="link">Entra</Link>
      </p>
    </AuthLayout>
  );
}
