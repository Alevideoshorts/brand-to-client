import { useState, type InputHTMLAttributes } from 'react';
import { IconEye, IconEyeOff } from './Icons';

/** Campo password con il pulsante per mostrare o nascondere quello che si sta scrivendo. */
export default function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="pw-wrap">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="pw-toggle"
        aria-label={visible ? 'Nascondi password' : 'Mostra password'}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <IconEyeOff size={20} /> : <IconEye size={20} />}
      </button>
    </span>
  );
}
