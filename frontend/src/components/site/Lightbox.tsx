import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryItem } from '@/types';
import { fmtDate } from '@/utils/format';

/** Full-screen viewer for gallery images and videos (arrow keys navigate, Esc closes). */
export function Lightbox({ items, index, onClose, onIndex }: { items: GalleryItem[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const open = index !== null && items[index] !== undefined;
  const item = open ? items[index!] : null;

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index! + 1) % items.length);
      if (e.key === 'ArrowLeft') onIndex((index! - 1 + items.length) % items.length);
    };
    document.addEventListener('keydown', h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = prev; };
  }, [open, index, items.length, onClose, onIndex]);

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div className="fixed inset-0 z-[95] flex flex-col bg-navy-950/95" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={item.title}>
          <div className="flex items-center justify-between px-4 py-3 text-navy-200 sm:px-6">
            <span className="text-sm">{index! + 1} / {items.length}</span>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 hover:text-white" aria-label="Close"><X className="h-6 w-6" /></button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-4 sm:px-16" onClick={onClose}>
            <motion.div key={item.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="flex max-h-full max-w-5xl items-center" onClick={(e) => e.stopPropagation()}>
              {item.type === 'video' ? (
                <video key={item.src} src={item.src} poster={item.thumb} controls autoPlay className="max-h-[75vh] w-full rounded-xl bg-black" />
              ) : (
                <img src={item.src} alt={item.title} className="max-h-[75vh] w-auto rounded-xl object-contain shadow-lift" />
              )}
            </motion.div>
            {items.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onIndex((index! - 1 + items.length) % items.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-4" aria-label="Previous"><ChevronLeft className="h-6 w-6" /></button>
                <button onClick={(e) => { e.stopPropagation(); onIndex((index! + 1) % items.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-4" aria-label="Next"><ChevronRight className="h-6 w-6" /></button>
              </>
            )}
          </div>
          <div className="px-6 pb-6 text-center">
            <p className="font-serif text-lg text-white">{item.title}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-gold-300">{item.category} · {fmtDate(item.date)}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
