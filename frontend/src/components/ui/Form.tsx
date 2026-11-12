import { forwardRef, useEffect, useMemo, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import clsx from 'clsx';

export function Field({ label, error, hint, children, className, required }: { label?: string; error?: string; hint?: string; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}{required && <span className="text-red-500"> *</span>}</label>}
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-navy-400">{hint}</p> : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ invalid, className, ...p }, ref) {
  return <input ref={ref} className={clsx('input', invalid && 'input-error', className)} {...p} />;
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; options: { value: string; label: string }[]; placeholder?: string };
export function Select({ invalid, className, options, placeholder, ...p }: SelectProps) {
  return (
    <select className={clsx('input appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2716%27%20height%3D%2716%27%20fill%3D%27none%27%20stroke%3D%27%234F6FA3%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27M4%206l4%204%204-4%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9', invalid && 'input-error', className)} {...p}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };
export function Textarea({ invalid, className, ...p }: TextareaProps) {
  return <textarea className={clsx('input min-h-[96px] resize-y', invalid && 'input-error', className)} {...p} />;
}

/** Searchable dropdown (combobox). */
export function SearchSelect({ value, onChange, options, placeholder = 'Select…', invalid, className }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string; sub?: string }[]; placeholder?: string; invalid?: boolean; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => options.filter((o) => `${o.label} ${o.sub ?? ''}`.toLowerCase().includes(q.toLowerCase())), [options, q]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={clsx('input flex items-center justify-between text-left', invalid && 'input-error')}>
        <span className={clsx('truncate', !selected && 'text-navy-300')}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-navy-400" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-navy-100 bg-white shadow-lift">
          <div className="flex items-center gap-2 border-b border-navy-50 px-3">
            <Search className="h-4 w-4 text-navy-300" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full py-2.5 text-sm outline-none" />
          </div>
          <ul className="scrollbar-thin max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-3 text-sm text-navy-400">No matches</li>}
            {filtered.map((o) => (
              <li key={o.value}>
                <button type="button" onClick={() => { onChange(o.value); setOpen(false); setQ(''); }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-navy-50">
                  <span><span className="text-navy-900">{o.label}</span>{o.sub && <span className="ml-2 text-xs text-navy-400">{o.sub}</span>}</span>
                  {o.value === value && <Check className="h-4 w-4 text-gold-600" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
