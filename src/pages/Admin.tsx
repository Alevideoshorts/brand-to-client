import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconChevronDown, IconChevronUp, IconEye, IconPlus, IconSearch, IconTrash } from '../components/Icons';
import { useAuth } from '../lib/auth';
import { formatDay, studentCalls, WEEKDAYS } from '../lib/call';
import { EMPTY_SETTINGS, fetchSettings, useSettings } from '../lib/data';
import { supabase } from '../lib/supabase';
import type { Lesson, Module, Profile, ProfileStatus, Resource, Settings } from '../lib/types';
import { parseVideo } from '../lib/video';

type Tab = 'studenti' | 'lezioni' | 'impostazioni';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('studenti');
  const [pendingCount, setPendingCount] = useState(0);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await signOut();
    navigate('/accedi');
  };

  const items: [Tab, string][] = [['studenti', 'Studenti'], ['lezioni', 'Moduli e lezioni'], ['impostazioni', 'Impostazioni']];

  return (
    <div className="admin">
      <aside className="admin-aside">
        <Link to="/" className="aside-brand">
          <img src="/logo.png" alt="Logo InfoFormatVirale" width={42} height={42} />
          <span className="stack-sm" style={{ gap: 0 }}>
            <span>Brand To Client</span>
            <span className="admin-role">Admin</span>
          </span>
        </Link>
        <nav className="admin-nav" aria-label="Sezioni admin">
          {items.map(([t, label]) => (
            <button key={t} type="button" className={tab === t ? 'aside-link active' : 'aside-link'} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {label}
              {t === 'studenti' && pendingCount > 0 && <span className="admin-badge">{pendingCount}</span>}
            </button>
          ))}
        </nav>
        <div style={{ flex: '1 1 auto' }} />
        <div className="stack-sm" style={{ padding: '0 12px' }}>
          <Link to="/" className="btn btn-outline btn-sm"><IconEye size={16} /> Vedi come studente</Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>Esci</button>
        </div>
      </aside>
      <main className="admin-main">
        {tab === 'studenti' && <StudentsTab onPending={setPendingCount} />}
        {tab === 'lezioni' && <LessonsTab />}
        {tab === 'impostazioni' && <SettingsTab />}
      </main>
    </div>
  );
}

/* ---------------------------------- Studenti ---------------------------------- */

type Filter = 'tutti' | 'pending' | 'active' | 'blocked';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function StudentsTab({ onPending }: { onPending: (n: number) => void }) {
  const { profile: me } = useAuth();
  const settings = useSettings();
  const [rows, setRows] = useState<Profile[] | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [totalLessons, setTotalLessons] = useState(0);
  const [filter, setFilter] = useState<Filter>('tutti');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, prog, les] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('lesson_progress').select('user_id'),
      supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('published', true),
    ]);
    if (p.error) setError('Impossibile caricare gli studenti.');
    const list = (p.data ?? []) as Profile[];
    setRows(list);
    const counts: Record<string, number> = {};
    ((prog.data ?? []) as { user_id: string }[]).forEach((r) => {
      counts[r.user_id] = (counts[r.user_id] ?? 0) + 1;
    });
    setProgress(counts);
    setTotalLessons(les.count ?? 0);
    onPending(list.filter((r) => r.status === 'pending' && !r.is_admin).length);
  }, [onPending]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (row: Profile, status: ProfileStatus) => {
    setBusyId(row.id);
    setError(null);
    const patch: Partial<Profile> = { status };
    if (status === 'active' && !row.activated_at) patch.activated_at = new Date().toISOString();
    const { error: err } = await supabase.from('profiles').update(patch).eq('id', row.id);
    setBusyId(null);
    if (err) {
      setError('Modifica non riuscita. Riprova.');
      return;
    }
    await load();
  };

  const students = (rows ?? []).filter((r) => r.id !== me?.id);
  const counts = {
    tutti: students.length,
    pending: students.filter((r) => r.status === 'pending').length,
    active: students.filter((r) => r.status === 'active').length,
    blocked: students.filter((r) => r.status === 'blocked').length,
  };
  const q = query.trim().toLowerCase();
  const list = students
    .filter((r) => filter === 'tutti' || r.status === filter)
    .filter((r) => !q || r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));

  return (
    <>
      <div className="stack-sm">
        <h1 className="admin-h1">Studenti</h1>
        <p className="admin-lead">Chi si registra entra qui “da sbloccare”. Premi Sblocca e il percorso si apre.</p>
      </div>
      {!rows ? (
        <p className="muted">Caricamento studenti…</p>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat-cell"><strong>{counts.tutti}</strong><span>iscritti</span></div>
            <div className="stat-cell red"><strong>{counts.pending}</strong><span>da sbloccare</span></div>
            <div className="stat-cell"><strong>{counts.active}</strong><span>nel percorso</span></div>
          </div>
          <div className="toolbar">
            <div className="filters">
              {([['tutti', 'Tutti'], ['pending', 'Da sbloccare'], ['active', 'Nel percorso'], ['blocked', 'Bloccati']] as [Filter, string][]).map(([f, label]) => (
                <button key={f} type="button" className={filter === f ? 'fbtn active' : 'fbtn'} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {label} ({counts[f]})
                </button>
              ))}
            </div>
            <label className="search">
              <IconSearch size={18} />
              <input type="search" aria-label="Cerca studente" placeholder="Cerca per nome o email" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="students">
            {list.length === 0 && <p className="empty-row">{students.length === 0 ? 'Ancora nessuno studente registrato.' : 'Nessuno studente in questa lista.'}</p>}
            {list.map((r) => {
              const done = progress[r.id] ?? 0;
              const pct = totalLessons ? Math.min(100, Math.round((done / totalLessons) * 100)) : 0;
              return (
                <div className="student" key={r.id}>
                  <div className="student-who">
                    <span className="student-avatar" aria-hidden="true">{(r.full_name || r.email).slice(0, 2).toUpperCase()}</span>
                    <span className="student-text">
                      <strong>{r.full_name || '—'}</strong>
                      <span>{r.email} · registrato il {formatDate(r.created_at)}</span>
                      {r.status === 'active' && !r.is_admin && (() => {
                        const c = studentCalls(settings, r.activated_at ?? r.created_at);
                        return c.configured && c.until ? (
                          <span className="student-calls">Call: {c.remaining} di {c.total} rimaste · fino al {formatDay(c.until)}</span>
                        ) : null;
                      })()}
                    </span>
                  </div>
                  <div className="student-progress">
                    <div className="bar"><div style={{ width: `${pct}%` }} /></div>
                    <span>{pct}%</span>
                  </div>
                  <span className={`student-status ${r.status}`}>
                    {r.is_admin ? 'Admin' : r.status === 'active' ? 'Nel percorso' : r.status === 'pending' ? 'Da sbloccare' : 'Bloccato'}
                  </span>
                  <div className="student-action">
                    {!r.is_admin && (r.status === 'active' ? (
                      <button type="button" className="btn btn-outline btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r, 'blocked')}>Blocca</button>
                    ) : (
                      <button type="button" className="btn btn-red btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r, 'active')}>
                        {r.status === 'blocked' ? 'Riattiva' : 'Sblocca'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/* ------------------------------ Moduli e lezioni ------------------------------ */

interface Draft {
  id: string | null;
  module_id: string;
  title: string;
  video_url: string;
  action: string;
  description: string;
  transcript: string;
  resources: string;
  published: boolean;
}

function resourcesToText(r: Resource[]): string {
  return r.map((x) => (x.label ? `${x.label} | ${x.url}` : x.url)).join('\n');
}

function textToResources(t: string): Resource[] {
  return t
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.lastIndexOf('|');
      if (i === -1) return { label: '', url: line };
      return { label: line.slice(0, i).trim(), url: line.slice(i + 1).trim() };
    })
    .filter((r) => /^https?:\/\//i.test(r.url));
}

const pad = (n: number) => String(n).padStart(2, '0');

function LessonsTab() {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [newModule, setNewModule] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [m, l] = await Promise.all([
      supabase.from('modules').select('id,title,position').order('position').order('created_at'),
      supabase.from('lessons').select('*').order('position').order('created_at'),
    ]);
    setModules((m.data ?? []) as Module[]);
    setLessons(((l.data ?? []) as Lesson[]).map((x) => ({ ...x, resources: Array.isArray(x.resources) ? x.resources : [] })));
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byModule = useMemo(() => {
    const map: Record<string, Lesson[]> = {};
    lessons.forEach((l) => {
      (map[l.module_id] ||= []).push(l);
    });
    return map;
  }, [lessons]);

  const flash = (kind: 'ok' | 'err', text: string) => {
    setMsg({ kind, text });
    window.setTimeout(() => setMsg(null), 3500);
  };

  const addModule = async (e: FormEvent) => {
    e.preventDefault();
    const title = newModule.trim();
    if (!title) return;
    const position = modules.length ? Math.max(...modules.map((m) => m.position)) + 1 : 0;
    const { error } = await supabase.from('modules').insert({ title, position });
    if (error) return flash('err', 'Modulo non creato. Riprova.');
    setNewModule('');
    await load();
    flash('ok', 'Modulo aggiunto');
  };

  const saveRename = async () => {
    if (!renaming || !renaming.title.trim()) return;
    const { error } = await supabase.from('modules').update({ title: renaming.title.trim() }).eq('id', renaming.id);
    if (error) return flash('err', 'Nome non salvato.');
    setRenaming(null);
    await load();
  };

  // Rinumera le posizioni secondo l'ordine attuale e scambia i due elementi.
  const reorder = async (table: 'modules' | 'lessons', list: { id: string; position: number }[], index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const ordered = [...list];
    [ordered[index], ordered[j]] = [ordered[j], ordered[index]];
    await Promise.all(ordered.map((x, i) => (x.position !== i ? supabase.from(table).update({ position: i }).eq('id', x.id) : null)));
    await load();
  };

  const deleteModule = async (id: string) => {
    const { error } = await supabase.from('modules').delete().eq('id', id);
    setConfirmDelete(null);
    if (error) return flash('err', 'Modulo non eliminato.');
    if (draft && draft.module_id === id) setDraft(null);
    await load();
    flash('ok', 'Modulo eliminato');
  };

  const startNew = (moduleId?: string) => {
    setDraft({ id: null, module_id: moduleId ?? modules[0]?.id ?? '', title: '', video_url: '', action: '', description: '', transcript: '', resources: '', published: true });
  };

  const startEdit = (l: Lesson) => {
    setDraft({
      id: l.id, module_id: l.module_id, title: l.title, video_url: l.video_url, action: l.action ?? '', description: l.description,
      transcript: l.transcript, resources: resourcesToText(l.resources), published: l.published,
    });
  };

  const saveDraft = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.title.trim() || !draft.module_id) return;
    setSaving(true);
    const payload = {
      module_id: draft.module_id,
      title: draft.title.trim(),
      video_url: draft.video_url.trim(),
      action: draft.action.trim(),
      description: draft.description.trim(),
      transcript: draft.transcript.trim(),
      resources: textToResources(draft.resources),
      published: draft.published,
    };
    let error;
    if (draft.id) {
      ({ error } = await supabase.from('lessons').update(payload).eq('id', draft.id));
    } else {
      const siblings = byModule[draft.module_id] ?? [];
      const position = siblings.length ? Math.max(...siblings.map((x) => x.position)) + 1 : 0;
      const res = await supabase.from('lessons').insert({ ...payload, position }).select('id').single();
      error = res.error;
      if (res.data) setDraft({ ...draft, id: (res.data as { id: string }).id });
    }
    setSaving(false);
    if (error) return flash('err', 'Lezione non salvata. Riprova.');
    setOpenId(draft.module_id);
    await load();
    flash('ok', 'Lezione salvata');
  };

  const deleteLesson = async (id: string) => {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    setConfirmDelete(null);
    if (error) return flash('err', 'Lezione non eliminata.');
    setDraft(null);
    await load();
    flash('ok', 'Lezione eliminata');
  };

  const withVideo = lessons.filter((l) => parseVideo(l.video_url)).length;
  const video = draft ? parseVideo(draft.video_url) : null;

  return (
    <>
      <div className="toolbar">
        <div className="stack-sm">
          <h1 className="admin-h1">Moduli e lezioni</h1>
          <p className="admin-lead">{lessons.length} lezioni · {withVideo} con video · {lessons.filter((l) => l.published).length} pubblicate</p>
        </div>
        <button type="button" className="btn btn-red" onClick={() => startNew()} disabled={!modules.length}><IconPlus size={18} /> Nuova lezione</button>
      </div>
      {!loaded ? (
        <p className="muted">Caricamento…</p>
      ) : (
        <div className="lessons-layout">
          <div className="lessons-list">
            {msg && <p className={msg.kind === 'ok' ? 'flash ok' : 'flash err'} role="status">{msg.text}</p>}
            {modules.map((m, mi) => {
              const list = byModule[m.id] ?? [];
              const isOpen = openId === m.id;
              return (
                <div className="mod-group" key={m.id}>
                  <div className="mod-group-head">
                    {renaming?.id === m.id ? (
                      <div className="rename">
                        <input className="inline-input" aria-label="Nome del modulo" value={renaming.title} onChange={(e) => setRenaming({ id: m.id, title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && saveRename()} autoFocus />
                        <button type="button" className="btn btn-red btn-sm" onClick={saveRename}>Salva</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenaming(null)}>Annulla</button>
                      </div>
                    ) : (
                      <button type="button" className="mod-group-toggle" aria-expanded={isOpen} onClick={() => setOpenId(isOpen ? null : m.id)}>
                        <span className="num">{pad(mi)}</span>
                        <span className="ttl">{m.title}</span>
                        <span className="cnt">{list.length} {list.length === 1 ? 'lezione' : 'lezioni'}</span>
                        {isOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                      </button>
                    )}
                    <div className="icon-actions">
                      <button type="button" className="icon-btn" aria-label="Sposta su" disabled={mi === 0} onClick={() => reorder('modules', modules, mi, -1)}><IconChevronUp size={18} /></button>
                      <button type="button" className="icon-btn" aria-label="Sposta giù" disabled={mi === modules.length - 1} onClick={() => reorder('modules', modules, mi, 1)}><IconChevronDown size={18} /></button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenaming({ id: m.id, title: m.title })}>Rinomina</button>
                      {confirmDelete === m.id ? (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteModule(m.id)}>Conferma: elimina</button>
                      ) : (
                        <button type="button" className="icon-btn" aria-label="Elimina modulo" onClick={() => setConfirmDelete(m.id)}><IconTrash size={18} /></button>
                      )}
                    </div>
                  </div>
                  {isOpen && (
                    <div>
                      {list.map((l, li) => (
                        <div className={draft?.id === l.id ? 'lesson-row selected' : 'lesson-row'} key={l.id}>
                          <div className="icon-actions">
                            <button type="button" className="icon-btn" aria-label="Sposta su" disabled={li === 0} onClick={() => reorder('lessons', list, li, -1)}><IconChevronUp size={16} /></button>
                            <button type="button" className="icon-btn" aria-label="Sposta giù" disabled={li === list.length - 1} onClick={() => reorder('lessons', list, li, 1)}><IconChevronDown size={16} /></button>
                          </div>
                          <span className="lesson-row-title">{l.title}</span>
                          <span className={parseVideo(l.video_url) ? 'tag ok' : 'tag no'}>{parseVideo(l.video_url) ? 'Video ok' : 'Senza video'}</span>
                          {!l.published && <span className="tag draft">Bozza</span>}
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(l)}>Modifica</button>
                        </div>
                      ))}
                      <button type="button" className="add-row" onClick={() => startNew(m.id)}><IconPlus size={16} /> Aggiungi lezione a questo modulo</button>
                    </div>
                  )}
                </div>
              );
            })}
            <form className="add-module" onSubmit={addModule}>
              <input className="inline-input" aria-label="Nome del nuovo modulo" placeholder="Nome del nuovo modulo" value={newModule} onChange={(e) => setNewModule(e.target.value)} />
              <button type="submit" className="btn btn-outline btn-sm"><IconPlus size={16} /> Nuovo modulo</button>
            </form>
          </div>

          <div className="editor">
            {!draft ? (
              <div className="editor-card">
                <span className="editor-title">Modifica lezioni</span>
                <p className="muted">Apri un modulo e premi <strong>Modifica</strong> su una lezione, oppure <strong>Nuova lezione</strong>.</p>
              </div>
            ) : (
              <form className="editor-card" onSubmit={saveDraft}>
                <span className="editor-title">{draft.id ? 'Modifica lezione' : 'Nuova lezione'}</span>
                <label className="field">
                  Modulo
                  <select value={draft.module_id} onChange={(e) => setDraft({ ...draft, module_id: e.target.value })}>
                    {modules.map((m, i) => <option key={m.id} value={m.id}>{pad(i)} · {m.title}</option>)}
                  </select>
                </label>
                <label className="field">
                  Titolo
                  <input required value={draft.title} placeholder="Es. Scrivere lo script della VSL" onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                </label>
                <label className="field">
                  Link del video
                  <input type="url" value={draft.video_url} placeholder="Link Bunny Stream o Vimeo" onChange={(e) => setDraft({ ...draft, video_url: e.target.value })} />
                  {draft.video_url.trim() && (
                    video ? <span className="hint ok">Video riconosciuto: {video.provider}</span> : <span className="hint err">Link non riconosciuto: incolla il link del video da Bunny Stream, Vimeo o YouTube</span>
                  )}
                </label>
                <label className="field red">
                  L’azione di oggi
                  <textarea rows={3} value={draft.action} placeholder="Cosa deve applicare lo studente dopo questa lezione" onChange={(e) => setDraft({ ...draft, action: e.target.value })} />
                </label>
                <label className="field">
                  Descrizione
                  <textarea rows={3} value={draft.description} placeholder="Di cosa parla la lezione" onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                </label>
                <label className="field">
                  Materiali (uno per riga: Nome | link)
                  <textarea rows={3} value={draft.resources} placeholder={'Slide della lezione | https://drive.google.com/…'} onChange={(e) => setDraft({ ...draft, resources: e.target.value })} />
                </label>
                <label className="field">
                  Trascrizione (facoltativa)
                  <textarea rows={3} value={draft.transcript} onChange={(e) => setDraft({ ...draft, transcript: e.target.value })} />
                </label>
                <label className="check">
                  <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
                  <span>Pubblicata (visibile agli studenti)</span>
                </label>
                <div className="row-gap wrap">
                  <button type="submit" className="btn btn-red" disabled={saving}>{saving ? 'Salvataggio…' : 'Salva lezione'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>Chiudi</button>
                  {draft.id && (
                    confirmDelete === draft.id ? (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteLesson(draft.id!)}>Conferma eliminazione</button>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-sm text-red" onClick={() => setConfirmDelete(draft.id)}><IconTrash size={16} /> Elimina</button>
                    )
                  )}
                </div>
                {draft.id && <a className="link small" href={`/corso/${draft.id}`} target="_blank" rel="noreferrer">Apri l’anteprima della lezione</a>}
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------- Impostazioni -------------------------------- */

function SettingsTab() {
  const [s, setS] = useState<Settings>(EMPTY_SETTINGS);
  const [state, setState] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading');

  useEffect(() => {
    fetchSettings(true).then((v) => {
      setS(v);
      setState('idle');
    });
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setState('saving');
    const values: Settings = { ...s, call_months: String(Math.max(1, parseInt(s.call_months, 10) || 3)) };
    const rows = (Object.keys(values) as (keyof Settings)[]).map((key) => ({ key, value: values[key].trim() }));
    const { error } = await supabase.from('settings').upsert(rows);
    if (error) return setState('error');
    await fetchSettings(true);
    setState('saved');
  };

  const example = studentCalls(s, new Date().toISOString());

  return (
    <>
      <div className="stack-sm">
        <h1 className="admin-h1">Impostazioni</h1>
        <p className="admin-lead">Call settimanale, gruppo Telegram ed email di supporto: è quello che gli studenti vedono nella home.</p>
      </div>
      {state === 'loading' ? (
        <p className="muted">Caricamento…</p>
      ) : (
        <form className="editor-card settings-card form" onSubmit={save}>
          <span className="editor-title">Call settimanale</span>
          <div className="form-split">
            <label className="field">
              Giorno
              <select value={s.call_weekday} onChange={(e) => setS({ ...s, call_weekday: e.target.value })}>
                {WEEKDAYS.map((d, i) => <option key={d} value={String(i + 1)}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </label>
            <label className="field">
              Ora (italiana)
              <input type="time" value={s.call_time} onChange={(e) => setS({ ...s, call_time: e.target.value })} />
            </label>
            <label className="field">
              Durata (mesi)
              <input type="number" min={1} max={24} value={s.call_months} onChange={(e) => setS({ ...s, call_months: e.target.value })} />
            </label>
          </div>
          <p className="muted small">
            Ogni studente ha una call a settimana per {Math.max(1, parseInt(s.call_months, 10) || 3)} mesi, contati dal giorno in cui lo sblocchi.
            {example.configured && ` Esempio: uno studente sbloccato oggi ha ${example.total} call, fino al ${example.until ? formatDay(example.until) : ''}.`}
          </p>
          <label className="field">
            Link della call (Zoom, Google Meet…)
            <input type="url" value={s.meeting_url} placeholder="https://meet.google.com/…" onChange={(e) => setS({ ...s, meeting_url: e.target.value })} />
          </label>
          <span className="editor-title">Community e supporto</span>
          <label className="field">
            Link di invito al gruppo Telegram
            <input type="url" value={s.telegram_url} placeholder="https://t.me/+…" onChange={(e) => setS({ ...s, telegram_url: e.target.value })} />
          </label>
          <label className="field">
            Email di supporto
            <input type="email" value={s.support_email} placeholder="supporto@brandtoclient.com" onChange={(e) => setS({ ...s, support_email: e.target.value })} />
          </label>
          <div className="row-gap">
            <button type="submit" className="btn btn-red" disabled={state === 'saving'}>{state === 'saving' ? 'Salvataggio…' : 'Salva'}</button>
            {state === 'saved' && <span className="muted small">Salvato</span>}
            {state === 'error' && <span className="form-error small">Non salvato, riprova</span>}
          </div>
        </form>
      )}
    </>
  );
}
