import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function BedDashboard() {
  const [beds, setBeds] = useState([]);
  const [bedHistory, setBedHistory] = useState([]);
  const [stats, setStats] = useState({
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    maintenanceBeds: 0,
    occupancyRate: 0,
    availableRate: 0,
    maintenanceRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  
  // Form states
  const [addBedCount, setAddBedCount] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [patientToDischarge, setPatientToDischarge] = useState('');
  const [bedToMaintain, setBedToMaintain] = useState('');
  const [bedToReturn, setBedToReturn] = useState('');
  const [bedToRemove, setBedToRemove] = useState('');
  
  // Action states
  const [isAddingBeds, setIsAddingBeds] = useState(false);
  const [isAllocatingBed, setIsAllocatingBed] = useState(false);
  const [isDischargingBed, setIsDischargingBed] = useState(false);
  const [isMaintenanceBed, setIsMaintenanceBed] = useState(false);
  const [isReturningBed, setIsReturningBed] = useState(false);
  const [isRemovingBed, setIsRemovingBed] = useState(false);

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('user')) || {};
  const token = userInfo.token || '';
  const role = userInfo.role || 'bedManager';
  
  // Helper to get auth headers
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'X-User-Role': role
  });
  
  const fetchBeds = async () => {
    try {
      setLoading(true);
      console.log('Fetching beds with token:', token, 'and role:', role);
      
      const response = await axios.get(`${API_URL}/beds`, {
        headers: getAuthHeaders()
      });
      
      setBeds(response.data.beds);
      
      // Calculate stats including maintenance beds
      const allBeds = response.data.beds;
      const totalBeds = allBeds.length;
      const occupiedBeds = allBeds.filter(bed => bed.isOccupied && !bed.isUnderMaintenance).length;
      const maintenanceBeds = allBeds.filter(bed => bed.isUnderMaintenance).length;
      const availableBeds = totalBeds - occupiedBeds - maintenanceBeds;
      const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
      const availableRate = totalBeds > 0 ? (availableBeds / totalBeds) * 100 : 0;
      const maintenanceRate = totalBeds > 0 ? (maintenanceBeds / totalBeds) * 100 : 0;
      
      setStats({
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        occupancyRate: Math.round(occupancyRate),
        availableRate: Math.round(availableRate),
        maintenanceRate: Math.round(maintenanceRate)
      });
    } catch (err) {
      console.error('Error fetching beds:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to load beds: ${errorMsg}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBedHistory = async () => {
    try {
      setHistoryLoading(true);
      console.log('Fetching bed history with token:', token, 'and role:', role);
      
      const response = await axios.get(`${API_URL}/beds/history`, {
        headers: getAuthHeaders()
      });
      
      setBedHistory(response.data.history);
    } catch (err) {
      console.error('Error fetching bed history:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setHistoryError(`Failed to load bed history: ${errorMsg}. Please try again.`);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBeds();
    fetchBedHistory();
  }, []);
  
  // After allocation or discharge, refresh both beds and history
  const refreshData = () => {
    fetchBeds();
    fetchBedHistory();
  };
  
  const handleAddBeds = async (e) => {
    e.preventDefault();
    
    try {
      setIsAddingBeds(true);
      console.log('Adding beds with role:', role);
      
      await axios.post(`${API_URL}/beds`, { count: addBedCount }, {
        headers: getAuthHeaders()
      });
      
      fetchBeds();
      setAddBedCount(1);
    } catch (err) {
      console.error('Error adding beds:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to add beds: ${errorMsg}. Please check your permissions.`);
    } finally {
      setIsAddingBeds(false);
    }
  };
  
  const handleRemoveBed = async (e) => {
    e.preventDefault();
    
    try {
      setIsRemovingBed(true);
      console.log('Removing bed with number:', bedToRemove, 'and role:', role);
      
      // Make sure bedNumber is properly formatted
      if (!bedToRemove || isNaN(parseInt(bedToRemove))) {
        setError("Please enter a valid bed number");
        setIsRemovingBed(false);
        return;
      }
      
      const response = await axios.delete(`${API_URL}/beds/${bedToRemove}`, {
        headers: getAuthHeaders()
      });
      
      console.log('Remove bed response:', response.data);
      
      // Show success message
      setError('');
      alert(`Bed ${bedToRemove} has been successfully removed`);
      
      fetchBeds();
      setBedToRemove('');
    } catch (err) {
      console.error('Error removing bed:', err);
      console.error('Error details:', err.response || err);
      
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to remove bed: ${errorMsg}. Please check if the bed is available.`);
    } finally {
      setIsRemovingBed(false);
    }
  };
  
  const handleAllocateBed = async (e) => {
    e.preventDefault();
    
    try {
      setIsAllocatingBed(true);
      await axios.post(`${API_URL}/beds/allocate`, { patientName }, {
        headers: getAuthHeaders()
      });
      
      refreshData();
      setPatientName('');
    } catch (err) {
      console.error('Error allocating bed:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to allocate bed: ${errorMsg}. Please try again.`);
    } finally {
      setIsAllocatingBed(false);
    }
  };
  
  const handleDischargeBed = async (e) => {
    e.preventDefault();
    
    try {
      setIsDischargingBed(true);
      const response = await axios.post(`${API_URL}/beds/discharge`, { patientName: patientToDischarge }, {
        headers: getAuthHeaders()
      });
      
      refreshData();
      setPatientToDischarge('');
    } catch (err) {
      console.error('Error discharging bed:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      
      // Check for patient not found error
      if (errorMsg.includes('No allocated bed found for this patient')) {
        setError(`Patient "${patientToDischarge}" is not in any bed. Please check the name.`);
      } else {
        setError(`Failed to discharge bed: ${errorMsg}. Please try again.`);
      }
    } finally {
      setIsDischargingBed(false);
    }
  };
  
  const handleMaintenanceBed = async (e) => {
    e.preventDefault();
    
    try {
      setIsMaintenanceBed(true);
      await axios.post(`${API_URL}/beds/maintenance`, { bedNumber: bedToMaintain }, {
        headers: getAuthHeaders()
      });
      
      fetchBeds();
      setBedToMaintain('');
    } catch (err) {
      console.error('Error setting bed to maintenance:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to set bed for maintenance: ${errorMsg}. Please try again.`);
    } finally {
      setIsMaintenanceBed(false);
    }
  };
  
  const handleReturnBedFromMaintenance = async (e) => {
    e.preventDefault();
    
    try {
      setIsReturningBed(true);
      await axios.post(`${API_URL}/beds/return-from-maintenance`, { bedNumber: bedToReturn }, {
        headers: getAuthHeaders()
      });
      
      fetchBeds();
      setBedToReturn('');
    } catch (err) {
      console.error('Error returning bed from maintenance:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to return bed from maintenance: ${errorMsg}. Please try again.`);
    } finally {
      setIsReturningBed(false);
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
          <p className="text-sm text-gray-500">({stats.occupancyRate}%)</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Available Beds</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.availableBeds}</p>
          <p className="text-sm text-gray-500">({stats.availableRate}%)</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Maintenance</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.maintenanceBeds}</p>
          <p className="text-sm text-gray-500">({stats.maintenanceRate}%)</p>
        </div>
      </div>
      
      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Occupancy Rate</h3>
          <div className="mt-2 relative pt-1">
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-gray-200">
              <div 
                style={{ width: `${stats.occupancyRate}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
              ></div>
            </div>
            <p className="text-xl font-bold">{stats.occupancyRate}%</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Available Rate</h3>
          <div className="mt-2 relative pt-1">
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-gray-200">
              <div 
                style={{ width: `${stats.availableRate}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
              ></div>
            </div>
            <p className="text-xl font-bold">{stats.availableRate}%</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Maintenance Rate</h3>
          <div className="mt-2 relative pt-1">
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-gray-200">
              <div 
                style={{ width: `${stats.maintenanceRate}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
              ></div>
            </div>
            <p className="text-xl font-bold">{stats.maintenanceRate}%</p>
          </div>
        </div>
      </div>
      
      {/* Action Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        
        {/* Remove Bed Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Remove Beds</h3>
          <form onSubmit={handleRemoveBed}>
            <div className="mb-4">
              <label htmlFor="bedToRemove" className="block text-sm font-medium text-gray-700 mb-1">
                Bed Number to Remove
              </label>
              <input
                type="number"
                id="bedToRemove"
                min="1"
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={bedToRemove}
                onChange={(e) => setBedToRemove(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isRemovingBed}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-red-400"
            >
              {isRemovingBed ? 'Removing...' : 'Remove Bed'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Patient Management Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      
      {/* Maintenance Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Set Bed for Maintenance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Set Bed for Maintenance</h3>
          <form onSubmit={handleMaintenanceBed}>
            <div className="mb-4">
              <label htmlFor="bedToMaintain" className="block text-sm font-medium text-gray-700 mb-1">
                Bed Number
              </label>
              <input
                type="number"
                id="bedToMaintain"
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={bedToMaintain}
                onChange={(e) => setBedToMaintain(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isMaintenanceBed}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:bg-yellow-400"
            >
              {isMaintenanceBed ? 'Processing...' : 'Set for Maintenance'}
            </button>
          </form>
        </div>
        
        {/* Return Bed from Maintenance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Return Bed from Maintenance</h3>
          <form onSubmit={handleReturnBedFromMaintenance}>
            <div className="mb-4">
              <label htmlFor="bedToReturn" className="block text-sm font-medium text-gray-700 mb-1">
                Bed Number
              </label>
              <input
                type="number"
                id="bedToReturn"
                className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                value={bedToReturn}
                onChange={(e) => setBedToReturn(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isReturningBed}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isReturningBed ? 'Processing...' : 'Return to Service'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Patient History Table - Replace with cards */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Patient History</h3>
          
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
              onClick={() => fetchBedHistory()}
            >
              Refresh
            </button>
          </div>
        </div>
        
        {historyError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
            {historyError}
            <button 
              className="float-right font-bold"
              onClick={() => setHistoryError('')}
            >
              &times;
            </button>
          </div>
        )}
        
        {historyLoading ? (
          <div className="text-center my-8">Loading history...</div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bedHistory.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No patient history available
                </div>
              ) : (
                bedHistory.map((record) => (
                  <div 
                    key={record._id} 
                    className={`overflow-hidden rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${
                      record.isActive 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-lg font-bold">{record.bedNumber}</span>
                          <div className="text-xs text-gray-500">Bed Number</div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          record.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.isActive ? 'Current' : 'Discharged'}
                        </span>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="text-xs font-medium text-gray-500">Patient:</div>
                          <div className="text-sm font-semibold">{record.patientName}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs font-medium text-gray-500">Allocated:</div>
                            <div className="text-xs">
                              {new Date(record.allocatedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(record.allocatedAt).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          {record.dischargedAt && (
                            <div>
                              <div className="text-xs font-medium text-gray-500">Discharged:</div>
                              <div className="text-xs">
                                {new Date(record.dischargedAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(record.dischargedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Beds Table with Maintenance Filter */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Bed List</h3>
          
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
              onClick={() => fetchBeds()}
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Card-based bed list */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {beds.map((bed) => (
              <div 
                key={bed._id} 
                className={`relative overflow-hidden rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${
                  bed.isUnderMaintenance 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : bed.isOccupied 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="absolute top-0 right-0">
                  <div 
                    className={`text-white px-4 py-1 m-1 text-xs font-bold ${
                      bed.isUnderMaintenance 
                        ? 'bg-yellow-500' 
                        : bed.isOccupied 
                          ? 'bg-red-500' 
                          : 'bg-green-500'
                    }`}
                  >
                    {bed.isUnderMaintenance 
                      ? 'MAINTENANCE' 
                      : bed.isOccupied 
                        ? 'OCCUPIED' 
                        : 'AVAILABLE'}
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="text-center mb-3">
                    <span className="text-4xl font-bold">{bed.bedNumber}</span>
                    <div className="text-xs mt-1 text-gray-500">Bed Number</div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    {bed.isOccupied ? (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-500">Patient:</span>
                          <span className="text-sm font-semibold">{bed.patientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-500">Since:</span>
                          <span className="text-xs">
                            {bed.allocatedAt ? new Date(bed.allocatedAt).toLocaleString() : '-'}
                          </span>
                        </div>
                      </div>
                    ) : bed.isUnderMaintenance ? (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-500">Maintenance Since:</span>
                          <span className="text-xs">
                            {bed.maintenanceStartTime ? new Date(bed.maintenanceStartTime).toLocaleString() : '-'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-1">
                        <span className="text-sm text-green-600 font-medium">Ready for allocation</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div 
                  className={`px-4 py-2 text-xs font-medium text-center text-white ${
                    bed.isUnderMaintenance 
                      ? 'bg-yellow-500' 
                      : bed.isOccupied 
                        ? 'bg-red-500' 
                        : 'bg-green-500'
                  }`}
                >
                  {bed.isUnderMaintenance 
                    ? 'Under Maintenance' 
                    : bed.isOccupied 
                      ? `Occupied by ${bed.patientName}` 
                      : 'Available for Patients'}
                </div>
              </div>
            ))}
          </div>
          
          {/* Show message if no beds */}
          {beds.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No beds available. Please add beds to get started.
            </div>
          )}
        </div>
      </div>
      
      {/* Maintenance Beds Table - Replace with cards */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Beds Under Maintenance</h3>
          
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
              onClick={() => fetchBeds()}
            >
              Refresh
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {beds.filter(bed => bed.isUnderMaintenance).length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No beds currently under maintenance
              </div>
            ) : (
              beds.filter(bed => bed.isUnderMaintenance).map((bed) => (
                <div 
                  key={bed._id} 
                  className="relative overflow-hidden rounded-lg border border-yellow-200 bg-yellow-50 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="absolute top-0 right-0">
                    <div className="bg-yellow-500 text-white px-4 py-1 m-1 text-xs font-bold">
                      MAINTENANCE
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="text-center mb-3">
                      <span className="text-4xl font-bold">{bed.bedNumber}</span>
                      <div className="text-xs mt-1 text-gray-500">Bed Number</div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-500">Maintenance Since:</span>
                          <span className="text-xs">
                            {bed.maintenanceStartTime ? new Date(bed.maintenanceStartTime).toLocaleString() : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-2 text-xs font-medium text-center text-white bg-yellow-500">
                    Under Maintenance
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BedDashboard; 