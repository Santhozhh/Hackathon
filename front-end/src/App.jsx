import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import BedDashboard from './components/BedDashboard';
import EquipmentDashboard from './components/EquipmentDashboard';
import HomePage from './components/HomePage';
import './App.css'

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {user && (
          <header className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Hospital Tracker</h1>
              <div className="flex items-center gap-4">
                <span>Welcome, {user.username}</span>
                <button 
                  onClick={handleLogout}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>
        )}
        
        <main className={user ? "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" : ""}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register onRegister={handleLogin} />} />
            <Route 
              path="/dashboard"
              element={
                user ? (
                  user.role === "bedManager" ? <Navigate to="/beds" /> : <Navigate to="/equipment" />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route 
              path="/beds" 
              element={
                user ? 
                  user.role === "bedManager" ? <BedDashboard /> : <Navigate to="/dashboard" />
                  : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/equipment" 
              element={
                user ? 
                  user.role === "equipmentManager" ? <EquipmentDashboard /> : <Navigate to="/dashboard" />
                  : <Navigate to="/login" />
              } 
            />
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <HomePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
