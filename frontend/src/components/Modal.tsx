import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] border border-rail bg-panel p-0 text-chalk"
      aria-label={title}
    >
      <div className="flex items-center justify-between border-b border-rail px-5 py-3">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <button className="btn !border-0 !p-1" aria-label="Close" onClick={() => ref.current?.close()}>
          <X size={20} aria-hidden />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
