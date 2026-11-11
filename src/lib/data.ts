import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Lesson, ModuleWithLessons, Settings } from './types';

export const EMPTY_SETTINGS: Settings = { meeting_url: '', slack_url: '', support_email: '', call_first_at: '', call_count: '8' };

let settingsCache: Settings | null = null;

export async function fetchSettings(force = false): Promise<Settings> {
  if (settingsCache && !force) return settingsCache;
  const { data } = await supabase.from('settings').select('key,value');
  const s: Settings = { ...EMPTY_SETTINGS };
  (data ?? []).forEach((row: { key: string; value: string }) => {
    if (row.key in s) (s as unknown as Record<string, string>)[row.key] = row.value;
  });
  settingsCache = s;
  return s;
}

export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(settingsCache ?? EMPTY_SETTINGS);
  useEffect(() => {
    let alive = true;
    fetchSettings().then((s) => alive && setSettings(s));
    return () => {
      alive = false;
    };
  }, []);
  return settings;
}

export interface CourseData {
  modules: ModuleWithLessons[];
  lessons: Lesson[];
  done: Set<string>;
  lastLessonId: string | null;
}

export async function fetchCourse(userId: string): Promise<CourseData> {
  const [mods, less, prog, state] = await Promise.all([
    supabase.from('modules').select('id,title,position').order('position').order('created_at'),
    supabase.from('lessons').select('*').order('position').order('created_at'),
    supabase.from('lesson_progress').select('lesson_id').eq('user_id', userId),
    supabase.from('user_state').select('last_lesson_id').eq('user_id', userId).maybeSingle(),
  ]);
  const lessons = ((less.data ?? []) as Lesson[]).map((l) => ({ ...l, resources: Array.isArray(l.resources) ? l.resources : [] }));
  const modules: ModuleWithLessons[] = ((mods.data ?? []) as ModuleWithLessons[]).map((m) => ({
    ...m,
    lessons: lessons.filter((l) => l.module_id === m.id),
  }));
  const ordered = modules.flatMap((m) => m.lessons);
  return {
    modules,
    lessons: ordered,
    done: new Set(((prog.data ?? []) as { lesson_id: string }[]).map((p) => p.lesson_id)),
    lastLessonId: (state.data as { last_lesson_id: string | null } | null)?.last_lesson_id ?? null,
  };
}

export function useCourse(userId: string | undefined) {
  const [data, setData] = useState<CourseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      setData(await fetchCourse(userId));
      setError(null);
    } catch {
      setError('Impossibile caricare il corso. Riprova tra poco.');
    }
  }, [userId]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, setData, error, reload };
}

/** Lezioni che lo studente vede: pubblicate (l'admin vede anche le bozze, segnate). */
export function visibleLessons(data: CourseData, isAdmin: boolean): Lesson[] {
  return data.lessons.filter((l) => l.published || isAdmin);
}

export function resumeLesson(data: CourseData, isAdmin: boolean): Lesson | null {
  const list = visibleLessons(data, isAdmin);
  if (!list.length) return null;
  const last = data.lastLessonId ? list.find((l) => l.id === data.lastLessonId) : null;
  if (last) return last;
  return list.find((l) => !data.done.has(l.id)) ?? list[0];
}
