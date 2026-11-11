import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { IconCalendar, IconChat, IconPlay, IconPlayCircle, IconUsers, IconVideo } from '../components/Icons';
import { Splash } from '../components/Guards';
import { useAuth } from '../lib/auth';
import { resumeLesson, useCourse, useSettings, visibleLessons } from '../lib/data';

export default function Courses() {
  const { session, profile } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const { data, error } = useCourse(session?.user.id);
  const settings = useSettings();

  if (!data && !error) return <Splash />;

  const lessons = data ? visibleLessons(data, isAdmin) : [];
  const total = lessons.length;
  const doneCount = data ? lessons.filter((l) => data.done.has(l.id)).length : 0;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const moduleCount = data ? data.modules.filter((m) => m.lessons.some((l) => l.published || isAdmin)).length : 0;
  const resume = data ? resumeLesson(data, isAdmin) : null;
  const resumeModule = resume && data ? data.modules.find((m) => m.id === resume.module_id) : null;
  const started = doneCount > 0 || !!data?.lastLessonId;

  return (
    <div className="page">
      <Header />
      <main className="container stack-xl">
        <div className="stack-sm">
          <h1 className="h1">I miei corsi</h1>
          <p className="lead">Lezioni, call di gruppo e community in un’unica piattaforma.</p>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        {resume && (
          <section className="resume" aria-label="Riprendi">
            <div className="resume-info">
              <span className="resume-icon"><IconPlay size={20} /></span>
              <div className="stack-xs">
                <span className="eyebrow">{started ? 'Riprendi da dove eri rimasto' : 'Inizia da qui'}</span>
                <span className="resume-title">
                  {resumeModule ? `${resumeModule.title} · ` : ''}{resume.title}
                </span>
              </div>
            </div>
            <Link to={`/lezione/${resume.id}`} className="btn btn-primary">{started ? 'Riprendi la lezione' : 'Inizia il corso'}</Link>
          </section>
        )}

        <section className="stack-md">
          <h2 className="h2">Il tuo corso</h2>
          <div className="course-card">
            <div className="course-cover">
              <img src="/cover.jpg" alt="Copertina del corso Brand To Client" />
            </div>
            <div className="course-body">
              <span className="chip chip-red">Percorso di 90 giorni</span>
              <div className="stack-sm">
                <h3 className="h3">Brand To Client</h3>
                <p className="muted">Dalla VSL alle ads, fino alla vendita: il sistema completo per trasformare il tuo personal brand in clienti.</p>
              </div>
              <div className="meta-row">
                <span>{moduleCount} {moduleCount === 1 ? 'modulo' : 'moduli'}</span>
                <span>{total} {total === 1 ? 'lezione' : 'lezioni'}</span>
                <span>8 call di gruppo</span>
              </div>
              <div className="stack-xs">
                <div className="progress-label">
                  <span className="muted">Il tuo avanzamento</span>
                  <strong>{doneCount} di {total} lezioni · {pct}%</strong>
                </div>
                <div className="progress"><div style={{ width: `${pct}%` }} /></div>
              </div>
              {resume ? (
                <Link to={`/lezione/${resume.id}`} className="btn btn-primary btn-block">
                  <IconPlayCircle size={20} /> {started ? 'Continua' : 'Inizia'}
                </Link>
              ) : (
                <p className="notice">Le lezioni saranno disponibili a breve.</p>
              )}
            </div>
          </div>
        </section>

        <section className="stack-md">
          <h2 className="h2">Percorso di gruppo</h2>
          <div className="cards-2">
            <div id="meeting" className="card stack-md">
              <span className="card-icon"><IconVideo size={24} /></span>
              <div className="stack-sm">
                <h3 className="h4">Call di gruppo settimanale</h3>
                <p className="muted">Q&amp;A aperto con Alessandro: porta le tue domande, alza la mano e lavoriamo sul tuo caso.</p>
              </div>
              <div className="info-row">
                <IconCalendar size={18} />
                <span>Prossima call: <strong>{settings.meeting_when || 'data in arrivo'}</strong></span>
              </div>
              {settings.meeting_url ? (
                <a href={settings.meeting_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-block">Entra nella call</a>
              ) : (
                <span className="btn btn-outline btn-block is-disabled" aria-disabled="true">Link in arrivo</span>
              )}
            </div>
            <div id="community" className="card stack-md">
              <span className="card-icon"><IconChat size={24} /></span>
              <div className="stack-sm">
                <h3 className="h4">Community su Slack</h3>
                <p className="muted">Supporto tra una call e l’altra e confronto con gli altri studenti del percorso.</p>
              </div>
              <div className="info-row">
                <IconUsers size={18} />
                <span>Canale riservato agli studenti</span>
              </div>
              {settings.slack_url ? (
                <a href={settings.slack_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-block">Apri Slack</a>
              ) : (
                <span className="btn btn-outline btn-block is-disabled" aria-disabled="true">Link in arrivo</span>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
