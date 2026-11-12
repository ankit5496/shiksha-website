import { useState, type FormEvent } from 'react';

export type Validator<T> = (value: T[keyof T], values: T) => string | undefined;
export type Rules<T> = Partial<Record<keyof T, Validator<T>[]>>;

export const v = {
  required: (msg = 'This field is required') => (val: unknown) =>
    (val === undefined || val === null || String(val).trim() === '' || (Array.isArray(val) && val.length === 0) ? msg : undefined),
  email: (msg = 'Enter a valid email address') => (val: unknown) => (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val)) ? msg : undefined),
  phone: (msg = 'Enter a valid 10-digit mobile number') => (val: unknown) => (val && String(val).replace(/\D/g, '').replace(/^91/, '').length !== 10 ? msg : undefined),
  min: (n: number, msg?: string) => (val: unknown) => (val !== '' && Number(val) < n ? msg ?? `Must be at least ${n}` : undefined),
  max: (n: number, msg?: string) => (val: unknown) => (val !== '' && Number(val) > n ? msg ?? `Must be at most ${n}` : undefined),
  minLength: (n: number, msg?: string) => (val: unknown) => (val && String(val).trim().length < n ? msg ?? `Must be at least ${n} characters` : undefined),
};

/** Small form-state + validation helper used by all forms in the app. */
export function useForm<T extends Record<string, unknown>>(initial: T, rules: Rules<T> = {}) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateField = (k: keyof T, all: T) => {
    for (const fn of rules[k] ?? []) { const e = fn(all[k], all); if (e) return e; }
    return undefined;
  };

  const set = <K extends keyof T>(k: K, val: T[K]) => {
    setValues((prev) => {
      const next = { ...prev, [k]: val };
      if (errors[k]) setErrors((er) => ({ ...er, [k]: validateField(k, next) }));
      return next;
    });
  };

  const validate = () => {
    const next: Partial<Record<keyof T, string>> = {};
    (Object.keys(rules) as (keyof T)[]).forEach((k) => { const e = validateField(k, values); if (e) next[k] = e; });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (fn: (vals: T) => Promise<void> | void) => async (e?: FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try { await fn(values); } finally { setSubmitting(false); }
  };

  const reset = (to: T = initial) => { setValues(to); setErrors({}); };

  /** Spread onto inputs: {...bind('name')} */
  const bind = (k: keyof T) => ({
    value: (values[k] ?? '') as string | number,
    onChange: (e: { target: { value: string } }) => set(k, e.target.value as T[keyof T]),
    invalid: !!errors[k],
  });

  return { values, errors, set, setValues, validate, handleSubmit, submitting, reset, bind };
}
