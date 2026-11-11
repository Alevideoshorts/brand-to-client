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
  slack_url: string;
  support_email: string;
  /** Data e ora della prima call di gruppo (ISO). Le altre sono ogni 7 giorni. */
  call_first_at: string;
  /** Quante call settimanali in tutto (es. 8). */
  call_count: string;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}
