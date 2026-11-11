# Brand To Client – Area studenti

Piattaforma del percorso Brand To Client: gli studenti si registrano, l'admin sblocca l'accesso e gli studenti seguono le lezioni video.

- **Sito:** React + Vite, pubblicato su Vercel (ogni modifica su `main` va online da sola).
- **Account e dati:** Supabase (progetto `brand-to-client`, Francoforte). Le regole di accesso sono nel database (`supabase/schema.sql`).
- **Video:** Bunny Stream (consigliato, con domini autorizzati), oppure Vimeo. Nel pannello admin si incolla il link del video.

## Pagine

- `/accedi`, `/registrati`, `/password-dimenticata`, `/nuova-password`
- `/attesa` – lo studente registrato aspetta lo sblocco
- `/` – home con 3 scelte: corso, gruppo Slack, call settimanale (conto alla rovescia)
- `/corso/:lezione` – moduli a tendina a sinistra (uno aperto alla volta), video e lezione a destra. La lezione si segna come vista da sola quando il video arriva alla fine.
- `/admin` – studenti (sblocca/blocca), moduli e lezioni, impostazioni (prima call, numero di call, link call, Slack, email supporto)

## Sviluppo

```bash
npm install
npm run dev
```
