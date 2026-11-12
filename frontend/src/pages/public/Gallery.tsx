import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Expand, Play } from 'lucide-react';
import clsx from 'clsx';
import { img } from '@/data/images';
import { DemoBadge, EmptyState, Skeleton } from '@/components/ui';
import { PageHero } from '@/components/site/SiteChrome';
import { Lightbox } from '@/components/site/Lightbox';
import { useCollection } from '@/hooks/useCollection';

const CATEGORIES = ['All', 'Campus', 'Classroom Activities', 'Sports', 'Annual Function', 'Cultural Celebrations', 'Student Achievements', 'Events', 'Videos'];

export default function Gallery() {
  const { items, loading } = useCollection('gallery');
  const [cat, setCat] = useState('All');
  const [index, setIndex] = useState<number | null>(null);

  const shown = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
    if (cat === 'All') return sorted;
    if (cat === 'Videos') return sorted.filter((i) => i.type === 'video');
    return sorted.filter((i) => i.category === cat);
  }, [items, cat]);

  const count = (c: string) => (c === 'All' ? items.length : c === 'Videos' ? items.filter((i) => i.type === 'video').length : items.filter((i) => i.category === c).length);

  return (
    <>
      <PageHero crumbs="Home / Gallery" title="Photo & Video Gallery" subtitle="Glimpses of everyday learning, celebrations, sports and special moments on campus." image={img.colours} />
      <section className="section">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCat(c)}
                  className={clsx('whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition',
                    cat === c ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-100 bg-white text-navy-600 hover:border-navy-300')}>
                  {c} <span className={clsx('ml-1 text-xs', cat === c ? 'text-gold-300' : 'text-navy-300')}>{count(c)}</span>
                </button>
              ))}
            </div>
            <DemoBadge>Demo photos & clips</DemoBadge>
          </div>

          {loading ? (
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>
          ) : shown.length === 0 ? (
            <EmptyState title="No items in this category yet" message="New photographs will appear here as they are uploaded." />
          ) : (
            <motion.div layout className="mt-10 columns-2 gap-4 md:columns-3 lg:columns-4">
              <AnimatePresence>
                {shown.map((g, i) => (
                  <motion.button layout key={g.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIndex(i)} className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-navy-50 text-left" aria-label={`Open ${g.title}`}>
                    <img src={g.thumb} alt={g.title} loading="lazy" className={clsx('w-full object-cover transition duration-500 group-hover:scale-105', i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]')} />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-transparent to-transparent opacity-70 transition group-hover:opacity-100" />
                    {g.type === 'video' ? (
                      <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-lift transition group-hover:scale-110"><Play className="ml-0.5 h-6 w-6 fill-current" /></span>
                    ) : (
                      <span className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-navy-900 opacity-0 transition group-hover:opacity-100"><Expand className="h-4 w-4" /></span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gold-300">{g.category}</p>
                      <p className="mt-0.5 text-sm font-medium text-white">{g.title}</p>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
      <Lightbox items={shown} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </>
  );
}
