import { useState, type FormEvent } from 'react';
import Modal from './Modal';
import { dollarsToCents } from '../api';
import type { Vehicle, VehicleInput } from '../types';

interface Props {
  vehicle: Vehicle | null; // null = create
  onSubmit: (v: VehicleInput) => Promise<void>;
  onClose: () => void;
  serverError: string;
}

export default function VehicleForm({ vehicle, onSubmit, onClose, serverError }: Props) {
  const [make, setMake] = useState(vehicle?.make ?? '');
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [category, setCategory] = useState(vehicle?.category ?? '');
  const [price, setPrice] = useState(vehicle ? (vehicle.priceCents / 100).toFixed(2) : '');
  const [quantity, setQuantity] = useState(vehicle ? String(vehicle.quantity) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const text = [make, model, category].map((s) => s.trim());
    if (text.some((s) => !s || s.length > 100)) return setError('Make, model and category are required (100 characters max).');
    const priceCents = dollarsToCents(price);
    if (price.trim() === '' || !Number.isFinite(priceCents) || priceCents < 0) return setError('Enter a price of 0 or more.');
    const qty = Number(quantity);
    if (quantity.trim() === '' || !Number.isInteger(qty) || qty < 0) return setError('Quantity must be a whole number, 0 or more.');
    setBusy(true);
    await onSubmit({ make: text[0], model: text[1], category: text[2], priceCents, quantity: qty });
    setBusy(false);
  }

  const L = 'mt-4 block text-sm text-dim first:mt-0';
  return (
    <Modal title={vehicle ? 'Edit vehicle' : 'Add vehicle'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <label className={L} htmlFor="f-make">Make</label>
        <input id="f-make" className="field mt-1" value={make} onChange={(e) => setMake(e.target.value)} maxLength={100} />
        <label className={L} htmlFor="f-model">Model</label>
        <input id="f-model" className="field mt-1" value={model} onChange={(e) => setModel(e.target.value)} maxLength={100} />
        <label className={L} htmlFor="f-cat">Category</label>
        <input id="f-cat" className="field mt-1" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={100} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={L} htmlFor="f-price">Price ($)</label>
            <input id="f-price" inputMode="decimal" className="field mt-1" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className={L} htmlFor="f-qty">Quantity</label>
            <input id="f-qty" inputMode="numeric" className="field mt-1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
        </div>
        {(error || serverError) && <p role="alert" className="mt-4 text-sm text-bad">{error || serverError}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : vehicle ? 'Save changes' : 'Add vehicle'}</button>
        </div>
      </form>
    </Modal>
  );
}
