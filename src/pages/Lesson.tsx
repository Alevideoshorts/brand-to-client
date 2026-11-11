import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { Splash } from '../components/Guards';
import {
  IconArrowLeft, IconCheck, IconCheckCircle, IconChevronDown, IconChevronRight, IconChevronUp,
  IconExternal, IconFile, IconPlayCircle, IconStar,
} from '../components/Icons';
import { useAuth } from '../lib/auth';
import { useCourse, visibleLessons } from '../lib/data';
import { supabase } from '../lib/supabase';

type Tab = 'contenuto' | 'note' | 'trascrizione';

function readAutoplay(): boolean {
  try {
    return localStorage.getItem('btc_autoplay') === '1';
  } catch {
    return false;
  }
}

export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const isAdmin = !!profile?.is_admin;
  const { data, setData, error } = useCourse(userId);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<Tab>('contenuto');
  const [autoplay, setAutoplay] = useState<boolean>(readAutoplay);
  const [fav, setFav] = useState(false);
  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const lessons = useMemo(() => (data ? visibleLessons(data, isAdmin) : []), [data, isAdmin]);
  const index = lessons.findIndex((l) => l.id === id);
  const lesson = index >= 0 ? lessons[index] : null;
  const next = index >= 0 ? lessons[index + 1] ?? null : null;
  const mod = lesson && data ? data.modules.find((m) => m.id === lesson.module_id) ?? null : null;
  const cameFromAutoplay = !!(location.state as { autoplay?: boolean } | null)?.autoplay;

  // Apri il modulo della lezione corrente e salva "ultima lezione vista".
  useEffect(() => {
    if (!lesson || !userId) return;
    setOpen((o) => ({ ...o, [lesson.module_id]: true }));
    setTab('contenuto');
    supabase.from('user_state').upsert({ user_id: userId, last_lesson_id: lesson.id, updated_at: new Date().toISOString() }).then(() => {});
    let alive = true;
    Promise.all([
      supabase.from('lesson_notes').select('body').eq('user_id', userId).eq('lesson_id', lesson.id).maybeSingle(),
      supabase.from('lesson_favorites').select('lesson_id').eq('user_id', userId).eq('lesson_id', lesson.id).maybeSingle(),
    ]).then(([n, f]) => {
      if (!alive) return;
      setNote((n.data as { body: string } | null)?.body ?? '');
      setNoteSaved('idle');
      setFav(!!f.data);
    });
    window.scrollTo({ top: 0 });
    return () => {
      alive = false;
    };
  }, [lesson?.id, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDone = !!(lesson && data?.done.has(lesson.id));

  const setDone = useCallback(
    async (value: boolean) => {
      if (!lesson || !userId || !data) return;
      const done = new Set(data.done);
      if (value) done.add(lesson.id);
      else done.delete(lesson.id);
      setData({ ...data, done });
      if (value) await supabase.from('lesson_progress').upsert({ user_id: userId, lesson_id: lesson.id });
      else await supabase.from('lesson_progress').delete().eq('user_id', userId).eq('lesson_id', lesson.id);
    },
    [lesson, userId, data, setData],
  );

  const toggleFav = async () => {
    if (!lesson || !userId) return;
    const value = !fav;
    setFav(value);
    if (value) await supabase.from('lesson_favorites').upsert({ user_id: userId, lesson_id: lesson.id });
    else await supabase.from('lesson_favorites').delete().eq('user_id', userId).eq('lesson_id', lesson.id);
  };

  const toggleAutoplay = () => {
    const value = !autoplay;
    setAutoplay(value);
    try {
      localStorage.setItem('btc_autoplay', value ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const saveNote = async () => {
    if (!lesson || !userId) return;
    setNoteSaved('saving');
    const { error: err } = await supabase
      .from('lesson_notes')
      .upsert({ user_id: userId, lesson_id: lesson.id, body: note, updated_at: new Date().toISOString() });
    setNoteSaved(err ? 'error' : 'saved');
  };

  const onEnded = useCallback(() => {
    if (!isDone) setDone(true);
    if (autoplay && next) navigate(`/lezione/${next.id}`, { state: { autoplay: true } });
  }, [isDone, setDone, autoplay, next, navigate]);

  if (!data && !error) return <Splash />;

  if (!lesson) {
    return (
      <div className="page center-page">
        <div className="card stack-md narrow">
          <h1 className="h3">Lezione non disponibile</h1>
          <p className="muted">Questa lezione non esiste o non è ancora stata pubblicata.</p>
          <Link to="/" className="btn btn-primary">Torna ai corsi</Link>
        </div>
      </div>
    );
  }

  const doneCount = lessons.filter((l) => data?.done.has(l.id)).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;

  return (
    <div className="page">
      <div className="lesson-topbar">
        <Link to="/" className="back-link"><IconArrowLeft /> Torna ai corsi</Link>
        <div className="lesson-brand">
          <img src="/logo.png" alt="Logo InfoFormatVirale" width={36} height={36} />
          <span>Brand To Client</span>
        </div>
      </div>

      <div className="lesson-layout">
        <main className="lesson-main">
          <VideoPlayer url={lesson.video_url} title={lesson.title} autoplay={cameFromAutoplay} onEnded={onEnded} />

          <div className="lesson-content">
            <div className="autoplay-row">
              <button type="button" className="switch-btn" aria-pressed={autoplay} onClick={toggleAutoplay}>
                <span className={autoplay ? 'switch on' : 'switch'}><span /></span>
                Riproduci in automatico la lezione successiva
              </button>
            </div>

            <div className="lesson-head">
              <div className="lesson-titles">
                <span className="muted">{mod?.title}</span>
                <h1 className="h2">{lesson.title}</h1>
                {!lesson.published && <span className="chip chip-amber">Bozza: la vedi solo tu</span>}
              </div>
              <div className="lesson-actions">
                <button type="button" className="btn btn-outline" aria-pressed={fav} onClick={toggleFav}>
                  <IconStar size={18} filled={fav} className={fav ? 'text-red' : ''} /> Preferiti
                </button>
                {isDone ? (
                  <button type="button" className="btn btn-primary" onClick={() => setDone(false)}>
                    <IconCheck size={18} strokeWidth={2.5} /> Completata
                  </button>
                ) : (
                  <button type="button" className="btn btn-outline-red" onClick={() => setDone(true)}>
                    <IconCheckCircle size={18} /> Segna come completata
                  </button>
                )}
              </div>
            </div>

            <div className="tabs" role="group" aria-label="Sezioni della lezione">
              {(['contenuto', 'note', 'trascrizione'] as Tab[]).map((t) => (
                <button key={t} type="button" className={tab === t ? 'tab active' : 'tab'} aria-pressed={tab === t} onClick={() => setTab(t)}>
                  {t === 'contenuto' ? 'Contenuto' : t === 'note' ? 'Note' : 'Trascrizione'}
                </button>
              ))}
            </div>

            {tab === 'contenuto' && (
              <div className="stack-md">
                {lesson.description ? (
                  <p className="lesson-text">{lesson.description}</p>
                ) : (
                  <p className="muted">Per questa lezione non ci sono note aggiuntive.</p>
                )}
                {lesson.resources.length > 0 && (
                  <div className="stack-sm">
                    <h2 className="label-caps">Materiali della lezione</h2>
                    {lesson.resources.map((r, i) => (
                      <a key={i} href={r.url} target="_blank" rel="noreferrer" className="resource">
                        <span><IconFile size={20} className="text-red" /> {r.label || r.url}</span>
                        <IconExternal size={18} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'note' && (
              <div className="stack-sm">
                <label className="field">
                  I tuoi appunti su questa lezione (li vedi solo tu)
                  <textarea rows={7} placeholder="Scrivi qui le idee da applicare al tuo business…" value={note} onChange={(e) => { setNote(e.target.value); setNoteSaved('idle'); }} />
                </label>
                <div className="row-gap">
                  <button type="button" className="btn btn-primary" onClick={saveNote} disabled={noteSaved === 'saving'}>
                    {noteSaved === 'saving' ? 'Salvataggio…' : 'Salva nota'}
                  </button>
                  {noteSaved === 'saved' && <span className="muted small">Nota salvata</span>}
                  {noteSaved === 'error' && <span className="form-error small">Non salvata, riprova</span>}
                </div>
              </div>
            )}

            {tab === 'trascrizione' && (
              lesson.transcript ? (
                <div className="transcript">{lesson.transcript}</div>
              ) : (
                <p className="empty-box">La trascrizione di questa lezione non è ancora disponibile.</p>
              )
            )}

            {next && (
              <Link to={`/lezione/${next.id}`} className="next-card">
                <span className="stack-xs">
                  <span className="muted small">Prossima lezione</span>
                  <span className="next-title">{next.title}</span>
                </span>
                <IconChevronRight size={22} />
              </Link>
            )}
          </div>
        </main>

        <aside className="lesson-aside" aria-label="Contenuti del corso">
          <div className="aside-head">
            <h2 className="h3">Contenuti del corso</h2>
            <div className="progress-label">
              <span className="muted">Il tuo avanzamento</span>
              <strong>{doneCount} di {lessons.length} lezioni · {pct}%</strong>
            </div>
            <div className="progress thin"><div style={{ width: `${pct}%` }} /></div>
          </div>
          {data!.modules.map((m) => {
            const mLessons = m.lessons.filter((l) => l.published || isAdmin);
            if (!mLessons.length) return null;
            const isOpen = !!open[m.id];
            const mDone = mLessons.filter((l) => data!.done.has(l.id)).length;
            return (
              <div className="aside-module" key={m.id}>
                <button type="button" className="aside-module-btn" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [m.id]: !isOpen }))}>
                  <span className="aside-module-title">{m.title}</span>
                  <span className="aside-module-meta">
                    {mDone}/{mLessons.length}
                    {isOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                  </span>
                </button>
                {isOpen && (
                  <div className="aside-lessons">
                    {mLessons.map((l) => {
                      const current = l.id === lesson.id;
                      const done = data!.done.has(l.id);
                      return (
                        <Link key={l.id} to={`/lezione/${l.id}`} className={current ? 'aside-lesson current' : 'aside-lesson'} aria-current={current ? 'page' : undefined}>
                          {current ? (
                            <IconPlayCircle size={22} className="text-red shrink-0" />
                          ) : done ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0"><circle cx="12" cy="12" r="10" fill="#D7262F" /><path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6E686F" strokeWidth="2" aria-hidden="true" className="shrink-0"><circle cx="12" cy="12" r="9" /></svg>
                          )}
                          <span>
                            {l.title}
                            {!l.published && <em className="draft-tag"> · bozza</em>}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
