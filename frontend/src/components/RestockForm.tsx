import { useState, type FormEvent } from 'react';
import Modal from './Modal';
import type { Vehicle } from '../types';

export default function RestockForm({ vehicle, onSubmit, onClose, serverError }: {
  vehicle: Vehicle; onSubmit: (qty: number) => Promise<void>; onClose: () => void; serverError: string;
}) {
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(qty);
    if (qty.trim() === '' || !Number.isInteger(n) || n < 1 || n > 10000) {
      return setError('Enter a whole number from 1 to 10,000.');
    }
    setError('');
    setBusy(true);
    await onSubmit(n);
    setBusy(false);
  }

  return (
    <Modal title={`Restock ${vehicle.make} ${vehicle.model}`} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="text-sm text-dim">Currently {vehicle.quantity} in stock.</p>
        <label className="mt-4 block text-sm text-dim" htmlFor="r-qty">Units to add</label>
        <input id="r-qty" inputMode="numeric" className="field mt-1" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
        {(error || serverError) && <p role="alert" className="mt-4 text-sm text-bad">{error || serverError}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Adding…' : 'Add stock'}</button>
        </div>
      </form>
    </Modal>
  );
}
