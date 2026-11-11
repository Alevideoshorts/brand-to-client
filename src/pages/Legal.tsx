import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import LegalFooter from '../components/LegalFooter';
import { IconArrowLeft } from '../components/Icons';
import { COMPANY, LEGAL_UPDATED } from '../lib/company';

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="legal">
      <header className="legal-header">
        <Link to="/" className="hub-brand">
          <img src="/logo.png" alt="Logo InfoFormatVirale" width={40} height={40} />
          <span>Brand To Client</span>
        </Link>
        <Link to="/" className="legal-back"><IconArrowLeft size={18} /> Torna alla piattaforma</Link>
      </header>
      <main className="legal-main">
        <h1>{title}</h1>
        <p className="legal-updated">Ultimo aggiornamento: {LEGAL_UPDATED}</p>
        {children}
      </main>
      <LegalFooter />
    </div>
  );
}

const Mail = () => <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>;

export function Privacy() {
  return (
    <LegalLayout title="Informativa privacy">
      <p>
        Questa informativa spiega come trattiamo i dati personali di chi si registra e utilizza la piattaforma Brand To Client
        ({COMPANY.site}), ai sensi del Regolamento (UE) 2016/679 (“GDPR”) e del D.Lgs. 196/2003.
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        {COMPANY.name}, con sede in {COMPANY.address}, P.IVA {COMPANY.vat}.<br />
        Per qualsiasi richiesta sulla privacy puoi scrivere a <Mail />.
      </p>

      <h2>2. Quali dati trattiamo</h2>
      <ul>
        <li><strong>Dati di registrazione:</strong> nome, cognome, indirizzo email e password. La password è conservata solo in forma cifrata e nessuno, nemmeno il titolare, può leggerla.</li>
        <li><strong>Dati di utilizzo del percorso:</strong> data di registrazione e di attivazione dell’accesso, lezioni viste, ultima lezione aperta, data di accettazione di questa informativa e dei Termini di utilizzo.</li>
        <li><strong>Appunti personali:</strong> le note che scrivi nel “quaderno” delle lezioni. Sono visibili solo a te.</li>
        <li><strong>Dati tecnici:</strong> indirizzo IP, tipo di browser e dispositivo, registrati automaticamente dai sistemi dei nostri fornitori per far funzionare e proteggere la piattaforma e per trasmettere i video.</li>
      </ul>

      <h2>3. Perché li trattiamo e su quale base</h2>
      <ul>
        <li><strong>Darti accesso al percorso</strong> (creazione e gestione dell’account, attivazione dell’accesso, videolezioni, avanzamento, call di gruppo settimanali, community): esecuzione del contratto (art. 6.1.b GDPR).</li>
        <li><strong>Comunicazioni di servizio</strong> (ad esempio recupero password, informazioni sulle call e sul percorso): esecuzione del contratto (art. 6.1.b GDPR).</li>
        <li><strong>Sicurezza della piattaforma e tutela dei contenuti</strong> (prevenire accessi non autorizzati, condivisione degli account e diffusione dei materiali): legittimo interesse del titolare (art. 6.1.f GDPR).</li>
        <li><strong>Adempimenti di legge</strong>, ad esempio fiscali e contabili legati all’acquisto: obbligo legale (art. 6.1.c GDPR).</li>
      </ul>
      <p>
        Non usiamo i tuoi dati per pubblicità o profilazione e non prendiamo decisioni basate unicamente su trattamenti automatizzati.
        Il conferimento dei dati di registrazione è necessario per utilizzare la piattaforma: senza non possiamo attivare l’accesso.
      </p>

      <h2>4. A chi affidiamo i dati</h2>
      <p>I dati sono trattati dal titolare e, per conto del titolare, da fornitori che agiscono come responsabili del trattamento:</p>
      <ul>
        <li><strong>Supabase Inc.</strong>: database e gestione degli account. I dati sono conservati su server nell’Unione Europea (Francoforte, Germania).</li>
        <li><strong>Vercel Inc.</strong>: pubblicazione del sito della piattaforma. Può comportare un trasferimento di dati tecnici negli Stati Uniti, che avviene sulla base dell’EU-U.S. Data Privacy Framework e/o delle clausole contrattuali standard approvate dalla Commissione Europea.</li>
        <li><strong>BunnyWay d.o.o.</strong> (bunny.net, Slovenia): archiviazione e trasmissione delle videolezioni.</li>
      </ul>
      <p>
        Le call di gruppo e la community si svolgono su servizi esterni (ad esempio Google Meet o Zoom per le call e Telegram per il gruppo
        degli studenti). Quando li utilizzi, si applicano anche le informative privacy di questi servizi. Nel gruppo Telegram gli altri
        partecipanti vedono il tuo nome e la tua immagine profilo: dalle impostazioni privacy di Telegram puoi nascondere il tuo numero di telefono.
        I dati non sono venduti né diffusi. Possono essere comunicati alle autorità solo se richiesto dalla legge.
      </p>

      <h2>5. Per quanto tempo li conserviamo</h2>
      <p>
        L’accesso al percorso non ha scadenza: conserviamo i dati dell’account finché il tuo account resta attivo e per i 12 mesi successivi
        alla sua chiusura o disattivazione, poi li cancelliamo. Puoi chiederne la cancellazione in qualsiasi momento. I dati necessari per obblighi fiscali e contabili sono conservati
        per il tempo previsto dalla legge (di regola 10 anni). I dati tecnici registrati dai fornitori sono conservati per periodi brevi,
        secondo le loro politiche.
      </p>

      <h2>6. I tuoi diritti</h2>
      <p>
        Puoi chiedere in qualsiasi momento l’accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione del trattamento,
        la portabilità e opporti ai trattamenti basati sul legittimo interesse, scrivendo a <Mail />. Ti risponderemo entro 30 giorni.
        Hai anche il diritto di proporre reclamo al Garante per la protezione dei dati personali
        (<a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer">www.garanteprivacy.it</a>).
      </p>

      <h2>7. Cookie e strumenti simili</h2>
      <p>
        La piattaforma non usa cookie di profilazione, pubblicitari o statistici. Usa solo strumenti tecnici necessari al funzionamento,
        come la memoria del browser per mantenerti connesso, e il player video può usare strumenti tecnici necessari alla riproduzione.
        Per questi strumenti non serve il consenso. I caratteri tipografici sono ospitati sui nostri server e non vengono caricati da servizi esterni.
      </p>

      <h2>8. Minori</h2>
      <p>La piattaforma è rivolta a professionisti e imprese maggiorenni. Non raccogliamo consapevolmente dati di minori di 18 anni.</p>

      <h2>9. Modifiche</h2>
      <p>Potremo aggiornare questa informativa. In caso di modifiche importanti ti avviseremo nella piattaforma o via email.</p>
    </LegalLayout>
  );
}

export function Terms() {
  return (
    <LegalLayout title="Termini di utilizzo">
      <p>
        Questi Termini regolano l’uso della piattaforma Brand To Client ({COMPANY.site}), gestita da {COMPANY.name}, con sede in {COMPANY.address},
        P.IVA {COMPANY.vat} (“noi”). Registrandoti e utilizzando la piattaforma accetti questi Termini.
      </p>

      <h2>1. A chi è rivolta</h2>
      <p>
        La piattaforma è riservata a chi ha acquistato il percorso Brand To Client. Il percorso è rivolto a professionisti e imprese
        che lo utilizzano per la propria attività.
      </p>

      <h2>2. Account</h2>
      <ul>
        <li>Per registrarti devi fornire dati veri e aggiornati, usando la stessa email indicata al momento dell’iscrizione.</li>
        <li>L’accesso ai contenuti viene attivato da noi dopo aver verificato l’iscrizione.</li>
        <li>L’account è <strong>personale</strong>: non può essere ceduto, condiviso o usato da più persone. Sei responsabile della riservatezza della tua password e di tutto ciò che avviene con il tuo account.</li>
      </ul>

      <h2>3. Cosa comprende l’accesso</h2>
      <ul>
        <li>Le videolezioni e i materiali del percorso pubblicati nella piattaforma, <strong>senza scadenza</strong> (accesso “a vita”), per tutto il tempo in cui la piattaforma e il percorso restano attivi. Se in futuro il percorso dovesse essere chiuso, ti avviseremo con congruo preavviso.</li>
        <li>Una call di gruppo a settimana per 3 mesi a partire dalla data di attivazione dell’accesso, nel giorno e nell’orario indicati nella piattaforma. Le call a cui non partecipi non si recuperano.</li>
        <li>L’accesso al gruppo Telegram degli studenti, secondo quanto previsto dal percorso acquistato.</li>
      </ul>
      <p>Possiamo aggiornare, migliorare o riorganizzare lezioni e materiali, mantenendo la sostanza del percorso.</p>

      <h2>4. Contenuti e proprietà intellettuale</h2>
      <p>
        Video, testi, materiali, metodo e marchi presenti nella piattaforma sono di nostra proprietà o dei rispettivi titolari e sono protetti
        dalle leggi sul diritto d’autore. Puoi usarli solo per la tua formazione e per la tua attività. <strong>È vietato</strong> scaricarli,
        registrarli (anche con registrazione dello schermo), copiarli, condividerli, pubblicarli, rivenderli o usarli per formare terzi,
        senza il nostro consenso scritto.
      </p>

      <h2>5. Comportamento nelle call e nella community</h2>
      <p>
        Ti chiediamo rispetto verso gli altri partecipanti, niente spam o promozioni non richieste e riservatezza sulle informazioni
        che gli altri condividono durante le call e nella community.
      </p>

      <h2>6. Sospensione dell’accesso</h2>
      <p>
        In caso di violazione di questi Termini, in particolare condivisione dell’account o diffusione dei contenuti, possiamo sospendere
        o chiudere l’accesso senza rimborso, salvo il diritto di chiedere il risarcimento dei danni.
      </p>

      <h2>7. Pagamenti e rimborsi</h2>
      <p>
        Prezzo e modalità di pagamento sono quelli stabiliti al momento dell’acquisto. <strong>Non sono previsti rimborsi</strong>, nemmeno in caso
        di mancato o parziale utilizzo della piattaforma, delle lezioni o delle call, salvo quanto previsto da norme di legge inderogabili.
      </p>

      <h2>8. Risultati</h2>
      <p>
        Il percorso fornisce metodo, strumenti e supporto. I risultati dipendono dall’impegno, dall’applicazione e dal mercato di ciascuno:
        non garantiamo risultati economici o di fatturato.
      </p>

      <h2>9. Disponibilità del servizio e responsabilità</h2>
      <p>
        Facciamo il possibile perché la piattaforma sia sempre disponibile, ma possono esserci interruzioni per manutenzione o problemi tecnici
        dei fornitori. Nei limiti consentiti dalla legge, non rispondiamo di danni indiretti derivanti dall’uso o dal mancato uso della piattaforma.
      </p>

      <h2>10. Dati personali</h2>
      <p>Il trattamento dei tuoi dati è descritto nell’<Link to="/privacy">Informativa privacy</Link>.</p>

      <h2>11. Modifiche ai Termini</h2>
      <p>Potremo aggiornare questi Termini. Le modifiche importanti ti saranno comunicate nella piattaforma o via email.</p>

      <h2>12. Legge applicabile e foro</h2>
      <p>
        Questi Termini sono regolati dalla legge italiana. Per ogni controversia è competente in via esclusiva il Foro di Monza.
      </p>

      <h2>13. Contatti</h2>
      <p>Per qualsiasi domanda scrivi a <Mail />.</p>
    </LegalLayout>
  );
}
