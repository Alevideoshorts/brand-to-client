import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Splash } from '../components/Guards';
import {
  IconArrowRight, IconCheck, IconChevronDown, IconChevronUp, IconClock, IconDownload, IconFile, IconHome, IconPlay, IconTarget,
} from '../components/Icons';
import VideoPlayer from '../components/VideoPlayer';
import { useAuth } from '../lib/auth';
import { resumeLesson, useCourse, visibleLessons } from '../lib/data';
import { supabase } from '../lib/supabase';
import type { Lesson, ModuleWithLessons } from '../lib/types';

const pad = (n: number) => String(n).padStart(2, '0');

function initials(name: string, email: string) {
  const parts = (name.trim() || email).split(/[\s.@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'BTC';
}

export default function Course() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, profile, signOut } = useAuth();
  const userId = session?.user.id;
  const isAdmin = !!profile?.is_admin;
  const { data, setData, error } = useCourse(userId);

  const [openModule, setOpenModule] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [note, setNote] = useState('');
  const [noteState, setNoteState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Moduli e lezioni visibili (l'admin vede anche le bozze).
  const modules: (ModuleWithLessons & { num: string })[] = useMemo(() => {
    if (!data) return [];
    return data.modules
      .map((m, i) => ({ ...m, num: pad(i), lessons: m.lessons.filter((l) => l.published || isAdmin) }))
      .filter((m) => m.lessons.length > 0);
  }, [data, isAdmin]);
  const lessons = useMemo(() => (data ? visibleLessons(data, isAdmin) : []), [data, isAdmin]);
  const index = lessons.findIndex((l) => l.id === id);
  const lesson: Lesson | null = index >= 0 ? lessons[index] : null;
  const next = index >= 0 ? lessons[index + 1] ?? null : null;
  const mod = lesson ? modules.find((m) => m.id === lesson.module_id) ?? null : null;
  const posInModule = lesson && mod ? mod.lessons.findIndex((l) => l.id === lesson.id) + 1 : 0;

  // Quando cambia lezione: apri il suo modulo (e chiudi gli altri), salva "ultima lezione", carica la nota.
  useEffect(() => {
    if (!lesson || !userId) return;
    setOpenModule(lesson.module_id);
    setShowTranscript(false);
    window.scrollTo({ top: 0 });
    supabase.from('user_state').upsert({ user_id: userId, last_lesson_id: lesson.id, updated_at: new Date().toISOString() }).then(() => {});
    let alive = true;
    supabase.from('lesson_notes').select('body').eq('user_id', userId).eq('lesson_id', lesson.id).maybeSingle().then(({ data: n }) => {
      if (!alive) return;
      setNote((n as { body: string } | null)?.body ?? '');
      setNoteState('idle');
    });
    return () => {
      alive = false;
    };
  }, [lesson?.id, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDone = !!(lesson && data?.done.has(lesson.id));

  const markWatched = useCallback(async () => {
    if (!lesson || !userId || !data || data.done.has(lesson.id)) return;
    const done = new Set(data.done);
    done.add(lesson.id);
    setData({ ...data, done });
    await supabase.from('lesson_progress').upsert({ user_id: userId, lesson_id: lesson.id });
  }, [lesson, userId, data, setData]);

  const saveNote = async () => {
    if (!lesson || !userId) return;
    setNoteState('saving');
    const { error: err } = await supabase
      .from('lesson_notes')
      .upsert({ user_id: userId, lesson_id: lesson.id, body: note, updated_at: new Date().toISOString() });
    setNoteState(err ? 'error' : 'saved');
  };

  const logout = async () => {
    await signOut();
    navigate('/accedi');
  };

  if (!data && !error) return <Splash />;

  // /corso senza lezione: vai a quella da cui riprendere.
  if (!id && data) {
    const resume = resumeLesson(data, isAdmin);
    if (resume) return <Navigate to={`/corso/${resume.id}`} replace />;
  }

  const doneCount = lessons.filter((l) => data?.done.has(l.id)).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;

  const sidebar = (
    <aside className="course-aside" id="moduli" aria-label="Moduli del corso">
      <Link to="/" className="aside-brand">
        <img src="/logo.png" alt="Logo InfoFormatVirale" width={42} height={42} />
        <span>Brand To Client</span>
      </Link>
      <Link to="/" className="aside-link"><IconHome size={20} /> Home</Link>
      <div className="aside-progress">
        <div className="aside-progress-top">
          <span className="label-caps">Il tuo percorso</span>
          <strong>{pct}%</strong>
        </div>
        <div className="bar"><div style={{ width: `${pct}%` }} /></div>
      </div>
      <nav className="mods">
        <span className="label-caps mods-label">Moduli · scegli cosa vedere</span>
        {modules.map((m) => {
          const isOpen = openModule === m.id;
          const mDone = m.lessons.filter((l) => data!.done.has(l.id)).length;
          const all = mDone === m.lessons.length;
          const current = !!lesson && lesson.module_id === m.id;
          return (
            <div className={isOpen ? 'mod open' : 'mod'} key={m.id}>
              <button type="button" className="mod-btn" aria-expanded={isOpen} onClick={() => setOpenModule(isOpen ? null : m.id)}>
                <span className={all ? 'mod-num done' : current ? 'mod-num current' : 'mod-num'}>{m.num}</span>
                <span className="mod-info">
                  <span className="mod-meta">Modulo {m.num} · {mDone}/{m.lessons.length} lezioni</span>
                  <span className="mod-title">{m.title}</span>
                </span>
                {isOpen ? <IconChevronUp size={20} className="mod-chev" /> : <IconChevronDown size={20} className="mod-chev" />}
              </button>
              {isOpen && (
                <div className="mod-lessons">
                  {m.lessons.map((l, li) => {
                    const cur = lesson?.id === l.id;
                    const seen = data!.done.has(l.id);
                    return (
                      <Link key={l.id} to={`/corso/${l.id}`} className={cur ? 'les current' : 'les'} aria-current={cur ? 'page' : undefined}>
                        {cur ? (
                          <IconPlay size={20} className="shrink-0" />
                        ) : seen ? (
                          <IconCheck size={20} strokeWidth={2.6} className="text-red shrink-0" aria-label="Vista" />
                        ) : (
                          <span className="les-code" aria-hidden="true">{Number(m.num)}.{li + 1}</span>
                        )}
                        <span>
                          {l.title}
                          {!l.published && <span className="draft"> · bozza</span>}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="aside-user">
        <span className="aside-avatar" aria-hidden="true">{initials(profile?.full_name ?? '', profile?.email ?? '')}</span>
        <span className="aside-user-name">{profile?.full_name || profile?.email}</span>
        <button type="button" className="aside-logout" onClick={logout}>Esci</button>
      </div>
    </aside>
  );

  if (!lesson) {
    return (
      <div className="course">
        {sidebar}
        <main className="course-main">
          <div className="mobile-bar">
            <Link to="/"><IconHome size={18} /> Home</Link>
            <a href="#moduli">Tutti i moduli <IconChevronDown size={18} /></a>
          </div>
          <div className="empty-course">
            <h1 className="lesson-title">{lessons.length ? 'Lezione non disponibile' : 'Le lezioni arrivano a breve'}</h1>
            <p className="muted">{lessons.length ? 'Scegli una lezione dal menu dei moduli.' : 'Appena pubblichiamo le prime lezioni le trovi qui, nel menu a sinistra.'}</p>
            <Link to="/" className="btn btn-outline">Torna alla home</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="course">
      {sidebar}
      <main className="course-main">
        <div className="mobile-bar">
          <Link to="/"><IconHome size={18} /> Home</Link>
          <a href="#moduli">Tutti i moduli <IconChevronDown size={18} /></a>
        </div>
        <VideoPlayer url={lesson.video_url} title={lesson.title} onWatched={markWatched} />
        <div className="lesson-wrap">
          <div className="lesson-head">
            <div className="lesson-titles">
              <span className="kicker">Modulo {mod?.num} · Lezione {posInModule} di {mod?.lessons.length}</span>
              <h1 className="lesson-title">{lesson.title}</h1>
              {!lesson.published && <span className="draft-chip">Bozza: la vedi solo tu</span>}
            </div>
            {isDone ? (
              <span className="seen-chip" role="status"><IconCheck size={20} strokeWidth={2.6} /> Lezione vista</span>
            ) : (
              <span className="seen-note"><IconClock size={20} className="shrink-0" /> Si segna come vista da sola quando arrivi alla fine del video</span>
            )}
          </div>

          <div className="lesson-cols">
            <div className="lesson-col">
              {lesson.action && (
                <section className="action-box" aria-label="L’azione di oggi">
                  <span className="action-label"><IconTarget size={20} /> L’azione di oggi</span>
                  <p>{lesson.action}</p>
                </section>
              )}
              {lesson.description && <p className="lesson-text">{lesson.description}</p>}
              {lesson.resources.length > 0 && (
                <div className="stack-sm">
                  <h2 className="section-title">Materiali</h2>
                  {lesson.resources.map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noreferrer" className="resource">
                      <span><IconFile size={20} className="text-red shrink-0" /> {r.label || r.url}</span>
                      <IconDownload size={18} className="shrink-0" />
                    </a>
                  ))}
                </div>
              )}
              {lesson.transcript && (
                <div className="stack-sm">
                  <button type="button" className="transcript-toggle" aria-expanded={showTranscript} onClick={() => setShowTranscript((v) => !v)}>
                    {showTranscript ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />} Leggi la trascrizione
                  </button>
                  {showTranscript && <div className="transcript">{lesson.transcript}</div>}
                </div>
              )}
            </div>
            <section className="notebook" aria-label="Il tuo quaderno">
              <span className="notebook-title">Il tuo quaderno</span>
              <label>
                Appunti su questa lezione, li vedi solo tu
                <textarea rows={7} placeholder="Cosa applichi al tuo business?" value={note} onChange={(e) => { setNote(e.target.value); setNoteState('idle'); }} />
              </label>
              <button type="button" className="btn btn-outline btn-sm" onClick={saveNote} disabled={noteState === 'saving'}>
                {noteState === 'saving' ? 'Salvataggio…' : noteState === 'saved' ? 'Salvato nel quaderno' : 'Salva nel quaderno'}
              </button>
              {noteState === 'error' && <span className="form-error small">Non salvato, riprova</span>}
            </section>
          </div>

          {next && (
            <Link to={`/corso/${next.id}`} className="next-btn">
              <span className="stack-sm">
                <span className="next-btn-label">Lezione successiva</span>
                <span className="next-btn-title">{next.title}</span>
              </span>
              <IconArrowRight size={24} className="shrink-0" />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
