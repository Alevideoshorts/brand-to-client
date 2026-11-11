import type { ReactNode } from 'react';

export default function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="auth">
      <section className="auth-visual">
        <img src="/cover.jpg" alt="" />
        <div className="auth-visual-text">
          <p className="eyebrow">Percorso di 90 giorni</p>
          <h1>Brand To Client</h1>
          <p>Trasforma il tuo personal brand in un sistema che porta clienti.</p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-box">
          <div className="auth-brand">
            <img src="/logo.png" alt="Logo InfoFormatVirale" width={54} height={54} />
            <span>
              <strong>Brand To Client</strong>
              <span>Area studenti</span>
            </span>
          </div>
          <div className="auth-heading">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
