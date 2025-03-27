import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function EquipmentDashboard() {
  const [equipment, setEquipment] = useState([]);
  const [stats, setStats] = useState({
    totalEquipment: 0,
    inUseEquipment: 0,
    availableEquipment: 0,
    usageRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    type: ''
  });
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [patientName, setPatientName] = useState('');
  const [searchPatient, setSearchPatient] = useState('');
  const [patientEquipment, setPatientEquipment] = useState([]);
  
  // Action states
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [isAssigningEquipment, setIsAssigningEquipment] = useState(false);
  const [isReturningEquipment, setIsReturningEquipment] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('user')) || {};
  const token = userInfo.token || '';
  const role = userInfo.role || '';
  
  // Helper to get auth headers
  const getAuthHeaders = () => {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-User-Role': role
    };
    console.log('Using auth headers:', headers);
    return headers;
  };
  
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      console.log('Fetching equipment with token:', token, 'and role:', role);
      
      const response = await axios.get(`${API_URL}/equipment`, {
        headers: getAuthHeaders()
      });
      
      setEquipment(response.data.equipment);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to load equipment: ${errorMsg}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Check authentication on component mount
    if (!token) {
      setError('Please log in to manage equipment');
      return;
    }
    if (!role) {
      setError('User role not found. Please log in again');
      return;
    }
    // Allow both equipmentManager and bedManager roles
    if (role !== 'equipmentManager' && role !== 'bedManager') {
      setError('You need equipment manager or bed manager permissions to add or manage equipment');
      return;
    }
    
    fetchEquipment();
  }, []);
  
  const handleNewEquipmentChange = (e) => {
    const { name, value } = e.target;
    setNewEquipment(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddEquipment = async (e) => {
    e.preventDefault();
    
    try {
      setIsAddingEquipment(true);
      setError(''); // Clear previous errors
      
      // Validate input
      if (!newEquipment.name.trim()) {
        setError('Equipment name is required');
        setIsAddingEquipment(false);
        return;
      }
      
      if (!newEquipment.type.trim()) {
        setError('Equipment type is required');
        setIsAddingEquipment(false);
        return;
      }
      
      console.log('Adding equipment:', newEquipment, 'with role:', role);
      console.log('Auth headers:', getAuthHeaders());
      
      const response = await axios.post(`${API_URL}/equipment`, newEquipment, {
        headers: getAuthHeaders()
      });
      
      console.log('Add equipment response:', response.data);
      
      // Show success alert
      alert(`Equipment "${newEquipment.name}" added successfully`);
      
      fetchEquipment();
      setNewEquipment({ name: '', type: '' });
    } catch (err) {
      console.error('Error adding equipment:', err);
      console.error('Error details:', err.response || err);
      
      // Check for specific error responses
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to add equipment. Only equipment managers can perform this action.');
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
        setError(`Failed to add equipment: ${errorMsg}`);
      }
    } finally {
      setIsAddingEquipment(false);
    }
  };
  
  const handleAssignEquipment = async (e) => {
    e.preventDefault();
    
    if (!selectedEquipment) {
      setError('Please select equipment to assign');
      return;
    }
    
    try {
      setIsAssigningEquipment(true);
      await axios.post(`${API_URL}/equipment/assign`, {
        equipmentId: selectedEquipment,
        patientName
      }, {
        headers: getAuthHeaders()
      });
      
      fetchEquipment();
      setSelectedEquipment('');
      setPatientName('');
    } catch (err) {
      console.error('Error assigning equipment:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to assign equipment: ${errorMsg}. Please try again.`);
    } finally {
      setIsAssigningEquipment(false);
    }
  };
  
  const handleReturnEquipment = async (equipmentId) => {
    try {
      setIsReturningEquipment(true);
      await axios.post(`${API_URL}/equipment/return`, { equipmentId }, {
        headers: getAuthHeaders()
      });
      
      fetchEquipment();
      
      // Also refresh patient equipment list if we're viewing a patient
      if (searchPatient) {
        handleSearchPatientEquipment();
      }
    } catch (err) {
      console.error('Error returning equipment:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to return equipment: ${errorMsg}. Please try again.`);
    } finally {
      setIsReturningEquipment(false);
    }
  };
  
  const handleSearchPatientEquipment = async (e) => {
    if (e) e.preventDefault();
    
    if (!searchPatient) {
      setPatientEquipment([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await axios.get(`${API_URL}/equipment/by-patient/${searchPatient}`, {
        headers: getAuthHeaders()
      });
      
      setPatientEquipment(response.data.equipment);
    } catch (err) {
      console.error('Error searching patient equipment:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to search patient equipment: ${errorMsg}. Please try again.`);
    } finally {
      setIsSearching(false);
    }
  };

  if (loading && equipment.length === 0) {
    return <div className="text-center my-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Equipment Manager Dashboard</h1>
      
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-md p-4 flex flex-col items-center border-b-4 border-indigo-500 transition-transform hover:scale-105">
          <div className="text-3xl font-bold text-indigo-800 mb-1">{stats.totalEquipment}</div>
          <div className="text-sm text-indigo-600 font-medium">Total Equipment</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-lg shadow-md p-4 flex flex-col items-center border-b-4 border-rose-500 transition-transform hover:scale-105">
          <div className="text-3xl font-bold text-rose-600 mb-1">{stats.inUseEquipment}</div>
          <div className="text-sm text-rose-700 font-medium">In Use</div>
          <div className="mt-1 text-xs text-rose-500 font-medium">
            {stats.usageRate}% Usage Rate
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-md p-4 flex flex-col items-center border-b-4 border-emerald-500 transition-transform hover:scale-105">
          <div className="text-3xl font-bold text-emerald-600 mb-1">{stats.availableEquipment}</div>
          <div className="text-sm text-emerald-700 font-medium">Available</div>
        </div>
        
        <div className="bg-gradient-to-br from-cyan-50 to-sky-100 rounded-lg shadow-md p-4 flex flex-col items-center border-b-4 border-sky-500 transition-transform hover:scale-105">
          <div className="text-3xl font-bold text-sky-600 mb-1">{stats.usageRate}%</div>
          <div className="text-sm text-sky-700 font-medium">Usage Rate</div>
          <div className="mt-2 relative pt-1 w-full">
            <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-sky-100">
              <div 
                style={{ width: `${stats.usageRate}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-sky-500 to-blue-600 rounded-full"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Equipment Form */}
        <div className="bg-gradient-to-br from-white to-cyan-50 rounded-lg shadow-md p-4 border border-cyan-100">
          <h3 className="text-md font-medium text-cyan-800 mb-3">Add New Equipment</h3>
          <form onSubmit={handleAddEquipment}>
            <div className="mb-3">
              <label htmlFor="equipmentName" className="block text-sm font-medium text-cyan-700 mb-1">
                Equipment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="equipmentName"
                name="name"
                className="w-full rounded-md border-cyan-300 shadow-sm p-2 border focus:border-cyan-500 focus:ring focus:ring-cyan-200 focus:ring-opacity-50"
                value={newEquipment.name}
                onChange={handleNewEquipmentChange}
                required
                placeholder="Enter equipment name (e.g. Ventilator 3000)"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="equipmentType" className="block text-sm font-medium text-cyan-700 mb-1">
                Equipment Type <span className="text-red-500">*</span>
              </label>
              <select
                id="equipmentType"
                name="type"
                className="w-full rounded-md border-cyan-300 shadow-sm p-2 border focus:border-cyan-500 focus:ring focus:ring-cyan-200 focus:ring-opacity-50"
                value={newEquipment.type}
                onChange={handleNewEquipmentChange}
                required
              >
                <option value="">Select equipment type</option>
                <option value="Respiratory">Respiratory</option>
                <option value="Monitoring">Monitoring</option>
                <option value="Diagnostic">Diagnostic</option>
                <option value="Therapeutic">Therapeutic</option>
                <option value="Surgical">Surgical</option>
                <option value="Life Support">Life Support</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isAddingEquipment}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 text-white py-2 px-4 rounded-md hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-70 transition-all duration-200 shadow-md"
            >
              {isAddingEquipment ? 'Adding...' : 'Add Equipment'}
            </button>
          </form>
        </div>
        
        {/* Assign Equipment Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Equipment to Patient</h3>
          <form onSubmit={handleAssignEquipment}>
            <div className="mb-4">
              <label htmlFor="selectedEquipment" className="block text-sm font-medium text-gray-700 mb-1">
                Select Equipment
              </label>
              <select
                id="selectedEquipment"
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                required
              >
                <option value="">-- Select Equipment --</option>
                {equipment
                  .filter(eq => !eq.isInUse)
                  .map(eq => (
                    <option key={eq._id} value={eq._id}>
                      {eq.name} ({eq.type})
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="patientNameAssign" className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name
              </label>
              <input
                type="text"
                id="patientNameAssign"
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAssigningEquipment || stats.availableEquipment === 0}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-400"
            >
              {isAssigningEquipment ? 'Assigning...' : 'Assign Equipment'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Search Patient Equipment */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Equipment by Patient</h3>
        <form onSubmit={handleSearchPatientEquipment} className="flex space-x-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Enter patient name"
              className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
        
        {patientEquipment.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Equipment assigned to {searchPatient}</h4>
            <ul className="divide-y divide-gray-200">
              {patientEquipment.map(eq => (
                <li key={eq._id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-medium">{eq.name}</span> ({eq.type})
                    <p className="text-sm text-gray-500">
                      Assigned: {new Date(eq.assignedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleReturnEquipment(eq._id)}
                    disabled={isReturningEquipment}
                    className="bg-red-600 text-white py-1 px-3 rounded-md hover:bg-red-700 disabled:bg-red-400 text-sm"
                  >
                    Return
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {searchPatient && patientEquipment.length === 0 && !isSearching && (
          <p className="mt-4 text-gray-700">No equipment assigned to this patient.</p>
        )}
      </div>
      
      {/* Equipment Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <h3 className="text-lg font-medium text-gray-900 p-6 border-b">Equipment List</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipment.map((eq) => (
                <tr key={eq._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {eq.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {eq.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${eq.isInUse ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {eq.isInUse ? 'In Use' : 'Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {eq.patientName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {eq.isInUse && (
                      <button
                        onClick={() => handleReturnEquipment(eq._id)}
                        disabled={isReturningEquipment}
                        className="text-red-600 hover:text-red-900 disabled:text-red-400"
                      >
                        Return
                      </button>
                    )}
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

export default EquipmentDashboard; 