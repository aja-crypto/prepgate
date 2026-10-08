import { useState } from 'react';

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  className = '',
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...inputProps}
        className={`w-full bg-bg-2 border border-white/8 rounded-lg px-4 py-3 pr-11 text-sm text-text placeholder:text-text3 focus:outline-none focus:border-primary/70 focus:shadow-[0_0_16px_-6px_rgba(139,92,246,0.5)] transition-[border-color,box-shadow] duration-[180ms] ease-out ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-text text-xs font-medium rounded-md px-1.5 py-1 transition-[color,background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
