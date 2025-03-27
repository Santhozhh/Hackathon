import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-3xl font-normal mb-6">
            Welcome to Hospital Tracker
          </h1>
          
          <p className="text-lg mb-8">
            Your comprehensive Hospital Resource Management System for better patient care and resource allocation.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto mb-12">
          <div className="border p-6">
            <h3 className="font-medium text-lg mb-3">Bed Management</h3>
            <p>Real-time bed availability tracking and patient allocation</p>
          </div>
          
          <div className="border p-6">
            <h3 className="font-medium text-lg mb-3">Equipment Tracking</h3>
            <p>Manage medical equipment inventory and patient assignments</p>
          </div>
          
          <div className="border p-6">
            <h3 className="font-medium text-lg mb-3">Resource Monitoring</h3>
            <p>Track utilization metrics and optimize resource allocation</p>
          </div>
        </div>
        
        <div className="max-w-md mx-auto border p-8">
          <h2 className="text-xl font-normal text-center mb-6">
            Get Started
          </h2>
          
          <div className="space-y-4">
            <Link 
              to="/login" 
              className="block w-full border border-gray-300 p-2 text-center hover:bg-gray-50"
            >
              Sign in
            </Link>
            
            <Link
              to="/register"
              className="block w-full border border-gray-300 p-2 text-center hover:bg-gray-50"
            >
              Create account
            </Link>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Default admin credentials:</p>
            <p>Username: admin | Password: admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage; 