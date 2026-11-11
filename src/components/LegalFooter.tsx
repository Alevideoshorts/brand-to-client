import { Link } from 'react-router-dom';
import { COMPANY } from '../lib/company';

export default function LegalFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={compact ? 'legal-footer compact' : 'legal-footer'}>
      <nav aria-label="Informazioni legali">
        <Link to="/privacy">Privacy</Link>
        <span aria-hidden="true">·</span>
        <Link to="/termini">Termini di utilizzo</Link>
      </nav>
      <span>© {new Date().getFullYear()} {COMPANY.name} · P.IVA {COMPANY.vat}</span>
    </footer>
  );
}
