import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

function HomePage() {
  const [showCredentials, setShowCredentials] = useState(false);
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-900">
      
      {/* Header Section */}
      <motion.header
        className="w-full bg-blue-600 text-white py-6 text-center shadow-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold">Hospital Bed & Equipment Tracker</h1>
        <p className="mt-2 text-lg">Efficiently manage hospital resources and improve patient care.</p>
      </motion.header>

      {/* Feature Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mt-12">
        {[
          { 
            title: "Bed Management", 
            description: "Real-time bed availability tracking for improved patient allocation.",
            icon: "🛏️" 
          },
          { 
            title: "Equipment Tracking", 
            description: "Monitor hospital equipment inventory and assignments efficiently.",
            icon: "⚕️" 
          },
          { 
            title: "Resource Monitoring", 
            description: "Track utilization metrics and optimize medical resources.",
            icon: "📊" 
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="p-6 bg-white rounded-lg shadow-md border border-gray-300 text-center cursor-pointer"
          >
            <h3 className="font-semibold text-xl mb-2 flex items-center justify-center">
              <span className="text-2xl mr-2">{item.icon}</span> {item.title}
            </h3>
            <p className="text-gray-600">{item.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Authentication Section */}
      <motion.div
        className="w-full max-w-4xl mx-auto bg-white border border-gray-300 p-12 rounded-lg shadow-md mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold text-center mb-6 text-blue-600">
          Get Started
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link
              to="/login"
              className="block w-full px-6 py-4 text-center font-semibold bg-blue-600 text-white rounded-md transition hover:bg-blue-700"
            >
              Sign in
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }}>
            <Link
              to="/register"
              className="block w-full px-6 py-4 text-center font-semibold bg-gray-600 text-white rounded-md transition hover:bg-gray-700"
            >
              Create account
            </Link>
          </motion.div>
        </div>



        {/* Admin Credentials Toggle */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <button onClick={() => setShowCredentials(!showCredentials)} className="text-blue-600 hover:underline">
            {showCredentials ? "Hide" : "Show"} Admin Credentials
          </button>
          {showCredentials && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-3 p-2 border rounded bg-gray-100"
            >
              <p>Username: <strong>admin</strong></p>
              <p>Password: <strong>admin</strong></p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Interactive Flip Card */}
      <motion.div
        className="relative w-60 h-80 mt-12 cursor-pointer"
        onClick={() => setFlipped(!flipped)}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.8 }}
        style={{ transformStyle: "preserve-3d" }}
      >
      </motion.div>

      {/* Footer */}
      <footer className="mt-12 bg-gray-800 text-white py-4 w-full text-center">
        <p className="text-sm">© {new Date().getFullYear()} Hospital Tracker | Designed for Healthcare Efficiency</p>
      </footer>
    </div>
  );
}

export default HomePage;
