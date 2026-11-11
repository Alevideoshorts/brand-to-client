export type VideoSource =
  | { kind: 'iframe'; provider: 'Bunny Stream' | 'Vimeo' | 'YouTube'; src: string }
  | { kind: 'file'; provider: 'File video'; src: string };

function youtube(id: string): VideoSource | null {
  if (!id || !/^[\w-]{6,}$/.test(id)) return null;
  return { kind: 'iframe', provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` };
}

/** Trasforma il link incollato nel pannello admin nel link "embed" del player. */
export function parseVideo(raw: string): VideoSource | null {
  const url = (raw || '').trim();
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '');

  if (host === 'iframe.mediadelivery.net' || host === 'player.mediadelivery.net' || host === 'video.bunnycdn.com') {
    const m = u.pathname.match(/\/(?:embed|play)\/(\d+)\/([\w-]+)/);
    if (m) {
      return { kind: 'iframe', provider: 'Bunny Stream', src: `https://iframe.mediadelivery.net/embed/${m[1]}/${m[2]}?autoplay=false&preload=true&responsive=true` };
    }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/^(?:\/video)?\/(\d+)(?:\/([\da-f]+))?/);
    if (m) {
      const hash = m[2] || u.searchParams.get('h');
      const params = new URLSearchParams({ dnt: '1', title: '0', byline: '0', portrait: '0' });
      if (hash) params.set('h', hash);
      return { kind: 'iframe', provider: 'Vimeo', src: `https://player.vimeo.com/video/${m[1]}?${params.toString()}` };
    }
  }

  if (host === 'youtu.be') return youtube(u.pathname.slice(1));
  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || '';
    return youtube(id);
  }

  if (/\.(mp4|webm|m4v|mov)$/i.test(u.pathname)) {
    return { kind: 'file', provider: 'File video', src: url };
  }
  return null;
}
