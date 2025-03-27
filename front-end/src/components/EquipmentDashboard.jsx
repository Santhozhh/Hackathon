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
  
  // Add sidebar and section states
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Collapsible Sidebar */}
      <div 
        className={`${
          isSidebarExpanded ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 ease-in-out relative`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-8 bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
        >
          <span className="material-icons text-gray-600 text-xl">
            {isSidebarExpanded ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>

        {/* Logo Section */}
        <div className="p-4 border-b bg-gradient-to-r from-cyan-600 to-blue-500">
          <div className="flex items-center space-x-4">
            <span className="material-icons text-white text-3xl">inventory_2</span>
            {isSidebarExpanded && (
              <h1 className="text-xl font-bold text-white">Equipment Manager</h1>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          <NavButton
            icon="dashboard"
            label="Overview"
            isActive={activeSection === 'overview'}
            onClick={() => setActiveSection('overview')}
            isExpanded={isSidebarExpanded}
            color="cyan"
          />
          <NavButton
            icon="add_circle"
            label="Add Equipment"
            isActive={activeSection === 'add'}
            onClick={() => setActiveSection('add')}
            isExpanded={isSidebarExpanded}
            color="blue"
          />
          <NavButton
            icon="assignment"
            label="Assign Equipment"
            isActive={activeSection === 'assign'}
            onClick={() => setActiveSection('assign')}
            isExpanded={isSidebarExpanded}
            color="green"
          />
          <NavButton
            icon="person_search"
            label="Patient Search"
            isActive={activeSection === 'search'}
            onClick={() => setActiveSection('search')}
            isExpanded={isSidebarExpanded}
            color="amber"
          />
          <NavButton
            icon="list_alt"
            label="Equipment List"
            isActive={activeSection === 'list'}
            onClick={() => setActiveSection('list')}
            isExpanded={isSidebarExpanded}
            color="purple"
          />
        </nav>

        {/* User Info */}
        {isSidebarExpanded && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                <span className="material-icons text-white text-sm">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userInfo.name || 'Equipment Manager'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {role}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeSection === 'overview' && 'Equipment Dashboard'}
              {activeSection === 'add' && 'Add New Equipment'}
              {activeSection === 'assign' && 'Assign Equipment to Patient'}
              {activeSection === 'search' && 'Search Patient Equipment'}
              {activeSection === 'list' && 'Equipment Inventory'}
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => fetchEquipment()}
                className="flex items-center px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors"
              >
                <span className="material-icons mr-2 text-sm">refresh</span>
                Refresh
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg relative">
              <button 
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                onClick={() => setError('')}
              >
                <span className="material-icons">close</span>
              </button>
              <div className="flex items-center">
                <span className="material-icons mr-2">error_outline</span>
                {error}
              </div>
            </div>
          )}

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-cyan-500">
                <h2 className="text-xl font-semibold mb-4 text-cyan-800 border-b pb-2">Equipment Statistics</h2>
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
              </section>

              {/* Equipment List Preview */}
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-cyan-500">
                <h2 className="text-xl font-semibold mb-4 text-cyan-800 border-b pb-2 flex justify-between items-center">
                  <span>Equipment Overview</span>
                  <button 
                    className="px-3 py-1 text-sm bg-cyan-100 text-cyan-700 font-medium rounded-md hover:bg-cyan-200 transition-colors duration-200"
                    onClick={() => setActiveSection('list')}
                  >
                    View All
                  </button>
                </h2>
                {equipment.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No equipment available. Add equipment to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {equipment.slice(0, 5).map((eq) => (
                          <tr key={eq._id} className="hover:bg-gray-50">
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {equipment.length > 5 && (
                      <div className="bg-gray-50 px-6 py-3 text-right text-sm text-gray-500">
                        Showing 5 of {equipment.length} items
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Add Equipment Section */}
          {activeSection === 'add' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <h2 className="text-xl font-semibold mb-4 text-blue-800 border-b pb-2">Add New Equipment</h2>
                <div className="max-w-md mx-auto">
                  <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-md p-6 border border-blue-100">
                    <form onSubmit={handleAddEquipment}>
                      <div className="mb-4">
                        <label htmlFor="equipmentName" className="block text-sm font-medium text-blue-700 mb-1">
                          Equipment Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="equipmentName"
                          name="name"
                          className="w-full rounded-md border-blue-300 shadow-sm p-2 border focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          value={newEquipment.name}
                          onChange={handleNewEquipmentChange}
                          required
                          placeholder="Enter equipment name (e.g. Ventilator 3000)"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="equipmentType" className="block text-sm font-medium text-blue-700 mb-1">
                          Equipment Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="equipmentType"
                          name="type"
                          className="w-full rounded-md border-blue-300 shadow-sm p-2 border focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
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
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-blue-800 disabled:opacity-70 transition-all duration-200 shadow-md"
                      >
                        {isAddingEquipment ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </span>
                        ) : 'Add Equipment'}
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Assign Equipment Section */}
          {activeSection === 'assign' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <h2 className="text-xl font-semibold mb-4 text-green-800 border-b pb-2">Assign Equipment to Patient</h2>
                <div className="max-w-md mx-auto">
                  <div className="bg-gradient-to-br from-white to-green-50 rounded-lg shadow-md p-6 border border-green-100">
                    <form onSubmit={handleAssignEquipment}>
                      <div className="mb-4">
                        <label htmlFor="selectedEquipment" className="block text-sm font-medium text-green-700 mb-1">
                          Select Equipment <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="selectedEquipment"
                          className="w-full rounded-md border-green-300 shadow-sm p-2 border focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
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
                        <label htmlFor="patientNameAssign" className="block text-sm font-medium text-green-700 mb-1">
                          Patient Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="patientNameAssign"
                          className="w-full rounded-md border-green-300 shadow-sm p-2 border focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          required
                          placeholder="Enter patient name"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isAssigningEquipment || stats.availableEquipment === 0}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 rounded-md hover:from-green-700 hover:to-green-800 disabled:opacity-70 transition-all duration-200 shadow-md"
                      >
                        {isAssigningEquipment ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Assigning...
                          </span>
                        ) : 'Assign Equipment'}
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Search Patient Equipment Section */}
          {activeSection === 'search' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
                <h2 className="text-xl font-semibold mb-4 text-amber-800 border-b pb-2">Search Equipment by Patient</h2>
                <div className="bg-gradient-to-br from-white to-amber-50 rounded-lg shadow-md p-6 border border-amber-100">
                  <form onSubmit={handleSearchPatientEquipment} className="flex space-x-4">
                    <div className="flex-grow">
                      <input
                        type="text"
                        placeholder="Enter patient name"
                        className="w-full rounded-md border-amber-300 shadow-sm p-2 border focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                        value={searchPatient}
                        onChange={(e) => setSearchPatient(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-2 px-4 rounded-md hover:from-amber-700 hover:to-amber-800 disabled:opacity-70 transition-all duration-200 shadow-md flex items-center"
                    >
                      <span className="material-icons mr-2">search</span>
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </form>
                  
                  {patientEquipment.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium mb-3 text-amber-800 border-b pb-2">Equipment assigned to <span className="font-bold">{searchPatient}</span></h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {patientEquipment.map(eq => (
                          <div key={eq._id} className="bg-white rounded-lg shadow-sm border border-amber-200 p-3 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-gray-900">{eq.name}</span>
                                <p className="text-xs text-gray-600 mt-1">{eq.type}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Assigned: {new Date(eq.assignedAt).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={() => handleReturnEquipment(eq._id)}
                                disabled={isReturningEquipment}
                                className="bg-red-100 text-red-700 py-1 px-2 rounded-md hover:bg-red-200 text-xs font-medium flex items-center"
                              >
                                <span className="material-icons text-xs mr-1">keyboard_return</span>
                                Return
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {searchPatient && patientEquipment.length === 0 && !isSearching && (
                    <div className="mt-4 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg flex items-center">
                      <span className="material-icons mr-2">info</span>
                      <p>No equipment assigned to this patient.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Equipment List Section */}
          {activeSection === 'list' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <h2 className="text-xl font-semibold mb-4 text-purple-800 border-b pb-2">Complete Equipment Inventory</h2>
                {equipment.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No equipment available. Add equipment to get started.
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-white to-purple-50 rounded-lg border border-purple-100 overflow-hidden shadow-md">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-purple-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                              Patient
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {equipment.map((eq) => (
                            <tr key={eq._id} className="hover:bg-purple-50 transition-colors">
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
                                    className="text-red-600 hover:text-red-900 disabled:text-red-400 flex items-center"
                                  >
                                    <span className="material-icons text-sm mr-1">undo</span>
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
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// NavButton Component
const NavButton = ({ icon, label, isActive, onClick, isExpanded, color }) => {
  const getColorClasses = () => {
    const colors = {
      cyan: 'hover:bg-cyan-50 hover:text-cyan-700',
      blue: 'hover:bg-blue-50 hover:text-blue-700',
      green: 'hover:bg-green-50 hover:text-green-700',
      amber: 'hover:bg-amber-50 hover:text-amber-700',
      purple: 'hover:bg-purple-50 hover:text-purple-700'
    };
    
    if (isActive) {
      return `bg-${color}-100 text-${color}-700`;
    }
    return `text-gray-600 ${colors[color]}`;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center ${isExpanded ? 'px-4' : 'justify-center'} py-3 rounded-lg transition-all duration-200 ${getColorClasses()}`}
      title={!isExpanded ? label : ''}
    >
      <span className="material-icons text-xl">{icon}</span>
      {isExpanded && <span className="ml-3 font-medium">{label}</span>}
    </button>
  );
};

export default EquipmentDashboard; 