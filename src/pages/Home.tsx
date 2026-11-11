import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Splash } from '../components/Guards';
import { IconArrowRight, IconChat, IconExternal } from '../components/Icons';
import { useAuth } from '../lib/auth';
import { formatCallDate, formatDay, splitCountdown, studentCalls } from '../lib/call';
import { useCourse, useSettings, visibleLessons } from '../lib/data';

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export default function Home() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = !!profile?.is_admin;
  const { data, error } = useCourse(session?.user.id);
  const settings = useSettings();
  const now = useNow();

  if (!data && !error) return <Splash />;

  const lessons = data ? visibleLessons(data, isAdmin) : [];
  const total = lessons.length;
  const done = data ? lessons.filter((l) => data.done.has(l.id)).length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const firstName = (profile?.full_name || '').trim().split(/\s+/)[0] || '';
  const call = studentCalls(settings, profile?.activated_at ?? profile?.created_at, now);
  const cd = call.next ? splitCountdown(call.next.getTime() - now) : null;

  const logout = async () => {
    await signOut();
    navigate('/accedi');
  };

  return (
    <div className="hub">
      <header className="hub-header">
        <div className="hub-brand">
          <img src="/logo.png" alt="Logo InfoFormatVirale" width={40} height={40} />
          <span>Brand To Client</span>
        </div>
        <div className="hub-user">
          {isAdmin && <Link to="/admin" className="hub-admin">Pannello admin</Link>}
          <span className="hub-name">{profile?.full_name || profile?.email}</span>
          <button type="button" className="hub-logout" onClick={logout}>Esci</button>
        </div>
      </header>

      <main className="hub-main">
        <div className="hub-hello">
          <h1>{firstName ? `Ciao ${firstName}` : 'Bentornato'}</h1>
          <p>Cosa vuoi fare oggi?</p>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="hub-cards">
          <Link to="/corso" className="hub-card primary">
            <div className="hub-cover">
              <img src="/cover.jpg" alt="" />
              <span className="hub-num">01</span>
            </div>
            <div className="hub-card-body">
              <span className="hub-title">Il corso</span>
              <span className="hub-text">Tutti i moduli e le lezioni di Brand To Client.</span>
              <div className="stack-sm">
                <div className="progress-row"><span>Avanzamento</span><strong>{done} di {total} lezioni · {pct}%</strong></div>
                <div className="bar"><div style={{ width: `${pct}%` }} /></div>
              </div>
              <span className="btn btn-red btn-block hub-cta">Entra nel corso <IconArrowRight size={20} strokeWidth={2.4} /></span>
            </div>
          </Link>

          {settings.slack_url ? (
            <a href={settings.slack_url} target="_blank" rel="noreferrer" className="hub-card">
              <span className="hub-num">02</span>
              <span className="hub-icon"><IconChat size={28} /></span>
              <span className="hub-title">Gruppo Slack</span>
              <span className="hub-text">La community degli studenti: domande tra una call e l’altra, confronto e risultati.</span>
              <span className="btn btn-outline btn-block hub-cta">Apri Slack <IconExternal size={18} /></span>
            </a>
          ) : (
            <div className="hub-card">
              <span className="hub-num">02</span>
              <span className="hub-icon"><IconChat size={28} /></span>
              <span className="hub-title">Gruppo Slack</span>
              <span className="hub-text">La community degli studenti: domande tra una call e l’altra, confronto e risultati.</span>
              <span className="btn btn-outline btn-block hub-cta is-disabled" aria-disabled="true">Link in arrivo</span>
            </div>
          )}

          <div className="hub-card">
            <span className="hub-num">03</span>
            <span className="hub-title">Call settimanale</span>
            <span className="hub-text">
              Una call di gruppo a settimana per {call.months} {call.months === 1 ? 'mese' : 'mesi'}
              {call.weekdayLabel && call.time ? `, ogni ${call.weekdayLabel} alle ${call.time}` : ''}.
            </span>
            {call.configured && (
              <div className="calls-left">
                <strong>{call.remaining}<span>/{call.total}</span></strong>
                <span>{call.finished ? 'call disponibili: il tuo periodo è terminato' : `call ancora a tua disposizione${call.until ? `, fino al ${formatDay(call.until)}` : ''}`}</span>
              </div>
            )}
            {call.configured && !call.finished && call.next && (
              <>
                <div className="next-call">
                  <span className="label-caps">{call.live ? 'In corso adesso' : `Prossima call · ${call.number} di ${call.total}`}</span>
                  <strong>{formatCallDate(call.next)}</strong>
                </div>
                {call.live ? (
                  <p className="live-now">La call è iniziata: entra subito.</p>
                ) : (
                  cd && (
                    <div className="stack-sm">
                      <span className="label-caps text-red">Inizia tra</span>
                      <div className="countdown" role="timer" aria-live="off">
                        <div><strong>{cd.d}</strong><span>giorni</span></div>
                        <div><strong>{cd.h}</strong><span>ore</span></div>
                        <div><strong>{cd.m}</strong><span>min</span></div>
                        <div><strong>{cd.s}</strong><span>sec</span></div>
                      </div>
                    </div>
                  )
                )}
              </>
            )}
            {settings.meeting_url && !call.finished ? (
              <a href={settings.meeting_url} target="_blank" rel="noreferrer" className={call.live ? 'btn btn-red btn-block hub-cta' : 'btn btn-outline btn-block hub-cta'}>
                Entra nella call
              </a>
            ) : (
              <span className="btn btn-outline btn-block hub-cta is-disabled" aria-disabled="true">{call.finished ? 'Periodo di call terminato' : 'Link in arrivo'}</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
