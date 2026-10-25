import { useState } from 'react';
import { Pencil, PackagePlus, Trash2, ShoppingCart } from 'lucide-react';
import { money } from '../format';
import type { Vehicle } from '../types';

const COLORS = ['white', 'brown', 'red', 'blue'] as const;
// Same vehicle always gets the same colour; several cars may share a sprite.
const colorFor = (id: string) => COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

interface Props {
  vehicle: Vehicle;
  isAdmin: boolean;
  guest: boolean;
  busy: boolean;
  onPurchase: () => void;
  onEdit: () => void;
  onRestock: () => void;
  onDelete: () => void;
}

export default function VehicleRow({ vehicle: v, isAdmin, guest, busy, onPurchase, onEdit, onRestock, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const out = v.quantity === 0;
  const stock = out ? 'Out of stock' : v.quantity <= 3 ? `Only ${v.quantity} left` : `${v.quantity} in stock`;

  return (
    <li data-out={out || undefined}
      className={`vrow grid gap-3 border-b border-rail py-4 pl-4 md:grid-cols-[auto_1fr_auto_auto] md:items-center md:gap-8 ${
      out ? 'border-l-4 border-l-rail' : 'border-l-4 border-l-amber'}`}>
      <div className="sprite-wrap">
        <img src={`/cars/sedan-${colorFor(v.id)}.png`} alt="" width={246} height={82} className="sprite" draggable={false} />
        <span className="sprite-shadow" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-dim">{v.category}</p>
        <h3 className="font-display text-3xl font-semibold leading-tight">
          {v.make} <span className="text-dim">{v.model}</span>
        </h3>
      </div>

      <div className="md:text-right">
        <p className="font-display text-3xl font-semibold">{money(v.priceCents)}</p>
        <p className={`text-sm ${out ? 'text-bad' : v.quantity <= 3 ? 'text-amber' : 'text-good'}`}>{stock}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pr-4 md:justify-end">
        {guest ? <span className="text-sm text-dim">Sign in to purchase</span> : <>
          <button className="btn btn-primary" disabled={out || busy} onClick={onPurchase}
            aria-describedby={out ? `oos-${v.id}` : undefined}>
            <ShoppingCart size={16} aria-hidden /> Buy one
          </button>
          {out && <span id={`oos-${v.id}`} className="text-sm text-dim">Unavailable until restocked</span>}
        </>}

        {isAdmin && (
          <>
            <button className="btn" onClick={onEdit} aria-label={`Edit ${v.make} ${v.model}`}>
              <Pencil size={16} aria-hidden /> Edit
            </button>
            <button className="btn" onClick={onRestock} aria-label={`Restock ${v.make} ${v.model}`}>
              <PackagePlus size={16} aria-hidden /> Restock
            </button>
            {confirming ? (
              <>
                <button className="btn btn-danger" disabled={busy} onClick={onDelete}>Confirm delete</button>
                <button className="btn" onClick={() => setConfirming(false)}>Keep</button>
              </>
            ) : (
              <button className="btn btn-danger" onClick={() => setConfirming(true)}
                aria-label={`Delete ${v.make} ${v.model}`}>
                <Trash2 size={16} aria-hidden /> Delete
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
