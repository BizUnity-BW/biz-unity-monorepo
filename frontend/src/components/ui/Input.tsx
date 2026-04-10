import { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <input className="border rounded px-3 py-2 text-sm" {...props} />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
