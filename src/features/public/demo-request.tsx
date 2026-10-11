import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Button, Field, Form, Modal } from '../../components/ui';
import { digitsOnly, isTenDigitMobile } from '../../lib/mobile';
import { toastErr, toastOk } from '../../lib/toast';

const EVENT = 'rs-open-demo';

export function openDemo() {
  window.dispatchEvent(new Event(EVENT));
}

export function DemoModalHost() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', email: '', businessName: '' });

  useEffect(() => {
    const onOpen = () => { setSent(false); setOpen(true); };
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.businessName.trim()) { toastErr('Name and business are required.'); return; }
    if (!isTenDigitMobile(form.mobile)) { toastErr('Enter a 10-digit mobile number.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { toastErr('Enter a valid email.'); return; }
    setBusy(true);
    try {
      await api('/public/demos', { method: 'POST', body: JSON.stringify(form) });
      setSent(true);
      toastOk('Demo request sent.');
    } catch {
      /* api toasts */
    } finally { setBusy(false); }
  }

  return (
    <Modal title="Book a free demo" text="We will call you to walk through a live QR for your shop." onClose={() => setOpen(false)}>
      {sent ? (
        <div className="py-4 text-center">
          <p className="font-display text-xl font-semibold">Request received.</p>
          <p className="mt-2 text-sm text-stone-500">Thanks {form.name.split(' ')[0]}. We will use {form.mobile} to set a time.</p>
          <Button className="mt-5" type="button" onClick={() => setOpen(false)}>Close</Button>
        </div>
      ) : (
        <Form onSubmit={submit} className="space-y-3">
          <Field label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          <Field label="Mobile" value={form.mobile} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" onChange={(event) => setForm((current) => ({ ...current, mobile: digitsOnly(event.target.value) }))} required />
          <Field label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          <Field label="Business" value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))} required />
          <Button type="submit" className="w-full" busy={busy}>Book a free demo</Button>
        </Form>
      )}
    </Modal>
  );
}
