import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer, Navbar } from '@/components/site/SiteChrome';

export default function PublicLayout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 80); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
