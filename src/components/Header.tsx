import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/data';
import { IconEye, IconLogout, IconShield } from './Icons';

function initials(name: string, email: string) {
  const src = name.trim() || email;
  const parts = src.split(/[\s.@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'BTC';
}

export default function Header({ admin = false }: { admin?: boolean }) {
  const { profile, signOut } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const logout = async () => {
    await signOut();
    navigate('/accedi');
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand-pill">
          <img src="/logo.png" alt="Logo InfoFormatVirale" width={40} height={40} />
          <span className="brand-pill-text">
            <strong>Brand To Client</strong>
            <span className={admin ? 'brand-role admin' : 'brand-role'}>{admin ? 'Admin' : profile?.is_admin ? 'Admin' : 'Studente'}</span>
          </span>
        </Link>
        {!admin && (
          <nav className="mainnav" aria-label="Menu principale">
            <NavLink to="/" end>I miei corsi</NavLink>
            {settings.slack_url ? (
              <a href={settings.slack_url} target="_blank" rel="noreferrer">Community</a>
            ) : (
              <a href="/#community">Community</a>
            )}
            {settings.meeting_url ? (
              <a href={settings.meeting_url} target="_blank" rel="noreferrer">Meeting</a>
            ) : (
              <a href="/#meeting">Meeting</a>
            )}
          </nav>
        )}
        <div className="topbar-actions">
          {profile?.is_admin && !admin && (
            <Link to="/admin" className="btn-admin">
              <IconShield size={16} /> Pannello admin
            </Link>
          )}
          {admin && (
            <Link to="/" className="btn btn-outline btn-sm">
              <IconEye size={18} /> Vedi come studente
            </Link>
          )}
          <div className="usermenu" ref={menuRef}>
            <button type="button" className="avatar" aria-label="Il tuo profilo" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              {initials(profile?.full_name ?? '', profile?.email ?? '')}
            </button>
            {open && (
              <div className="usermenu-panel">
                <div className="usermenu-who">
                  <strong>{profile?.full_name || 'Il tuo account'}</strong>
                  <span>{profile?.email}</span>
                </div>
                <button type="button" className="usermenu-item" onClick={logout}>
                  <IconLogout size={18} /> Esci
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
