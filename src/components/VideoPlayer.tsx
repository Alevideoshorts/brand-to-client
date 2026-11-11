import { useEffect, useRef } from 'react';
import playerjs from 'player.js';
import { parseVideo } from '../lib/video';
import { IconVideo } from './Icons';

interface Props {
  url: string;
  title: string;
  /** Chiamata una sola volta quando lo studente arriva alla fine del video (ultimi secondi inclusi). */
  onWatched: () => void;
}

const WATCHED_RATIO = 0.95;

export default function VideoPlayer({ url, title, onWatched }: Props) {
  const source = parseVideo(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const watchedRef = useRef(onWatched);
  watchedRef.current = onWatched;
  const firedRef = useRef(false);

  const src = source?.src ?? '';

  useEffect(() => {
    firedRef.current = false;
  }, [src]);

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    watchedRef.current();
  };

  useEffect(() => {
    const el = iframeRef.current;
    if (!el || !source || source.kind !== 'iframe' || source.provider === 'YouTube') return;
    let cancelled = false;
    try {
      const player = new playerjs.Player(el);
      player.on('ready', () => {
        if (cancelled) return;
        player.on('ended', () => fire());
        player.on('timeupdate', (data: unknown) => {
          const d = data as { seconds?: number; duration?: number } | undefined;
          if (d && d.duration && d.seconds && d.seconds / d.duration >= WATCHED_RATIO) fire();
        });
      });
    } catch {
      // Il player non supporta gli eventi: il video funziona comunque.
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (!source) {
    return (
      <div className="player player-empty">
        <img src="/cover.jpg" alt="" />
        <div className="player-empty-msg">
          <IconVideo size={28} />
          <span>Il video di questa lezione sarà disponibile a breve.</span>
        </div>
      </div>
    );
  }

  if (source.kind === 'file') {
    return (
      <div className="player">
        <video
          key={src}
          src={src}
          controls
          controlsList="nodownload"
          playsInline
          onEnded={fire}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration && v.currentTime / v.duration >= WATCHED_RATIO) fire();
          }}
        />
      </div>
    );
  }

  return (
    <div className="player">
      <iframe
        key={src}
        ref={iframeRef}
        src={src}
        title={title}
        loading="eager"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
