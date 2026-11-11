import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { IconCheck, IconClock } from '../components/Icons';
import { isMember, useAuth } from '../lib/auth';
import { useSettings } from '../lib/data';

export default function Pending() {
  const { profile, refreshProfile, signOut } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

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
    <div className="pending">
      <img className="pending-bg" src="/cover.jpg" alt="" />
      <div className="pending-card">
        <img src="/logo.png" alt="Logo InfoFormatVirale" width={72} height={72} />
        <div className="pending-head">
          <span className="chip chip-red">
            <IconClock size={14} /> {blocked ? 'Accesso sospeso' : 'In attesa di attivazione'}
          </span>
          <h1>{blocked ? 'Il tuo accesso è sospeso' : 'Account creato!'}</h1>
          <p>
            {blocked
              ? 'Al momento il tuo account non ha accesso al corso. Se pensi sia un errore, contattaci.'
              : 'Il tuo accesso a Brand To Client verrà sbloccato a breve. Appena è attivo, questa pagina ti porta direttamente al corso.'}
          </p>
        </div>
        {!blocked && (
          <ol className="steps">
            <li className="step done">
              <span className="step-dot"><IconCheck size={16} strokeWidth={3} /></span>
              Account creato
            </li>
            <li className="step current">
              <span className="step-dot">2</span>
              Verifica dell’iscrizione e sblocco dell’accesso
            </li>
            <li className="step">
              <span className="step-dot">3</span>
              Accesso al corso e alle call di gruppo
            </li>
          </ol>
        )}
        <button type="button" className="btn btn-primary btn-block" onClick={check} disabled={checking}>
          {checking ? 'Controllo…' : 'Controlla di nuovo'}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={logout}>Esci</button>
        {settings.support_email && (
          <p className="muted small">
            Hai bisogno di aiuto? Scrivi a <a className="link" href={`mailto:${settings.support_email}`}>{settings.support_email}</a>
          </p>
        )}
      </div>
    </div>
  );
}
