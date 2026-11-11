# Brand To Client – Area studenti

Piattaforma corsi di Brand To Client: gli studenti si registrano, l'admin sblocca l'accesso e gli studenti seguono le lezioni video.

- **Sito:** React + Vite, pubblicato su Vercel (ogni modifica su `main` va online da sola).
- **Account e dati:** Supabase (progetto `brand-to-client`, Francoforte). Le regole di accesso sono nel database (`supabase/schema.sql`).
- **Video:** Bunny Stream (consigliato), Vimeo o YouTube. Nel pannello admin si incolla il link del video.

## Come si usa (admin)

1. Vai su `/admin` (pulsante "Pannello admin" in alto).
2. **Studenti:** chi si registra compare "In attesa". Premi **Sblocca** per dargli accesso, **Blocca** per toglierlo.
3. **Lezioni:** premi **Nuova lezione**, scegli il modulo, scrivi il titolo, incolla il link del video, salva.
4. **Impostazioni:** link della call settimanale, link Slack, email di supporto.

## Sviluppo

```bash
npm install
npm run dev
```
