import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { IconCheck } from '../components/Icons';
import { isMember, useAuth } from '../lib/auth';
import { useSettings } from '../lib/data';

export default function Pending() {
  const { profile, refreshProfile, signOut } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const months = Math.max(1, parseInt(settings.call_months, 10) || 3);

  // Controlla da solo ogni 30 secondi se l'accesso è stato sbloccato.
  useEffect(() => {
    const t = window.setInterval(() => refreshProfile(), 30000);
    return () => window.clearInterval(t);
  }, [refreshProfile]);

  if (isMember(profile)) return <Navigate to="/" replace />;

  const blocked = profile?.status === 'blocked';

  const check = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

  const logout = async () => {
    await signOut();
    navigate('/accedi');
  };

  return (
    <div className="auth">
      <img className="auth-bg" src="/cover.jpg" alt="" />
      <div className="auth-card wide">
        <div className="auth-head">
          <img src="/logo.png" alt="Logo InfoFormatVirale" width={64} height={64} style={{ borderRadius: '50%' }} />
          <span className="eyebrow"><span className="eyebrow-dot" />{blocked ? 'Accesso sospeso' : 'Accesso in attivazione'}</span>
          <h1 className="pending-title">{blocked ? 'Accesso sospeso.' : 'Ci siamo quasi.'}</h1>
          <p>
            {blocked
              ? 'Al momento il tuo account non ha accesso al percorso. Se pensi sia un errore, scrivici.'
              : 'Il tuo account è creato. Stiamo verificando la tua iscrizione: appena sblocchiamo l’accesso, questa pagina ti porta dentro il percorso da sola.'}
          </p>
        </div>
        {!blocked && (
          <ol className="steps">
            <li className="step done">
              <span className="step-num">01</span>
              <span className="step-label">Account creato</span>
              <IconCheck size={22} strokeWidth={2.5} className="text-red" aria-label="Fatto" />
            </li>
            <li className="step current">
              <span className="step-num">02</span>
              <span className="step-label">Verifica dell’iscrizione</span>
              <span className="step-tag">In corso</span>
            </li>
            <li className="step">
              <span className="step-num">03</span>
              <span className="step-label">Accesso al corso e a una call di gruppo a settimana per {months} {months === 1 ? 'mese' : 'mesi'}</span>
            </li>
          </ol>
        )}
        <button type="button" className="btn btn-red btn-block" onClick={check} disabled={checking}>
          {checking ? 'Controllo…' : 'Controlla di nuovo'}
        </button>
        <div className="pending-foot">
          <span>
            {settings.support_email ? (
              <>Serve aiuto? <a className="link" href={`mailto:${settings.support_email}`}>{settings.support_email}</a></>
            ) : (
              'Ti avvisiamo appena l’accesso è attivo.'
            )}
          </span>
          <button type="button" onClick={logout}>Esci</button>
        </div>
      </div>
    </div>
  );
}
