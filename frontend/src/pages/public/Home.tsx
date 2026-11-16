import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Award, BookOpenCheck, CalendarDays, Clock, Compass, HeartHandshake, Mail, MapPin, Megaphone, Phone,
  Quote, Sparkles, Trophy, Users, Wallet, PlayCircle, Medal, Star, Lightbulb,
} from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { img } from '@/data/images';
import { school } from '@/data/school';
import { Badge, DemoBadge, Skeleton } from '@/components/ui';
import { Reveal, SectionHeading } from '@/components/site/SiteChrome';
import { EnquiryForm } from '@/components/site/EnquiryForm';
import { FACILITIES, PROGRAMS } from '@/components/site/content';
import { fmtDate, parseISO, todayISO } from '@/utils/format';

const WHY = [
  { icon: Users, title: 'Personal attention', text: 'Teachers who know every child and partner closely with families.' },
  { icon: Lightbulb, title: 'Concept-first learning', text: 'Activity-based teaching that builds understanding, not rote memory.' },
  { icon: HeartHandshake, title: 'Values & character', text: 'Discipline, kindness and respect woven into everyday school life.' },
  { icon: Compass, title: 'Holistic growth', text: 'Sports, arts, clubs and events that help every talent find its stage.' },
  { icon: BookOpenCheck, title: 'Transparent progress', text: 'Parent portal with attendance, homework, results and fees in one place.' },
  { icon: Sparkles, title: 'Future-ready skills', text: 'Computer education, communication skills and digital learning resources.' },
];

const HIGHLIGHT_SLOTS = [
  { icon: Trophy, title: 'Board examination results' },
  { icon: Medal, title: 'Sports achievements' },
  { icon: Award, title: 'Olympiad & competition honours' },
  { icon: Star, title: 'Cultural & arts recognition' },
];

const TESTIMONIALS = [
  { name: 'Parent of a Class 8 student', text: 'The teachers are approachable and genuinely invested in our child\'s progress. The regular updates help us stay involved.' },
  { name: 'Parent of a UKG student', text: 'Our daughter looks forward to school every morning. The pre-primary activities are creative and caring.' },
  { name: 'Parent of a Class 4 student', text: 'We appreciate the focus on discipline along with sports and cultural activities. A well-balanced environment.' },
];

const fade = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

export default function Home() {
  const { items: announcements, loading: aLoading } = useCollection('announcements');
  const { items: events, loading: eLoading } = useCollection('events');
  const { items: gallery } = useCollection('gallery');

  const news = useMemo(() => announcements.filter((a) => a.audience === 'all' || a.audience === 'parents').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4), [announcements]);
  const upcoming = useMemo(() => events.filter((e) => e.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4), [events]);
  const photos = useMemo(() => gallery.filter((g) => g.type === 'image').slice(0, 6), [gallery]);

  return (
    <>
      {/* 3. Hero */}
      <section className="relative isolate overflow-hidden bg-navy-950">
        <img src={img.hero} alt="Students in a classroom" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/95 via-navy-950/80 to-navy-950/30" />
        <div className="container flex min-h-[600px] flex-col justify-center py-20 lg:min-h-[680px]">
          <motion.p {...fade} transition={{ duration: 0.5 }} className="eyebrow text-gold-300">Welcome to {school.name} · {school.town}</motion.p>
          <motion.h1 {...fade} transition={{ duration: 0.6, delay: 0.1 }} className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            Where curious minds grow into <span className="text-gold-300">confident</span> young citizens.
          </motion.h1>
          <motion.p {...fade} transition={{ duration: 0.6, delay: 0.2 }} className="mt-6 max-w-xl text-base leading-relaxed text-navy-100 sm:text-lg">
            {school.tagline} A caring school community in {school.town}, {school.state}, nurturing academic excellence, character and creativity.
          </motion.p>
          <motion.div {...fade} transition={{ duration: 0.6, delay: 0.3 }} className="mt-9 flex flex-wrap gap-3">
            <Link to="/admissions#enquiry" className="btn-gold px-6 py-3 text-base">Apply for Admission <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/gallery" className="btn border border-white/30 px-6 py-3 text-base text-white hover:bg-white/10">Explore Our Campus</Link>
          </motion.div>
        </div>
      </section>

      {/* Quick access strip */}
      <section className="relative z-10 -mt-12">
        <div className="container">
          <div className="grid overflow-hidden rounded-2xl bg-white shadow-lift sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BookOpenCheck, title: 'Admissions Open', text: `Session ${school.academicYear}`, to: '/admissions' },
              { icon: Users, title: 'Parent Portal', text: 'Attendance, homework & results', to: '/login?role=parent' },
              { icon: Wallet, title: 'Online Fees', text: 'Pay securely & download receipts', to: '/fees' },
              { icon: MapPin, title: 'Bus Tracking', text: 'Live school bus location', to: '/login?role=parent&next=%2Fparent%2Ftransport' },
            ].map((q, i) => (
              <Link key={q.title} to={q.to} className={`group flex items-center gap-4 p-6 transition hover:bg-ivory ${i > 0 ? 'border-t border-navy-50 sm:border-t-0 lg:border-l' : ''} ${i === 2 ? 'sm:border-t lg:border-t-0' : ''} ${i === 3 ? 'sm:border-l sm:border-t lg:border-t-0' : ''}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition group-hover:bg-navy-900 group-hover:text-gold-300"><q.icon className="h-5 w-5" /></div>
                <div><p className="font-semibold text-navy-900">{q.title}</p><p className="text-sm text-navy-500">{q.text}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4–5. Welcome & About */}
      <section className="section">
        <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative">
            <img src={img.handsUp} alt="Students participating in class" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lift" />
            <img src={img.library} alt="School library" className="absolute -bottom-8 -right-4 hidden w-1/2 rounded-2xl border-8 border-ivory object-cover shadow-lift sm:block lg:-right-8" />
            <div className="absolute -left-4 -top-4 hidden rounded-2xl bg-navy-900 p-5 text-white shadow-lift sm:block">
              <p className="font-serif text-lg font-semibold text-gold-300">{school.town}</p>
              <p className="text-xs uppercase tracking-wider text-navy-200">{school.state}</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading eyebrow="Welcome" title="A school that feels like a second home" />
            <p className="mt-6 text-[15px] leading-relaxed text-navy-600">
              At {school.name}, we believe every child is capable of remarkable things. Our classrooms are spaces of curiosity and
              conversation, where children learn to think independently, express themselves confidently and care for the world around them.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-navy-600">
              From the first steps in pre-primary to preparation for board examinations, we combine strong academics with sports, arts and
              value education — so that our students grow not just as learners, but as responsible individuals.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {['Pre-Primary to Class 10', 'Activity-based learning', 'Digital parent portal', 'Safe school transport'].map((t) => (
                <div key={t} className="flex items-center gap-2.5 text-sm font-medium text-navy-800"><span className="h-1.5 w-1.5 rounded-full bg-gold-500" />{t}</div>
              ))}
            </div>
            <Link to="/about" className="btn-primary mt-9">More about us <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
      </section>

      {/* 6. Principal's message */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-navy-950 lg:grid-cols-5">
            <div className="relative h-72 lg:col-span-2 lg:h-full lg:min-h-[420px]">
              <img src={img.books} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 to-transparent lg:bg-gradient-to-r" />
            </div>
            <Reveal className="p-8 sm:p-12 lg:col-span-3 lg:pl-0">
              <Quote className="h-10 w-10 text-gold-400" />
              <p className="eyebrow mt-6 text-gold-300">Principal's Message</p>
              <blockquote className="mt-4 font-serif text-xl leading-relaxed text-white sm:text-2xl">
                “Education is not only about marks and certificates. It is about curiosity, character and the courage to keep learning.
                Together with our parents, we aim to give every child a safe, joyful and inspiring place to grow.”
              </blockquote>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div>
                  <p className="font-semibold text-white">{school.principal.name}</p>
                  <p className="text-sm text-navy-300">{school.principal.title}, {school.name}</p>
                </div>
                <DemoBadge>Message & name to be confirmed</DemoBadge>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. Academic programs */}
      <section className="section">
        <div className="container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Academics" title="Programmes for every stage of childhood" subtitle="A thoughtfully sequenced curriculum from the early years to secondary school." />
            <Link to="/academics" className="btn-outline shrink-0">View academics <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((p, i) => (
              <Reveal key={p.stage} delay={i * 0.06}>
                <Link to="/academics" className="group block h-full overflow-hidden rounded-2xl border border-navy-100/70 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
                  <div className="aspect-[4/3] overflow-hidden"><img src={p.image} alt={p.stage} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
                  <div className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold-600">{p.classes}</p>
                    <h3 className="mt-2 text-xl font-semibold text-navy-900">{p.stage}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-navy-500">{p.text}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Facilities */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading center eyebrow="Campus & Facilities" title="Spaces designed for learning and growth" subtitle="Facility photographs shown are representative demo images until the school's own photographs are added." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FACILITIES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.05}>
                <div className="group relative h-72 overflow-hidden rounded-2xl">
                  <img src={f.image} alt={f.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-navy-950"><f.icon className="h-5 w-5" /></div>
                    <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                    <p className="mt-1 text-sm text-navy-200 opacity-90">{f.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Why choose us */}
      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-3">
          <Reveal>
            <SectionHeading eyebrow="Why Choose Us" title="An education that balances heart and mind" subtitle="We focus on what matters most to families: strong learning, a caring environment and clear communication." />
            <Link to="/admissions" className="btn-primary mt-8">Admission process <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.05}>
                <div className="card h-full p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-50 text-gold-700"><w.icon className="h-5 w-5" /></div>
                  <h3 className="mt-4 font-sans text-base font-semibold text-navy-900">{w.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{w.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Achievements & highlights */}
      <section className="section relative overflow-hidden bg-navy-950">
        <img src={img.graduation} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
        <div className="container relative">
          <SectionHeading light center eyebrow="Achievements & Highlights" title="Celebrating our students' milestones" subtitle="Verified achievements, results and statistics will be published here once provided by the school management." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHT_SLOTS.map((h, i) => (
              <Reveal key={h.title} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:border-gold-400/40">
                  <h.icon className="h-8 w-8 text-gold-400" />
                  <p className="mt-5 font-serif text-3xl font-semibold text-white">—</p>
                  <p className="mt-2 font-semibold text-white">{h.title}</p>
                  <DemoBadge className="mt-4">Placeholder – to be confirmed by school</DemoBadge>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 11–12. Announcements & events */}
      <section className="section">
        <div className="container grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <SectionHeading eyebrow="Notice Board" title="Latest announcements" />
              <Megaphone className="hidden h-8 w-8 text-gold-500 sm:block" />
            </div>
            <div className="mt-8 space-y-4">
              {aLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
              {news.map((a) => (
                <article key={a.id} className="card p-5 transition hover:shadow-lift">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-navy-400">{fmtDate(a.date)}</span>
                    {a.priority === 'high' && <Badge tone="gold">Important</Badge>}
                  </div>
                  <h3 className="mt-2 font-sans text-base font-semibold text-navy-900">{a.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-navy-500">{a.body}</p>
                </article>
              ))}
              <Link to="/login?role=parent&next=%2Fparent%2Fnotices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900">All notices in the Parent Portal <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex items-end justify-between gap-4">
              <SectionHeading eyebrow="Calendar" title="Upcoming events" />
              <CalendarDays className="hidden h-8 w-8 text-gold-500 sm:block" />
            </div>
            <div className="mt-8 space-y-4">
              {eLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
              {upcoming.map((e) => {
                const d = parseISO(e.date);
                return (
                  <article key={e.id} className="card flex gap-5 p-5 transition hover:shadow-lift">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-navy-900 text-white">
                      <span className="font-serif text-2xl font-semibold leading-none">{d.getDate()}</span>
                      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gold-300">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                    </div>
                    <div className="min-w-0">
                      <Badge tone="navy">{e.category}</Badge>
                      <h3 className="mt-1.5 font-sans text-base font-semibold text-navy-900">{e.title}</h3>
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.venue}</span>
                      </p>
                    </div>
                  </article>
                );
              })}
              {!eLoading && upcoming.length === 0 && <p className="text-sm text-navy-400">No upcoming events right now.</p>}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 13. Gallery preview */}
      <section className="section bg-white">
        <div className="container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading eyebrow="Gallery" title="Moments from campus life" subtitle="Demo photographs – to be replaced with the school's own photo and video library." />
            <Link to="/gallery" className="btn-outline shrink-0"><PlayCircle className="h-4 w-4" />Photos & videos</Link>
          </div>
          <div className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-4 md:auto-rows-[220px] md:grid-cols-4">
            {photos.map((p, i) => (
              <Link key={p.id} to="/gallery" className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''} ${i === 3 ? 'md:col-span-2' : ''}`}>
                <img src={i === 0 ? p.src : p.thumb} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-navy-950/80 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
                  <p className="text-sm font-medium text-white">{p.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 14. Testimonials */}
      <section className="section">
        <div className="container">
          <SectionHeading center eyebrow="Parent Voices" title="What families say" />
          <div className="mt-4 flex justify-center"><DemoBadge>Sample testimonials (demo)</DemoBadge></div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <figure className="card h-full p-7">
                  <div className="flex gap-0.5 text-gold-500">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}</div>
                  <blockquote className="mt-4 text-[15px] leading-relaxed text-navy-700">“{t.text}”</blockquote>
                  <figcaption className="mt-6 border-t border-navy-50 pt-4 text-sm font-semibold text-navy-900">{t.name}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 15. Admission enquiry */}
      <section id="enquiry" className="section bg-navy-950">
        <div className="container grid gap-12 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <SectionHeading light eyebrow={`Admissions ${school.academicYear}`} title="Begin your child's journey with us" subtitle="Share a few details and our admission office will reach out to guide you through the process, campus visit and documentation." />
            <ul className="mt-8 space-y-3 text-sm text-navy-200">
              {['Campus visit & interaction', 'Registration & document verification', 'Admission confirmation & fee payment'].map((s, i) => (
                <li key={s} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold-400/50 text-xs font-semibold text-gold-300">{i + 1}</span>{s}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-3">
            <div className="rounded-2xl bg-white p-6 shadow-lift sm:p-8"><EnquiryForm /></div>
          </Reveal>
        </div>
      </section>

      {/* 16. Contact & map */}
      <section className="section">
        <div className="container grid gap-8 lg:grid-cols-3">
          <Reveal>
            <SectionHeading eyebrow="Visit Us" title="Get in touch" />
            <div className="mt-8 space-y-5">
              <div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700"><MapPin className="h-5 w-5" /></div><div><p className="font-semibold text-navy-900">{school.address}</p><p className="text-sm text-navy-400">{school.addressNote}</p></div></div>
              <div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700"><Phone className="h-5 w-5" /></div><div><p className="font-semibold text-navy-900">{school.phoneDisplay}</p><p className="text-sm text-navy-400">Office phone</p></div></div>
              <div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700"><Mail className="h-5 w-5" /></div><div><p className="font-semibold text-navy-900">{school.email}</p><p className="text-sm text-navy-400">Demo email address</p></div></div>
            </div>
            <Link to="/contact" className="btn-primary mt-8">Contact page <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-2">
            <div className="h-[380px] overflow-hidden rounded-2xl border border-navy-100 shadow-soft">
              <iframe title="School location map" src={`https://www.google.com/maps?q=${encodeURIComponent(school.mapQuery)}&output=embed`} className="h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
