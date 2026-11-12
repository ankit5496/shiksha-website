import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Crest } from '@/components/site/Logo';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <section className="section">
      <div className="container flex flex-col items-center text-center">
        <Crest className="h-20 w-16" />
        <p className="mt-8 font-serif text-7xl font-semibold text-navy-100 sm:text-8xl">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-navy-900">This page could not be found</h1>
        <p className="mt-3 max-w-md text-navy-500">The page you are looking for may have been moved or no longer exists.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-outline"><ArrowLeft className="h-4 w-4" />Go back</button>
          <Link to="/" className="btn-primary"><Home className="h-4 w-4" />Return home</Link>
        </div>
      </div>
    </section>
  );
}
