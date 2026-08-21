import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-surface-300 bg-surface-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient font-bold text-white text-sm">
                C
              </div>
              <span className="text-lg font-bold text-surface-900">CampusConnect</span>
            </div>
            <p className="text-sm text-surface-700">Connect. Collaborate. Create. The AI-powered freelance marketplace built for students.</p>
          </div>
          <div>
            <h4 className="font-semibold text-surface-900 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-surface-700">
              <li><Link to="/services" className="hover:text-primary-400">Browse Services</Link></li>
              <li><Link to="/jobs" className="hover:text-primary-400">Find Jobs</Link></li>
              <li><Link to="/signup" className="hover:text-primary-400">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-surface-900 mb-3">For Students</h4>
            <ul className="space-y-2 text-sm text-surface-700">
              <li><Link to="/signup" className="hover:text-primary-400">Become a Freelancer</Link></li>
              <li><Link to="/jobs" className="hover:text-primary-400">Apply to Jobs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-surface-900 mb-3">For Clients</h4>
            <ul className="space-y-2 text-sm text-surface-700">
              <li><Link to="/jobs/new" className="hover:text-primary-400">Post a Job</Link></li>
              <li><Link to="/services" className="hover:text-primary-400">Hire Freelancers</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-surface-300 pt-8 text-center text-sm text-surface-700">
          &copy; {new Date().getFullYear()} CampusConnect. Built for internship demonstration.
        </div>
      </div>
    </footer>
  );
}
