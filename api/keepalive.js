// Controllo automatico giornaliero (Vercel Cron, vedi vercel.json).
// Fa una vera lettura sul database così il progetto Supabase gratuito
// non risulta mai inattivo e non va in pausa dopo 7 giorni.
// Legge solo la tabella "heartbeat", che non contiene dati personali.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lhymcknoojjhkesqorlq.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_z-0lXakVJtLsK4Wr8BKLmg__wxW0EDq';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    // Tre letture a qualche secondo di distanza: Supabase considera "attivo"
    // un progetto che riceve qualche richiesta al giorno.
    const statuses = [];
    for (let i = 0; i < 3; i++) {
      if (i) await new Promise((done) => setTimeout(done, 2000));
      const r = await fetch(`${SUPABASE_URL}/rest/v1/heartbeat?select=id&limit=1`, {
        headers: { apikey: SUPABASE_KEY },
      });
      statuses.push(r.status);
    }
    const ok = statuses.every((s) => s >= 200 && s < 300);
    res.status(ok ? 200 : 502).json({ ok, statuses, at: new Date().toISOString() });
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), at: new Date().toISOString() });
  }
}
