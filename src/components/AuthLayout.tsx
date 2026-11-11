import type { ReactNode } from 'react';
import LegalFooter from './LegalFooter';

export default function AuthLayout({ title, subtitle, wide = false, children }: { title: string; subtitle?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className="auth">
      <img className="auth-bg" src="/cover.jpg" alt="" />
      <div className={wide ? 'auth-card wide' : 'auth-card'}>
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
