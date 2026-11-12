import { BookOpen, Bus, Cpu, Dumbbell, FlaskConical, MonitorPlay, Music, ShieldCheck, type LucideIcon } from 'lucide-react';
import { img } from '@/data/images';

/** Shared marketing content for public pages. Descriptions are generic and should be reviewed by the school. */
export const PROGRAMS = [
  { stage: 'Pre-Primary', classes: 'Nursery · LKG · UKG', image: img.prePrimary, text: 'A joyful, play-based start where children build language, number sense, motor skills and confidence through stories, rhymes, art and exploration.' },
  { stage: 'Primary', classes: 'Classes 1 – 5', image: img.primaryWriting, text: 'Strong foundations in literacy, numeracy and environmental studies, with activity-based learning that keeps curiosity at the centre.' },
  { stage: 'Middle', classes: 'Classes 6 – 8', image: img.handsUp, text: 'Subject depth across languages, mathematics, science and social science, with project work, labs and computer education.' },
  { stage: 'Secondary', classes: 'Classes 9 – 10', image: img.secondary, text: 'Focused preparation for board examinations with concept clarity, regular assessments, revision support and career awareness.' },
];

export const FACILITIES: { title: string; text: string; image: string; icon: LucideIcon }[] = [
  { title: 'Library', text: 'A quiet, well-stocked reading space that nurtures the reading habit.', image: img.library, icon: BookOpen },
  { title: 'Science Laboratory', text: 'Hands-on experiments that make concepts come alive.', image: img.scienceLab, icon: FlaskConical },
  { title: 'Computer Lab', text: 'Digital literacy and coding fundamentals for every learner.', image: img.computerLab, icon: Cpu },
  { title: 'Smart Classrooms', text: 'Bright, airy classrooms with audio-visual teaching aids.', image: img.classroom, icon: MonitorPlay },
  { title: 'Sports & Fitness', text: 'Playground, athletics, football and yoga for holistic fitness.', image: img.football, icon: Dumbbell },
  { title: 'Arts & Culture', text: 'Music, dance, art and celebrations that build expression.', image: img.colours, icon: Music },
  { title: 'Safe Transport', text: 'School buses with attendants and live GPS tracking for parents.', image: img.backpacks, icon: Bus },
  { title: 'Safe Campus', text: 'Supervised campus with careful attention to student wellbeing.', image: img.classroom2, icon: ShieldCheck },
];
