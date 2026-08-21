import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-primary-400">404</h1>
      <p className="mt-4 text-xl text-surface-800">Page not found</p>
      <Link to="/" className="mt-6"><Button>Go Home</Button></Link>
    </div>
  );
}
