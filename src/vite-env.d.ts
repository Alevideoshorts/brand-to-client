/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'player.js' {
  interface PlayerjsPlayer {
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback?: (...args: unknown[]) => void): void;
  }
  const playerjs: { Player: new (el: HTMLIFrameElement) => PlayerjsPlayer };
  export default playerjs;
}
