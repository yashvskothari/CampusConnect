import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <PageTransition className="flex-1 flex flex-col">
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}

