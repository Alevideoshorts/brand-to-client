import { useEffect, useRef } from 'react';
import playerjs from 'player.js';
import { parseVideo, withAutoplay } from '../lib/video';
import { IconVideo } from './Icons';

interface Props {
  url: string;
  title: string;
  autoplay: boolean;
  onEnded: () => void;
}

export default function VideoPlayer({ url, title, autoplay, onEnded }: Props) {
  const source = parseVideo(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;

  const src = source ? withAutoplay(source, autoplay) : '';

  useEffect(() => {
    const el = iframeRef.current;
    if (!el || !source || source.kind !== 'iframe' || source.provider === 'YouTube') return;
    let cancelled = false;
    try {
      const player = new playerjs.Player(el);
      player.on('ready', () => {
        if (cancelled) return;
        player.on('ended', () => endedRef.current());
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
        <video key={src} src={src} controls controlsList="nodownload" playsInline autoPlay={autoplay} onEnded={() => endedRef.current()} />
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
