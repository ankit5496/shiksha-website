import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Heart, Quote, Target } from 'lucide-react';
import { img } from '@/data/images';
import { school } from '@/data/school';
import { DemoBadge } from '@/components/ui';
import { PageHero, Reveal, SectionHeading } from '@/components/site/SiteChrome';
import { FACILITIES } from '@/components/site/content';

const PHILOSOPHY = [
  { title: 'Every child is unique', text: 'We respect different learning styles and paces, and give each student the encouragement they need.' },
  { title: 'Learning by doing', text: 'Experiments, projects, discussions and field activities make learning meaningful and memorable.' },
  { title: 'Values at the core', text: 'Honesty, respect, empathy and responsibility guide everything we do inside and outside the classroom.' },
  { title: 'Partnership with parents', text: 'Open, regular communication helps families and teachers support every child together.' },
];

export default function About() {
  return (
    <>
      <PageHero crumbs="Home / About" title="About our school" subtitle={`${school.name} is a learning community in ${school.town}, ${school.state}, committed to nurturing knowledgeable, confident and compassionate young people.`} image={img.classroom} />

      {/* Overview */}
      <section className="section">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="School Overview" title="Rooted in values, ready for tomorrow" />
            <p className="mt-6 text-[15px] leading-relaxed text-navy-600">
              {school.name} offers education from pre-primary through secondary classes. Our aim is simple: to provide a safe, disciplined and
              joyful environment where children develop strong academic foundations along with the skills and character needed for life.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-navy-600">
              Our teachers combine traditional strengths — discipline, respect and hard work — with modern teaching practices, digital resources
              and a wide range of co-curricular activities.
            </p>
            <DemoBadge className="mt-6">Overview text to be reviewed by school management</DemoBadge>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              <img src={img.handsUp} alt="Classroom" className="aspect-[3/4] w-full rounded-2xl object-cover shadow-soft" />
              <div className="grid gap-4">
                <img src={img.library} alt="Library" className="aspect-square w-full rounded-2xl object-cover shadow-soft" />
                <img src={img.track} alt="Sports" className="aspect-square w-full rounded-2xl object-cover shadow-soft" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Vision & mission */}
      <section className="section bg-white">
        <div className="container grid gap-6 md:grid-cols-3">
          {[
            { icon: Eye, title: 'Our Vision', text: 'To be a school where every child discovers their potential and grows into a responsible, compassionate and confident citizen.' },
            { icon: Target, title: 'Our Mission', text: 'To deliver concept-based, joyful learning; to nurture values and discipline; and to partner with parents for each child\'s holistic development.' },
            { icon: Heart, title: 'Our Values', text: 'Integrity · Respect · Curiosity · Excellence · Service. These guide our classrooms, our campus and our community.' },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.06}>
              <div className="card h-full p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-gold-300"><c.icon className="h-6 w-6" /></div>
                <h3 className="mt-6 text-2xl font-semibold text-navy-900">{c.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-navy-500">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="container mt-6 text-center text-xs text-navy-400">Vision, mission and values are drafted for the demo and should be replaced with the school's official statements.</p>
      </section>

      {/* Philosophy */}
      <section className="section">
        <div className="container">
          <SectionHeading center eyebrow="Philosophy" title="How we think about education" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PHILOSOPHY.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <div className="h-full border-l-2 border-gold-400 pl-5">
                  <p className="font-serif text-4xl font-semibold text-navy-100">0{i + 1}</p>
                  <h3 className="mt-2 font-sans text-base font-semibold text-navy-900">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Principal */}
      <section className="section bg-navy-950">
        <div className="container grid items-center gap-12 lg:grid-cols-3">
          <Reveal>
            <div className="relative mx-auto aspect-[4/5] max-w-xs overflow-hidden rounded-2xl bg-navy-800">
              <img src={img.books} alt="" className="h-full w-full object-cover opacity-60" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950 p-5">
                <DemoBadge>Principal photo to be added</DemoBadge>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-2">
            <Quote className="h-10 w-10 text-gold-400" />
            <p className="eyebrow mt-4 text-gold-300">From the Principal's Desk</p>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-navy-100">
              <p>Dear parents and students, it is a privilege to welcome you to {school.name}. Our school is built on the belief that every child deserves a place where they are known, valued and challenged to do their best.</p>
              <p>We work to create a balance between academic rigour and holistic development — encouraging our students to ask questions, take part in sports and the arts, and grow into thoughtful members of society.</p>
              <p>I invite you to visit our campus, meet our teachers and become part of our school family.</p>
            </div>
            <div className="mt-6">
              <p className="font-semibold text-white">{school.principal.name}</p>
              <p className="text-sm text-navy-300">{school.principal.title}</p>
            </div>
            <DemoBadge className="mt-4">Sample message – to be replaced with the principal's own words</DemoBadge>
          </Reveal>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="Infrastructure & Facilities" title="A campus that supports every kind of learning" subtitle="Representative photographs are used for the demo." />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FACILITIES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.05}>
                <div className="group card h-full overflow-hidden">
                  <div className="aspect-[16/10] overflow-hidden"><img src={f.image} alt={f.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
                  <div className="p-5">
                    <div className="flex items-center gap-2"><f.icon className="h-4 w-4 text-gold-600" /><h3 className="font-sans text-base font-semibold text-navy-900">{f.title}</h3></div>
                    <p className="mt-2 text-sm text-navy-500">{f.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Academic environment */}
      <section className="section bg-white">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <img src={img.scienceLab} alt="Science lab" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lift" />
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeading eyebrow="Academic Environment" title="Focused, supportive and engaging" />
            <ul className="mt-6 space-y-4 text-[15px] text-navy-600">
              {[
                'Optimal class sizes so that teachers can give individual attention.',
                'Regular unit tests, periodic assessments and parent–teacher meetings.',
                'Remedial support and enrichment for students who need it.',
                'Digital learning materials, homework and results available on the parent portal.',
                'Co-curricular clubs, inter-house competitions and annual events.',
              ].map((t) => <li key={t} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />{t}</li>)}
            </ul>
            <Link to="/academics" className="btn-primary mt-8">Explore academics <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
