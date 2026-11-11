export type ProfileStatus = 'pending' | 'active' | 'blocked';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  status: ProfileStatus;
  is_admin: boolean;
  created_at: string;
  activated_at: string | null;
}

export interface Module {
  id: string;
  title: string;
  position: number;
}

export interface Resource {
  label: string;
  url: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  video_url: string;
  action: string;
  transcript: string;
  resources: Resource[];
  position: number;
  published: boolean;
}

export interface Settings {
  meeting_url: string;
  telegram_url: string;
  support_email: string;
  /** Giorno della call settimanale: 1 = lunedì … 7 = domenica. */
  call_weekday: string;
  /** Ora della call, ora italiana (es. "18:00"). */
  call_time: string;
  /** Per quanti mesi ogni studente ha le call, dal giorno dello sblocco (es. "3"). */
  call_months: string;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}
