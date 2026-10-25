import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Search } from 'lucide-react';
import { api, ApiError } from '../api';
import { money } from '../format';
import type { Filters, Vehicle, VehicleInput } from '../types';
import VehicleRow from './VehicleRow';
import VehicleForm from './VehicleForm';
import RestockForm from './RestockForm';

const EMPTY: Filters = { make: '', model: '', category: '', minPrice: '', maxPrice: '' };

type Dialog = { kind: 'form'; vehicle: Vehicle | null } | { kind: 'restock'; vehicle: Vehicle } | null;

export default function Garage({ token, isAdmin, onExpired }: { token: string; isAdmin: boolean; onExpired: () => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dialogError, setDialogError] = useState('');

  const guard = useCallback((err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.status === 401) onExpired();
      return err.message;
    }
    return 'Something went wrong. Try again.';
  }, [onExpired]);

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    setLoadError('');
    try {
      setVehicles(await api.listVehicles(f, token));
    } catch (err) {
      setLoadError(guard(err));
    } finally {
      setLoading(false);
    }
  }, [token, guard]);

  useEffect(() => { void load(applied); }, [applied, load]);

  const priceError = (() => {
    const { minPrice: a, maxPrice: b } = filters;
    if ((a && !(Number(a) >= 0)) || (b && !(Number(b) >= 0))) return 'Prices must be numbers of 0 or more.';
    if (a && b && Number(a) > Number(b)) return 'Minimum price can’t be higher than maximum price.';
    return '';
  })();

  function search(e: FormEvent) {
    e.preventDefault();
    if (!priceError) setApplied(filters);
  }
  function clear() {
    setFilters(EMPTY);
    setApplied(EMPTY);
  }

  const replace = (v: Vehicle) => setVehicles((list) => list.map((x) => (x.id === v.id ? v : x)));

  async function purchase(v: Vehicle) {
    setBusyId(v.id);
    setNotice(null);
    try {
      const updated = await api.purchase(v.id, token);
      replace(updated);
      const changed = updated.priceCents !== v.priceCents;
      setNotice({
        kind: 'ok',
        text: `Bought one ${updated.make} ${updated.model} for ${money(updated.priceCents)}.` +
          (changed ? ` The price had changed from ${money(v.priceCents)}.` : ''),
      });
    } catch (err) {
      setNotice({ kind: 'error', text: guard(err) });
      void load(applied); // the database is authoritative; refresh stale data
    } finally {
      setBusyId(null);
    }
  }

  async function remove(v: Vehicle) {
    setBusyId(v.id);
    setNotice(null);
    try {
      await api.deleteVehicle(v.id, token);
      setVehicles((list) => list.filter((x) => x.id !== v.id));
      setNotice({ kind: 'ok', text: `Deleted ${v.make} ${v.model}.` });
    } catch (err) {
      setNotice({ kind: 'error', text: guard(err) });
      void load(applied);
    } finally {
      setBusyId(null);
    }
  }

  async function saveVehicle(input: VehicleInput) {
    if (dialog?.kind !== 'form') return;
    setDialogError('');
    try {
      const existing = dialog.vehicle;
      const saved = existing ? await api.updateVehicle(existing.id, input, token) : await api.createVehicle(input, token);
      setDialog(null);
      setNotice({ kind: 'ok', text: `${existing ? 'Saved' : 'Added'} ${saved.make} ${saved.model}.` });
      void load(applied);
    } catch (err) {
      setDialogError(guard(err));
    }
  }

  async function restock(qty: number) {
    if (dialog?.kind !== 'restock') return;
    setDialogError('');
    try {
      const updated = await api.restock(dialog.vehicle.id, qty, token);
      replace(updated);
      setDialog(null);
      setNotice({ kind: 'ok', text: `Added ${qty} to ${updated.make} ${updated.model}. Now ${updated.quantity} in stock.` });
    } catch (err) {
      setDialogError(guard(err));
    }
  }

  const closeDialog = () => { setDialog(null); setDialogError(''); };
  const hasFilters = Object.values(applied).some(Boolean);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <form onSubmit={search} className="grid gap-3 border border-rail bg-panel p-4 sm:grid-cols-2 lg:grid-cols-5" role="search" noValidate>
        {([['make', 'Make'], ['model', 'Model'], ['category', 'Category']] as const).map(([k, label]) => (
          <div key={k}>
            <label className="text-sm text-dim" htmlFor={`s-${k}`}>{label}</label>
            <input id={`s-${k}`} className="field mt-1" value={filters[k]}
              onChange={(e) => setFilters({ ...filters, [k]: e.target.value })} />
          </div>
        ))}
        <div>
          <label className="text-sm text-dim" htmlFor="s-min">Min price ($)</label>
          <input id="s-min" inputMode="decimal" className="field mt-1" value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-dim" htmlFor="s-max">Max price ($)</label>
          <input id="s-max" inputMode="decimal" className="field mt-1" value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-5">
          <button className="btn btn-primary" disabled={!!priceError}><Search size={16} aria-hidden /> Search</button>
          <button type="button" className="btn" onClick={clear} disabled={!hasFilters && !Object.values(filters).some(Boolean)}>Clear</button>
          {priceError && <p role="alert" className="text-sm text-bad">{priceError}</p>}
          {isAdmin && (
            <button type="button" className="btn ml-auto" onClick={() => { setDialogError(''); setDialog({ kind: 'form', vehicle: null }); }}>
              <Plus size={16} aria-hidden /> Add vehicle
            </button>
          )}
        </div>
      </form>

      <div aria-live="polite" className="min-h-6">
        {notice && (
          <p className={`mt-4 border-l-4 bg-panel px-4 py-2 text-sm ${notice.kind === 'ok' ? 'border-good' : 'border-bad'}`}>
            {notice.text}
          </p>
        )}
      </div>

      <section className="mt-4" aria-busy={loading}>
        {loading ? (
          <p className="py-10 text-dim">Loading vehicles…</p>
        ) : loadError ? (
          <div className="py-10">
            <p className="text-bad">{loadError}</p>
            <button className="btn mt-3" onClick={() => void load(applied)}>Try again</button>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-10">
            <p className="font-display text-2xl">{hasFilters ? 'No vehicles match those filters.' : 'The garage is empty.'}</p>
            <p className="mt-1 text-dim">
              {hasFilters ? 'Loosen a filter or clear them to see everything.' : isAdmin ? 'Add the first vehicle to get started.' : 'Check back after the dealership restocks.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-dim">{vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'}</p>
            <ul className="mt-2 border-t border-rail">
              {vehicles.map((v) => (
                <VehicleRow key={v.id} vehicle={v} isAdmin={isAdmin} busy={busyId === v.id}
                  onPurchase={() => void purchase(v)}
                  onEdit={() => { setDialogError(''); setDialog({ kind: 'form', vehicle: v }); }}
                  onRestock={() => { setDialogError(''); setDialog({ kind: 'restock', vehicle: v }); }}
                  onDelete={() => void remove(v)} />
              ))}
            </ul>
          </>
        )}
      </section>

      {dialog?.kind === 'form' && (
        <VehicleForm vehicle={dialog.vehicle} onSubmit={saveVehicle} onClose={closeDialog} serverError={dialogError} />
      )}
      {dialog?.kind === 'restock' && (
        <RestockForm vehicle={dialog.vehicle} onSubmit={restock} onClose={closeDialog} serverError={dialogError} />
      )}
    </main>
  );
}
