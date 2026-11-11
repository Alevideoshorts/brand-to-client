import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft } from './Icons';
import LegalFooter from './LegalFooter';

export default function AuthLayout({ title, subtitle, wide = false, backTo, children }: { title: string; subtitle?: string; wide?: boolean; backTo?: string; children: ReactNode }) {
  return (
    <div className="auth">
      <img className="auth-bg" src="/cover.jpg" alt="" />
      <div className={wide ? 'auth-card wide' : 'auth-card'}>
        {backTo && (
          <Link to={backTo} className="auth-back"><IconArrowLeft size={18} /> Indietro</Link>
        )}
        <div className="auth-brand">
          <img src="/logo.png" alt="Logo InfoFormatVirale" width={68} height={68} />
          <span>Brand To Client</span>
        </div>
        <div className="auth-head">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </div>
      <LegalFooter compact />
    </div>
  );
}
