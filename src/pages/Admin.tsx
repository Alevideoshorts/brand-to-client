import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Header from '../components/Header';
import { IconChevronDown, IconChevronUp, IconLock, IconLockOpen, IconPlus, IconSearch, IconTrash } from '../components/Icons';
import { useAuth } from '../lib/auth';
import { EMPTY_SETTINGS, fetchSettings } from '../lib/data';
import { supabase } from '../lib/supabase';
import type { Lesson, Module, Profile, ProfileStatus, Resource, Settings } from '../lib/types';
import { parseVideo } from '../lib/video';

type Tab = 'studenti' | 'lezioni' | 'impostazioni';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('studenti');
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <div className="page">
      <Header admin />
      <main className="container stack-lg">
        <div className="stack-sm">
          <h1 className="h1">Pannello admin</h1>
          <p className="lead">Sblocca gli studenti e gestisci le lezioni del corso. Questa pagina la vedi solo tu.</p>
        </div>
        <div className="tabs" role="group" aria-label="Sezioni del pannello">
          <button type="button" className={tab === 'studenti' ? 'tab active' : 'tab'} aria-pressed={tab === 'studenti'} onClick={() => setTab('studenti')}>
            Studenti {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
          </button>
          <button type="button" className={tab === 'lezioni' ? 'tab active' : 'tab'} aria-pressed={tab === 'lezioni'} onClick={() => setTab('lezioni')}>Lezioni</button>
          <button type="button" className={tab === 'impostazioni' ? 'tab active' : 'tab'} aria-pressed={tab === 'impostazioni'} onClick={() => setTab('impostazioni')}>Impostazioni</button>
        </div>
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

  if (!rows) return <p className="muted">Caricamento studenti…</p>;

  return (
    <div className="stack-lg">
      <div className="stats">
        <div className="stat"><span>Iscritti totali</span><strong>{counts.tutti}</strong></div>
        <div className="stat stat-red"><span>In attesa di sblocco</span><strong>{counts.pending}</strong></div>
        <div className="stat"><span>Con accesso attivo</span><strong>{counts.active}</strong></div>
      </div>

      <div className="toolbar">
        <div className="chips">
          {([['tutti', 'Tutti'], ['pending', 'In attesa'], ['active', 'Attivi'], ['blocked', 'Bloccati']] as [Filter, string][]).map(([f, label]) => (
            <button key={f} type="button" className={filter === f ? 'pill active' : 'pill'} aria-pressed={filter === f} onClick={() => setFilter(f)}>
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

      <div className="table-box">
        <div className="table">
          <div className="trow thead">
            <span>Studente</span><span>Registrato il</span><span>Avanzamento</span><span>Stato</span><span>Azione</span>
          </div>
          {list.length === 0 && <p className="table-empty">{students.length === 0 ? 'Ancora nessuno studente registrato.' : 'Nessuno studente in questa lista.'}</p>}
          {list.map((r) => {
            const done = progress[r.id] ?? 0;
            const pct = totalLessons ? Math.min(100, Math.round((done / totalLessons) * 100)) : 0;
            return (
              <div className="trow" key={r.id}>
                <div className="who">
                  <span className="who-avatar" aria-hidden="true">{(r.full_name || r.email).slice(0, 2).toUpperCase()}</span>
                  <span className="who-text">
                    <strong>{r.full_name || '—'}</strong>
                    <span>{r.email}</span>
                  </span>
                </div>
                <span className="muted">{formatDate(r.created_at)}</span>
                <div className="mini-progress">
                  <div className="progress thin"><div style={{ width: `${pct}%` }} /></div>
                  <span className="muted small">{pct}%</span>
                </div>
                <div>
                  {r.status === 'active' && <span className="status status-active"><i />Attivo</span>}
                  {r.status === 'pending' && <span className="status status-pending"><i />In attesa</span>}
                  {r.status === 'blocked' && <span className="status status-blocked"><i />Bloccato</span>}
                </div>
                <div>
                  {r.is_admin ? (
                    <span className="muted small">Admin</span>
                  ) : r.status === 'active' ? (
                    <button type="button" className="btn btn-outline btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r, 'blocked')}>
                      <IconLock size={16} /> Blocca
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm" disabled={busyId === r.id} onClick={() => setStatus(r, 'active')}>
                      <IconLockOpen size={16} /> {r.status === 'blocked' ? 'Riattiva' : 'Sblocca'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Lezioni ---------------------------------- */

interface Draft {
  id: string | null;
  module_id: string;
  title: string;
  video_url: string;
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

function LessonsTab() {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
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

  const swap = async (table: 'modules' | 'lessons', a: { id: string; position: number }, b: { id: string; position: number }, ia: number, ib: number) => {
    // Le posizioni vengono rinumerate in base all'ordine attuale, così lo spostamento funziona sempre.
    await Promise.all([
      supabase.from(table).update({ position: ib }).eq('id', a.id),
      supabase.from(table).update({ position: ia }).eq('id', b.id),
    ]);
  };

  const moveModule = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= modules.length) return;
    await Promise.all(modules.map((m, i) => (m.position !== i ? supabase.from('modules').update({ position: i }).eq('id', m.id) : null)));
    await swap('modules', modules[index], modules[j], index, j);
    await load();
  };

  const moveLesson = async (moduleId: string, index: number, dir: -1 | 1) => {
    const list = byModule[moduleId] ?? [];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    await Promise.all(list.map((l, i) => (l.position !== i ? supabase.from('lessons').update({ position: i }).eq('id', l.id) : null)));
    await swap('lessons', list[index], list[j], index, j);
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
    setDraft({ id: null, module_id: moduleId ?? modules[0]?.id ?? '', title: '', video_url: '', description: '', transcript: '', resources: '', published: true });
  };

  const startEdit = (l: Lesson) => {
    setDraft({
      id: l.id, module_id: l.module_id, title: l.title, video_url: l.video_url, description: l.description,
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
      const position = siblings.length ? Math.max(...siblings.map((s) => s.position)) + 1 : 0;
      const res = await supabase.from('lessons').insert({ ...payload, position }).select('id').single();
      error = res.error;
      if (res.data) setDraft({ ...draft, id: (res.data as { id: string }).id });
    }
    setSaving(false);
    if (error) return flash('err', 'Lezione non salvata. Riprova.');
    setOpen((o) => ({ ...o, [draft.module_id]: true }));
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

  if (!loaded) return <p className="muted">Caricamento lezioni…</p>;

  const withVideo = lessons.filter((l) => parseVideo(l.video_url)).length;
  const video = draft ? parseVideo(draft.video_url) : null;

  return (
    <div className="admin-lessons">
      <div className="admin-lessons-list stack-md">
        <div className="toolbar">
          <span className="muted">{lessons.length} lezioni · {withVideo} con video · {lessons.filter((l) => l.published).length} pubblicate</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => startNew()} disabled={!modules.length}>
            <IconPlus size={16} /> Nuova lezione
          </button>
        </div>

        {msg && <p className={msg.kind === 'ok' ? 'flash ok' : 'flash err'} role="status">{msg.text}</p>}

        {modules.map((m, mi) => {
          const list = byModule[m.id] ?? [];
          const isOpen = !!open[m.id];
          return (
            <div className="admin-module" key={m.id}>
              <div className="admin-module-head">
                {renaming?.id === m.id ? (
                  <div className="rename">
                    <input aria-label="Nome del modulo" value={renaming.title} onChange={(e) => setRenaming({ id: m.id, title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && saveRename()} autoFocus />
                    <button type="button" className="btn btn-primary btn-sm" onClick={saveRename}>Salva</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenaming(null)}>Annulla</button>
                  </div>
                ) : (
                  <button type="button" className="admin-module-toggle" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [m.id]: !isOpen }))}>
                    <strong>{m.title}</strong>
                    <span className="muted small">{list.length} {list.length === 1 ? 'lezione' : 'lezioni'}</span>
                    {isOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                  </button>
                )}
                <div className="icon-actions">
                  <button type="button" className="icon-btn" aria-label="Sposta su" disabled={mi === 0} onClick={() => moveModule(mi, -1)}><IconChevronUp size={18} /></button>
                  <button type="button" className="icon-btn" aria-label="Sposta giù" disabled={mi === modules.length - 1} onClick={() => moveModule(mi, 1)}><IconChevronDown size={18} /></button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenaming({ id: m.id, title: m.title })}>Rinomina</button>
                  {confirmDelete === m.id ? (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteModule(m.id)}>Conferma: elimina modulo e lezioni</button>
                  ) : (
                    <button type="button" className="icon-btn" aria-label="Elimina modulo" onClick={() => setConfirmDelete(m.id)}><IconTrash size={18} /></button>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="admin-module-body">
                  {list.length === 0 && <p className="muted small pad">Nessuna lezione in questo modulo.</p>}
                  {list.map((l, li) => (
                    <div className={draft?.id === l.id ? 'admin-lesson selected' : 'admin-lesson'} key={l.id}>
                      <div className="icon-actions">
                        <button type="button" className="icon-btn" aria-label="Sposta su" disabled={li === 0} onClick={() => moveLesson(m.id, li, -1)}><IconChevronUp size={16} /></button>
                        <button type="button" className="icon-btn" aria-label="Sposta giù" disabled={li === list.length - 1} onClick={() => moveLesson(m.id, li, 1)}><IconChevronDown size={16} /></button>
                      </div>
                      <span className="admin-lesson-title">{l.title}</span>
                      {parseVideo(l.video_url) ? <span className="status status-active"><i />Video</span> : <span className="status status-muted"><i />Senza video</span>}
                      {l.published ? <span className="status status-active"><i />Pubblicata</span> : <span className="status status-pending"><i />Bozza</span>}
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
          <input aria-label="Nome del nuovo modulo" placeholder="Nome del nuovo modulo" value={newModule} onChange={(e) => setNewModule(e.target.value)} />
          <button type="submit" className="btn btn-outline btn-sm"><IconPlus size={16} /> Nuovo modulo</button>
        </form>
      </div>

      <div className="admin-editor">
        {!draft ? (
          <div className="card stack-sm">
            <h2 className="h3">Modifica lezioni</h2>
            <p className="muted">Premi <strong>Modifica</strong> su una lezione, oppure <strong>Nuova lezione</strong>, per inserire titolo, video, descrizione e materiali.</p>
          </div>
        ) : (
          <form className="card form" onSubmit={saveDraft}>
            <h2 className="h3">{draft.id ? 'Modifica lezione' : 'Nuova lezione'}</h2>
            <label className="field">
              Modulo
              <select value={draft.module_id} onChange={(e) => setDraft({ ...draft, module_id: e.target.value })}>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </label>
            <label className="field">
              Titolo della lezione
              <input required value={draft.title} placeholder="Es. Scrivere lo script della VSL" onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="field">
              Link del video (Bunny Stream, Vimeo o YouTube)
              <input type="url" value={draft.video_url} placeholder="https://iframe.mediadelivery.net/embed/…" onChange={(e) => setDraft({ ...draft, video_url: e.target.value })} />
              {draft.video_url.trim() && (
                video ? <span className="hint ok">Video riconosciuto: {video.provider}</span> : <span className="hint err">Link non riconosciuto: incolla il link del video da Bunny Stream, Vimeo o YouTube</span>
              )}
            </label>
            <label className="field">
              Descrizione
              <textarea rows={4} value={draft.description} placeholder="Cosa impara lo studente in questa lezione" onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </label>
            <label className="field">
              Materiali e link (uno per riga: Nome | link)
              <textarea rows={3} value={draft.resources} placeholder={'Slide della lezione | https://drive.google.com/…'} onChange={(e) => setDraft({ ...draft, resources: e.target.value })} />
            </label>
            <label className="field">
              Trascrizione (facoltativa)
              <textarea rows={4} value={draft.transcript} onChange={(e) => setDraft({ ...draft, transcript: e.target.value })} />
            </label>
            <label className="check">
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
              <span>Pubblicata (visibile agli studenti)</span>
            </label>
            <div className="row-gap wrap">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvataggio…' : 'Salva lezione'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>Chiudi</button>
              {draft.id && (
                confirmDelete === draft.id ? (
                  <button type="button" className="btn btn-danger" onClick={() => deleteLesson(draft.id!)}>Conferma eliminazione</button>
                ) : (
                  <button type="button" className="btn btn-ghost text-red" onClick={() => setConfirmDelete(draft.id)}><IconTrash size={16} /> Elimina</button>
                )
              )}
            </div>
            {draft.id && <a className="link small" href={`/lezione/${draft.id}`} target="_blank" rel="noreferrer">Apri l’anteprima della lezione</a>}
          </form>
        )}
      </div>
    </div>
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
    const rows = (Object.keys(s) as (keyof Settings)[]).map((key) => ({ key, value: s[key].trim() }));
    const { error } = await supabase.from('settings').upsert(rows);
    if (error) return setState('error');
    await fetchSettings(true);
    setState('saved');
  };

  if (state === 'loading') return <p className="muted">Caricamento…</p>;

  return (
    <form className="card form narrow-form" onSubmit={save}>
      <h2 className="h3">Link e informazioni per gli studenti</h2>
      <label className="field">
        Prossima call di gruppo (testo libero)
        <input value={s.meeting_when} placeholder="Es. Giovedì 20 novembre, ore 18:00" onChange={(e) => setS({ ...s, meeting_when: e.target.value })} />
      </label>
      <label className="field">
        Link della call (Zoom, Google Meet…)
        <input type="url" value={s.meeting_url} placeholder="https://meet.google.com/…" onChange={(e) => setS({ ...s, meeting_url: e.target.value })} />
      </label>
      <label className="field">
        Link di invito a Slack
        <input type="url" value={s.slack_url} placeholder="https://join.slack.com/…" onChange={(e) => setS({ ...s, slack_url: e.target.value })} />
      </label>
      <label className="field">
        Email di supporto
        <input type="email" value={s.support_email} placeholder="supporto@brandtoclient.com" onChange={(e) => setS({ ...s, support_email: e.target.value })} />
      </label>
      <div className="row-gap">
        <button type="submit" className="btn btn-primary" disabled={state === 'saving'}>{state === 'saving' ? 'Salvataggio…' : 'Salva'}</button>
        {state === 'saved' && <span className="muted small">Salvato</span>}
        {state === 'error' && <span className="form-error small">Non salvato, riprova</span>}
      </div>
    </form>
  );
}
