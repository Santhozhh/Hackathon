import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function BedDashboard() {
  const [beds, setBeds] = useState([]);
  const [stats, setStats] = useState({
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [addBedCount, setAddBedCount] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [patientToDischarge, setPatientToDischarge] = useState('');
  
  // Action states
  const [isAddingBeds, setIsAddingBeds] = useState(false);
  const [isAllocatingBed, setIsAllocatingBed] = useState(false);
  const [isDischargingBed, setIsDischargingBed] = useState(false);

  const token = JSON.parse(localStorage.getItem('user'))?.token;
  
  const fetchBeds = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/beds`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBeds(response.data.beds);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching beds:', err);
      setError('Failed to load beds. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBeds();
  }, []);
  
  const handleAddBeds = async (e) => {
    e.preventDefault();
    
    try {
      setIsAddingBeds(true);
      await axios.post(`${API_URL}/beds`, { count: addBedCount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchBeds();
      setAddBedCount(1);
    } catch (err) {
      console.error('Error adding beds:', err);
      setError(err.response?.data?.message || 'Failed to add beds. Please try again.');
    } finally {
      setIsAddingBeds(false);
    }
  };
  
  const handleAllocateBed = async (e) => {
    e.preventDefault();
    
    try {
      setIsAllocatingBed(true);
      await axios.post(`${API_URL}/beds/allocate`, { patientName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchBeds();
      setPatientName('');
    } catch (err) {
      console.error('Error allocating bed:', err);
      setError(err.response?.data?.message || 'Failed to allocate bed. Please try again.');
    } finally {
      setIsAllocatingBed(false);
    }
  };
  
  const handleDischargeBed = async (e) => {
    e.preventDefault();
    
    try {
      setIsDischargingBed(true);
      await axios.post(`${API_URL}/beds/discharge`, { patientName: patientToDischarge }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchBeds();
      setPatientToDischarge('');
    } catch (err) {
      console.error('Error discharging bed:', err);
      setError(err.response?.data?.message || 'Failed to discharge bed. Please try again.');
    } finally {
      setIsDischargingBed(false);
    }
  };

  if (loading && beds.length === 0) {
    return <div className="text-center my-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Bed Manager Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button 
            className="float-right font-bold"
            onClick={() => setError('')}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Beds</h3>
          <p className="mt-2 text-3xl font-bold">{stats.totalBeds}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Occupied Beds</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.occupiedBeds}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Available Beds</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.availableBeds}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Occupancy Rate</h3>
          <p className="mt-2 text-3xl font-bold">{stats.occupancyRate}%</p>
        </div>
      </div>
      
      {/* Action Forms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Beds Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Beds</h3>
          <form onSubmit={handleAddBeds}>
            <div className="mb-4">
              <label htmlFor="bedCount" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Beds
              </label>
              <input
                type="number"
                id="bedCount"
                min="1"
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={addBedCount}
                onChange={(e) => setAddBedCount(parseInt(e.target.value))}
              />
            </div>
            <button
              type="submit"
              disabled={isAddingBeds}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {isAddingBeds ? 'Adding...' : 'Add Beds'}
            </button>
          </form>
        </div>
        
        {/* Allocate Bed Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Allocate Bed</h3>
          <form onSubmit={handleAllocateBed}>
            <div className="mb-4">
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name
              </label>
              <input
                type="text"
                id="patientName"
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAllocatingBed || stats.availableBeds === 0}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-400"
            >
              {isAllocatingBed ? 'Allocating...' : 'Allocate Bed'}
            </button>
          </form>
        </div>
        
        {/* Discharge Bed Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Discharge Patient</h3>
          <form onSubmit={handleDischargeBed}>
            <div className="mb-4">
              <label htmlFor="patientToDischarge" className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name
              </label>
              <input
                type="text"
                id="patientToDischarge"
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={patientToDischarge}
                onChange={(e) => setPatientToDischarge(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isDischargingBed}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-red-400"
            >
              {isDischargingBed ? 'Discharging...' : 'Discharge Patient'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Beds Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <h3 className="text-lg font-medium text-gray-900 p-6 border-b">Bed List</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bed Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocated At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {beds.map((bed) => (
                <tr key={bed._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bed.bedNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bed.isOccupied ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {bed.isOccupied ? 'Occupied' : 'Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bed.patientName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bed.allocatedAt ? new Date(bed.allocatedAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BedDashboard; 