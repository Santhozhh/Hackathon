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

  const token = JSON.parse(localStorage.getItem('user'))?.token;
  
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/equipment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEquipment(response.data.equipment);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError('Failed to load equipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
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
      await axios.post(`${API_URL}/equipment`, newEquipment, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchEquipment();
      setNewEquipment({ name: '', type: '' });
    } catch (err) {
      console.error('Error adding equipment:', err);
      setError(err.response?.data?.message || 'Failed to add equipment. Please try again.');
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
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchEquipment();
      setSelectedEquipment('');
      setPatientName('');
    } catch (err) {
      console.error('Error assigning equipment:', err);
      setError(err.response?.data?.message || 'Failed to assign equipment. Please try again.');
    } finally {
      setIsAssigningEquipment(false);
    }
  };
  
  const handleReturnEquipment = async (equipmentId) => {
    try {
      setIsReturningEquipment(true);
      await axios.post(`${API_URL}/equipment/return`, { equipmentId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchEquipment();
      
      // Also refresh patient equipment list if we're viewing a patient
      if (searchPatient) {
        handleSearchPatientEquipment();
      }
    } catch (err) {
      console.error('Error returning equipment:', err);
      setError(err.response?.data?.message || 'Failed to return equipment. Please try again.');
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
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPatientEquipment(response.data.equipment);
    } catch (err) {
      console.error('Error searching patient equipment:', err);
      setError(err.response?.data?.message || 'Failed to search patient equipment. Please try again.');
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
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Equipment</h3>
          <p className="mt-2 text-3xl font-bold">{stats.totalEquipment}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">In Use</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.inUseEquipment}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Available</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.availableEquipment}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Usage Rate</h3>
          <p className="mt-2 text-3xl font-bold">{stats.usageRate}%</p>
        </div>
      </div>
      
      {/* Action Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Equipment Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Equipment</h3>
          <form onSubmit={handleAddEquipment}>
            <div className="mb-4">
              <label htmlFor="equipmentName" className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Name
              </label>
              <input
                type="text"
                id="equipmentName"
                name="name"
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={newEquipment.name}
                onChange={handleNewEquipmentChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="equipmentType" className="block text-sm font-medium text-gray-700 mb-1">
                Equipment Type
              </label>
              <input
                type="text"
                id="equipmentType"
                name="type"
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={newEquipment.type}
                onChange={handleNewEquipmentChange}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAddingEquipment}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
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