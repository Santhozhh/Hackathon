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
    maintenanceRate: 0,
    generalBeds: 0,
    icuBeds: 0,
    availableGeneralBeds: 0,
    availableIcuBeds: 0
  });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  
  // Form states
  const [addBedCount, setAddBedCount] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [wardType, setWardType] = useState('general');
  const [patientToDischarge, setPatientToDischarge] = useState('');
  const [bedToMaintain, setBedToMaintain] = useState('');
  const [bedToReturn, setBedToReturn] = useState('');
  const [bedToRemove, setBedToRemove] = useState('');
  const [bedsToRemoveCount, setBedsToRemoveCount] = useState(1);
  const [bedWardType, setBedWardType] = useState('general');
  
  // Action states
  const [isAddingBeds, setIsAddingBeds] = useState(false);
  const [isAllocatingBed, setIsAllocatingBed] = useState(false);
  const [isDischargingBed, setIsDischargingBed] = useState(false);
  const [isMaintenanceBed, setIsMaintenanceBed] = useState(false);
  const [isReturningBed, setIsReturningBed] = useState(false);
  const [isRemovingBed, setIsRemovingBed] = useState(false);
  const [isRemovingMultipleBeds, setIsRemovingMultipleBeds] = useState(false);

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('user')) || {};
  const token = userInfo.token || '';
  const role = userInfo.role || 'bedManager';
  
  // Helper to get auth headers
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'X-User-Role': role
  });
  
  // Add new state for active section
  const [activeSection, setActiveSection] = useState('overview');
  
  // Add sidebar expanded state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
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
      
      // Separate general and ICU beds
      const generalBeds = allBeds.filter(bed => bed.wardType === 'general').length;
      const icuBeds = allBeds.filter(bed => bed.wardType === 'icu').length;
      
      // Separate available general and ICU beds
      const availableGeneralBeds = allBeds.filter(bed => !bed.isOccupied && !bed.isUnderMaintenance && bed.wardType === 'general').length;
      const availableIcuBeds = allBeds.filter(bed => !bed.isOccupied && !bed.isUnderMaintenance && bed.wardType === 'icu').length;
      
      setStats({
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        occupancyRate: Math.round(occupancyRate),
        availableRate: Math.round(availableRate),
        maintenanceRate: Math.round(maintenanceRate),
        generalBeds,
        icuBeds,
        availableGeneralBeds,
        availableIcuBeds
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
      console.log('Adding beds with role:', role, 'and ward type:', bedWardType);
      
      await axios.post(`${API_URL}/beds`, { 
        count: addBedCount,
        wardType: bedWardType 
      }, {
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
      setError(''); // Clear previous errors
      
      console.log('Removing bed with number:', bedToRemove, 'and role:', role);
      
      // Make sure bedNumber is properly formatted
      if (!bedToRemove || isNaN(parseInt(bedToRemove))) {
        setError("Please enter a valid bed number");
        setIsRemovingBed(false);
        return;
      }
      
      // Check if bed exists
      const bedExists = beds.some(bed => bed.bedNumber === parseInt(bedToRemove));
      if (!bedExists) {
        setError(`Bed ${bedToRemove} does not exist in the system`);
        setIsRemovingBed(false);
        return;
      }
      
      // Check if bed is occupied or in maintenance
      const targetBed = beds.find(bed => bed.bedNumber === parseInt(bedToRemove));
      if (targetBed && targetBed.isOccupied) {
        setError(`Cannot remove bed ${bedToRemove} because it is currently occupied. Please discharge the patient first.`);
        setIsRemovingBed(false);
        return;
      }
      
      if (targetBed && targetBed.isUnderMaintenance) {
        setError(`Cannot remove bed ${bedToRemove} because it is under maintenance. Please return it from maintenance first.`);
        setIsRemovingBed(false);
        return;
      }
      
      console.log('Sending DELETE request for bed:', bedToRemove);
      console.log('Auth headers:', getAuthHeaders());
      
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
      
      // Check for specific error responses
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to remove beds. Only bed managers can perform this action.');
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
        setError(`Failed to remove bed: ${errorMsg}`);
      }
    } finally {
      setIsRemovingBed(false);
    }
  };
  
  const handleRemoveMultipleBeds = async (e) => {
    e.preventDefault();
    
    try {
      setIsRemovingMultipleBeds(true);
      setError(''); // Clear previous errors
      
      console.log('Removing multiple beds count:', bedsToRemoveCount, 'and role:', role);
      
      // Make sure count is properly formatted
      if (!bedsToRemoveCount || isNaN(parseInt(bedsToRemoveCount)) || parseInt(bedsToRemoveCount) <= 0) {
        setError("Please enter a valid number of beds to remove");
        setIsRemovingMultipleBeds(false);
        return;
      }
      
      if (parseInt(bedsToRemoveCount) > beds.length) {
        setError(`Cannot remove ${bedsToRemoveCount} beds. Only ${beds.length} beds exist in the system.`);
        setIsRemovingMultipleBeds(false);
        return;
      }
      
      // Sort beds by descending bed number to remove highest numbers first
      const sortedBeds = [...beds].sort((a, b) => b.bedNumber - a.bedNumber);
      
      // Take the first N beds from sorted list
      const bedsToRemove = sortedBeds.slice(0, parseInt(bedsToRemoveCount));
      
      // Check if any beds are occupied or in maintenance
      const occupiedBeds = bedsToRemove.filter(bed => bed.isOccupied);
      const maintenanceBeds = bedsToRemove.filter(bed => bed.isUnderMaintenance);
      
      if (occupiedBeds.length > 0) {
        setError(`Cannot remove beds because ${occupiedBeds.length} bed(s) are currently occupied. Please discharge patients first.`);
        setIsRemovingMultipleBeds(false);
        return;
      }
      
      if (maintenanceBeds.length > 0) {
        setError(`Cannot remove beds because ${maintenanceBeds.length} bed(s) are under maintenance. Please return them from maintenance first.`);
        setIsRemovingMultipleBeds(false);
        return;
      }
      
      // Remove beds one by one
      let removedCount = 0;
      for (const bed of bedsToRemove) {
        console.log('Removing bed:', bed.bedNumber);
        try {
          const response = await axios.delete(`${API_URL}/beds/${bed.bedNumber}`, {
            headers: getAuthHeaders()
          });
          console.log('Remove bed response:', response.data);
          removedCount++;
        } catch (err) {
          console.error(`Error removing bed ${bed.bedNumber}:`, err);
        }
      }
      
      // Show success message
      alert(`Successfully removed ${removedCount} beds from the system`);
      
      fetchBeds();
      setBedsToRemoveCount(1);
    } catch (err) {
      console.error('Error removing multiple beds:', err);
      console.error('Error details:', err.response || err);
      
      // Check for specific error responses
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to remove beds. Only bed managers can perform this action.');
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
        setError(`Failed to remove beds: ${errorMsg}`);
      }
    } finally {
      setIsRemovingMultipleBeds(false);
    }
  };
  
  const handleAllocateBed = async (e) => {
    e.preventDefault();
    
    try {
      setIsAllocatingBed(true);
      console.log('Allocating bed with ward type:', wardType);
      
      await axios.post(`${API_URL}/beds/allocate`, { 
        patientName,
        wardType 
      }, {
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
      setError(''); // Clear previous errors
      
      console.log('Setting bed to maintenance with number:', bedToMaintain, 'and role:', role);
      
      // Make sure bedNumber is properly formatted
      if (!bedToMaintain || isNaN(parseInt(bedToMaintain))) {
        setError("Please enter a valid bed number");
        setIsMaintenanceBed(false);
        return;
      }
      
      // Check if bed exists
      const bedExists = beds.some(bed => bed.bedNumber === parseInt(bedToMaintain));
      if (!bedExists) {
        setError(`Bed ${bedToMaintain} does not exist in the system`);
        setIsMaintenanceBed(false);
        return;
      }
      
      // Check if bed is already under maintenance
      const targetBed = beds.find(bed => bed.bedNumber === parseInt(bedToMaintain));
      if (targetBed && targetBed.isUnderMaintenance) {
        setError(`Bed ${bedToMaintain} is already under maintenance`);
        setIsMaintenanceBed(false);
        return;
      }
      
      // Check if bed is occupied
      if (targetBed && targetBed.isOccupied) {
        setError(`Cannot set bed ${bedToMaintain} for maintenance because it is currently occupied. Please discharge the patient first.`);
        setIsMaintenanceBed(false);
        return;
      }
      
      console.log('Sending maintenance request for bed:', bedToMaintain);
      console.log('Auth headers:', getAuthHeaders());
      
      const response = await axios.post(`${API_URL}/beds/maintenance`, { 
        bedNumber: parseInt(bedToMaintain) 
      }, {
        headers: getAuthHeaders()
      });
      
      console.log('Maintenance response:', response.data);
      
      fetchBeds();
      setBedToMaintain('');
    } catch (err) {
      console.error('Error setting bed to maintenance:', err);
      console.error('Error details:', err.response || err);
      
      // Check for specific error responses
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to set beds for maintenance. Only bed managers can perform this action.');
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
        setError(`Failed to set bed for maintenance: ${errorMsg}`);
      }
    } finally {
      setIsMaintenanceBed(false);
    }
  };
  
  const handleReturnBedFromMaintenance = async (e) => {
    e.preventDefault();
    
    try {
      setIsReturningBed(true);
      setError(''); // Clear previous errors
      
      console.log('Returning bed from maintenance with number:', bedToReturn, 'and role:', role);
      
      // Make sure bedNumber is properly formatted
      if (!bedToReturn || isNaN(parseInt(bedToReturn))) {
        setError("Please enter a valid bed number");
        setIsReturningBed(false);
        return;
      }
      
      // Check if bed exists
      const bedExists = beds.some(bed => bed.bedNumber === parseInt(bedToReturn));
      if (!bedExists) {
        setError(`Bed ${bedToReturn} does not exist in the system`);
        setIsReturningBed(false);
        return;
      }
      
      // Check if bed is actually under maintenance
      const targetBed = beds.find(bed => bed.bedNumber === parseInt(bedToReturn));
      if (targetBed && !targetBed.isUnderMaintenance) {
        setError(`Bed ${bedToReturn} is not currently under maintenance`);
        setIsReturningBed(false);
        return;
      }
      
      console.log('Sending return from maintenance request for bed:', bedToReturn);
      console.log('Auth headers:', getAuthHeaders());
      
      const response = await axios.post(`${API_URL}/beds/return-from-maintenance`, { 
        bedNumber: parseInt(bedToReturn) 
      }, {
        headers: getAuthHeaders()
      });
      
      console.log('Return from maintenance response:', response.data);
      
      fetchBeds();
      setBedToReturn('');
    } catch (err) {
      console.error('Error returning bed from maintenance:', err);
      console.error('Error details:', err.response || err);
      
      // Check for specific error responses
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to return beds from maintenance. Only bed managers can perform this action.');
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
        setError(`Failed to return bed from maintenance: ${errorMsg}`);
      }
    } finally {
      setIsReturningBed(false);
    }
  };

  if (loading && beds.length === 0) {
    return <div className="text-center my-8">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Side Navigation */}
      <div 
        className={`${
          isSidebarExpanded ? 'w-64' : 'w-20'
        } bg-white shadow-md transition-all duration-300 ease-in-out relative h-full flex flex-col`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-20 bg-white rounded-full p-1.5 shadow-md hover:shadow-lg transition-shadow border border-gray-200 z-10"
        >
          {isSidebarExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        {/* Logo Section */}
        <div className="p-5 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {isSidebarExpanded && (
              <h1 className="text-xl font-bold text-white">Bed Manager</h1>
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
            color="indigo"
          />
          <NavButton
            icon="add_circle"
            label="Add/Remove Beds"
            isActive={activeSection === 'addBeds'}
            onClick={() => setActiveSection('addBeds')}
            isExpanded={isSidebarExpanded}
            color="blue"
          />
          <NavButton
            icon="people"
            label="Patient Management"
            isActive={activeSection === 'patients'}
            onClick={() => setActiveSection('patients')}
            isExpanded={isSidebarExpanded}
            color="green"
          />
          <NavButton
            icon="build"
            label="Maintenance"
            isActive={activeSection === 'maintenance'}
            onClick={() => setActiveSection('maintenance')}
            isExpanded={isSidebarExpanded}
            color="amber"
          />
          <NavButton
            icon="history"
            label="History"
            isActive={activeSection === 'history'}
            onClick={() => setActiveSection('history')}
            isExpanded={isSidebarExpanded}
            color="purple"
          />
        </nav>
        
        {/* User Info */}
        {isSidebarExpanded && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userInfo.name || 'Bed Manager'}
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
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button 
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                onClick={() => setError('')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                <h2 className="text-xl font-semibold mb-4 text-indigo-800 border-b pb-2">Hospital Bed Statistics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Total Beds */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-md p-4 flex flex-col items-center border-b-4 border-indigo-500 transition-transform hover:scale-105">
                    <div className="text-3xl font-bold text-indigo-800 mb-1">{stats.totalBeds}</div>
                    <div className="text-sm text-indigo-600 font-medium">Total Beds</div>
                    <div className="mt-1 text-xs text-indigo-500">
                      <span className="text-blue-600 font-bold">{stats.generalBeds}</span> General / 
                      <span className="text-purple-700 font-bold"> {stats.icuBeds}</span> ICU
                    </div>
                  </div>
                  
                  {/* Available Beds */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-md p-4 flex flex-col items-center border-b-4 border-emerald-500 transition-transform hover:scale-105">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">{stats.availableBeds}</div>
                    <div className="text-sm text-emerald-700 font-medium">Available</div>
                    <div className="mt-1 text-xs text-emerald-600">
                      <span className="text-blue-600 font-bold">{stats.availableGeneralBeds}</span> General / 
                      <span className="text-purple-700 font-bold"> {stats.availableIcuBeds}</span> ICU
                    </div>
                  </div>
                  
                  {/* Occupied Beds */}
                  <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-lg shadow-md p-4 flex flex-col items-center border-b-4 border-rose-500 transition-transform hover:scale-105">
                    <div className="text-3xl font-bold text-rose-600 mb-1">{stats.occupiedBeds}</div>
                    <div className="text-sm text-rose-700 font-medium">Occupied</div>
                    <div className="mt-1 text-xs text-rose-500 font-medium">
                      {Math.round(stats.occupancyRate)}% Occupancy
                    </div>
                  </div>

                  {/* Maintenance Beds */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg shadow-md p-4 flex flex-col items-center border-b-4 border-amber-500 transition-transform hover:scale-105">
                    <div className="text-3xl font-bold text-amber-600 mb-1">{stats.maintenanceBeds}</div>
                    <div className="text-sm text-amber-700 font-medium">Maintenance</div>
                  </div>
                  
                  {/* Bed Types Summary */}
                  <div className="bg-gradient-to-br from-purple-50 to-fuchsia-100 rounded-lg shadow-md p-4 border-b-4 border-purple-500 transition-transform hover:scale-105">
                    <h3 className="text-sm font-medium text-purple-800 mb-2 text-center">Bed Types</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                          <span className="text-xs text-blue-700 font-medium">General</span>
                        </div>
                        <span className="font-bold text-blue-700">{stats.generalBeds}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                          <span className="text-xs text-purple-700 font-medium">ICU</span>
                        </div>
                        <span className="font-bold text-purple-700">{stats.icuBeds}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Rate Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500 transition-transform hover:scale-105">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Occupancy Rate
                    </h3>
                    <div className="mt-2 relative pt-1">
                      <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-red-100">
                        <div 
                          style={{ width: `${stats.occupancyRate}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-red-500 to-rose-600 rounded-full"
                        ></div>
                      </div>
                      <p className="text-lg font-bold text-red-600">{stats.occupancyRate}%</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 transition-transform hover:scale-105">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Available Rate
                    </h3>
                    <div className="mt-2 relative pt-1">
                      <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-green-100">
                        <div 
                          style={{ width: `${stats.availableRate}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                        ></div>
                      </div>
                      <p className="text-lg font-bold text-green-600">{stats.availableRate}%</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500 transition-transform hover:scale-105">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Maintenance Rate
                    </h3>
                    <div className="mt-2 relative pt-1">
                      <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-yellow-100">
                        <div 
                          style={{ width: `${stats.maintenanceRate}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full"
                        ></div>
                      </div>
                      <p className="text-lg font-bold text-yellow-600">{stats.maintenanceRate}%</p>
                    </div>
                  </div>
                </div>
              </section>
              
              {/* All Beds Grid */}
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                <h2 className="text-xl font-semibold mb-4 text-indigo-800 border-b pb-2 flex justify-between items-center">
                  <span>All Hospital Beds</span>
                  <button 
                    className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 font-medium rounded-md hover:bg-indigo-200 transition-colors duration-200 flex items-center"
                    onClick={() => fetchBeds()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Refresh Beds
                  </button>
                </h2>
                
                {/* Card-based bed list */}
                <div className="p-2 bg-gradient-to-b from-white to-blue-50 rounded-md">
                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {beds.length === 0 ? (
                      <div className="col-span-full text-center py-6 text-gray-500">
                        No beds available. Please add beds to get started.
                      </div>
                    ) : (
                      beds.map((bed) => (
                        <div 
                          key={bed._id} 
                          className={`relative overflow-hidden rounded-lg border shadow-sm transition-transform hover:scale-105 ${
                            bed.isUnderMaintenance 
                              ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200' 
                              : bed.isOccupied 
                                ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200' 
                                : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200'
                          }`}
                        >
                          <div className="absolute top-0 right-0">
                            <div 
                              className={`text-white px-2 py-0.5 m-1 text-xs font-bold rounded-sm ${
                                bed.isUnderMaintenance 
                                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600' 
                                  : bed.isOccupied 
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600'
                              }`}
                            >
                              {bed.isUnderMaintenance 
                                ? 'MAINT' 
                                : bed.isOccupied 
                                  ? 'OCCUP' 
                                  : 'AVAIL'}
                            </div>
                          </div>
                          
                          <div className="absolute top-0 left-0">
                            <div className={`px-1.5 py-0.5 m-1 text-xs font-bold rounded-sm ${
                              bed.wardType === 'icu' 
                                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-700 text-white' 
                                : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'
                            }`}>
                              {bed.wardType === 'icu' ? 'ICU' : 'GEN'}
                            </div>
                          </div>
                          
                          <div className="p-2 pt-6">
                            <div className="text-center mb-1">
                              <span className="text-2xl font-bold">{bed.bedNumber}</span>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-1 mt-1 text-xs">
                              {bed.isOccupied ? (
                                <div>
                                  <div className="font-semibold text-center truncate" title={bed.patientName}>
                                    {bed.patientName}
                                  </div>
                                  <div className="text-gray-500 text-center text-xs">
                                    Since: {bed.allocatedAt ? new Date(bed.allocatedAt).toLocaleDateString() : '-'}
                                  </div>
                                </div>
                              ) : bed.isUnderMaintenance ? (
                                <div className="text-center text-amber-600 font-medium">
                                  Under Maintenance
                                </div>
                              ) : (
                                <div className="text-center text-green-600 font-medium">
                                  Available
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
          
          {/* Add/Remove Beds Section */}
          {activeSection === 'addBeds' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <h2 className="text-xl font-semibold mb-4 text-blue-800 border-b pb-2">Bed Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Add Beds Form */}
                  <div className="bg-gradient-to-br from-white to-indigo-50 rounded-lg shadow-md p-4 border border-indigo-100">
                    <h3 className="text-md font-medium text-indigo-800 mb-3">Add Beds</h3>
                    <form onSubmit={handleAddBeds}>
                      <div className="mb-3">
                        <label htmlFor="bedCount" className="block text-sm font-medium text-indigo-700 mb-1">
                          Number of Beds
                        </label>
                        <input
                          type="number"
                          id="bedCount"
                          min="1"
                          className="w-full rounded-md border-indigo-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          value={addBedCount}
                          onChange={(e) => setAddBedCount(parseInt(e.target.value))}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="bedWardType" className="block text-sm font-medium text-indigo-700 mb-1">
                          Ward Type
                        </label>
                        <select
                          id="bedWardType"
                          className="w-full rounded-md border-indigo-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          value={bedWardType}
                          onChange={(e) => setBedWardType(e.target.value)}
                        >
                          <option value="general">General Ward</option>
                          <option value="icu">ICU</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isAddingBeds}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-2 px-4 rounded-md hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-70 transition-all duration-200 shadow-md"
                      >
                        {isAddingBeds ? 'Adding...' : 'Add Beds'}
                      </button>
                    </form>
                  </div>
                  
                  {/* Remove Beds Form */}
                  <div className="bg-gradient-to-br from-white to-rose-50 rounded-lg shadow-md p-4 border border-rose-100">
                    <h3 className="text-md font-medium text-rose-800 mb-3">Remove Beds</h3>
                    <div className="space-y-4">
                      {/* Remove Single Bed Form */}
                      <form onSubmit={handleRemoveBed}>
                        <div className="mb-3">
                          <label htmlFor="bedToRemove" className="block text-sm font-medium text-rose-700 mb-1">
                            Bed Number to Remove
                          </label>
                          <input
                            type="number"
                            id="bedToRemove"
                            min="1"
                            className="w-full rounded-md border-rose-300 shadow-sm p-2 border focus:border-rose-500 focus:ring focus:ring-rose-200 focus:ring-opacity-50"
                            value={bedToRemove}
                            onChange={(e) => setBedToRemove(e.target.value)}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isRemovingBed}
                          className="w-full bg-gradient-to-r from-rose-600 to-rose-700 text-white py-2 px-4 rounded-md hover:from-rose-700 hover:to-rose-800 disabled:opacity-70 transition-all duration-200 shadow-md"
                        >
                          {isRemovingBed ? 'Removing...' : 'Remove Bed'}
                        </button>
                      </form>
                      
                      {/* Divider */}
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-rose-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-3 bg-gradient-to-r from-rose-50 to-white text-rose-500 font-medium">OR</span>
                        </div>
                      </div>
                      
                      {/* Remove Multiple Beds Form */}
                      <form onSubmit={handleRemoveMultipleBeds}>
                        <div className="mb-3">
                          <label htmlFor="bedsToRemoveCount" className="block text-sm font-medium text-rose-700 mb-1">
                            Number of Highest Numbered Beds to Remove
                          </label>
                          <input
                            type="number"
                            id="bedsToRemoveCount"
                            min="1"
                            className="w-full rounded-md border-rose-300 shadow-sm p-2 border focus:border-rose-500 focus:ring focus:ring-rose-200 focus:ring-opacity-50"
                            value={bedsToRemoveCount}
                            onChange={(e) => setBedsToRemoveCount(parseInt(e.target.value))}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isRemovingMultipleBeds}
                          className="w-full bg-gradient-to-r from-rose-600 to-rose-700 text-white py-2 px-4 rounded-md hover:from-rose-700 hover:to-rose-800 disabled:opacity-70 transition-all duration-200 shadow-md"
                        >
                          {isRemovingMultipleBeds ? 'Removing...' : `Remove ${bedsToRemoveCount} Highest-Numbered Beds`}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
          
          {/* Patient Management Section */}
          {activeSection === 'patients' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <h2 className="text-xl font-semibold mb-4 text-green-800 border-b pb-2">Patient Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Allocate Bed Form */}
                  <div className="bg-gradient-to-br from-white to-emerald-50 rounded-lg shadow-md p-4 border border-emerald-100">
                    <h3 className="text-md font-medium text-emerald-800 mb-3">Allocate Bed</h3>
                    <form onSubmit={handleAllocateBed}>
                      <div className="mb-3">
                        <label htmlFor="patientName" className="block text-sm font-medium text-emerald-700 mb-1">
                          Patient Name
                        </label>
                        <input
                          type="text"
                          id="patientName"
                          className="w-full rounded-md border-emerald-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="wardType" className="block text-sm font-medium text-emerald-700 mb-1">
                          Ward Type
                        </label>
                        <select
                          id="wardType"
                          className="w-full rounded-md border-emerald-300 shadow-sm p-2 border focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                          value={wardType}
                          onChange={(e) => setWardType(e.target.value)}
                        >
                          <option value="general">General Ward</option>
                          <option value="icu">ICU</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isAllocatingBed || stats.availableBeds === 0}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2 px-4 rounded-md hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-70 transition-all duration-200 shadow-md"
                      >
                        {isAllocatingBed ? 'Allocating...' : 'Allocate Bed'}
                      </button>
                    </form>
                  </div>
                  
                  {/* Discharge Form */}
                  <div className="bg-gradient-to-br from-white to-rose-50 rounded-lg shadow-md p-4 border border-rose-100">
                    <h3 className="text-md font-medium text-rose-800 mb-3">Discharge Patient</h3>
                    <form onSubmit={handleDischargeBed}>
                      <div className="mb-3">
                        <label htmlFor="patientToDischarge" className="block text-sm font-medium text-rose-700 mb-1">
                          Select Patient to Discharge
                        </label>
                        <select
                          id="patientToDischarge"
                          className="w-full rounded-md border-rose-300 shadow-sm p-2 border focus:border-rose-500 focus:ring focus:ring-rose-200 focus:ring-opacity-50"
                          value={patientToDischarge}
                          onChange={(e) => setPatientToDischarge(e.target.value)}
                          required
                        >
                          <option value="">-- Select Patient --</option>
                          {beds
                            .filter(bed => bed.isOccupied && !bed.isUnderMaintenance)
                            .map(bed => (
                              <option key={bed._id} value={bed.patientName}>
                                {bed.patientName} (Bed #{bed.bedNumber} - {bed.wardType === 'icu' ? 'ICU' : 'General'})
                              </option>
                            ))
                          }
                        </select>
                        {beds.filter(bed => bed.isOccupied && !bed.isUnderMaintenance).length === 0 && (
                          <p className="mt-1 text-xs text-rose-500">No occupied beds available for discharge</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={isDischargingBed || !patientToDischarge}
                        className="w-full bg-gradient-to-r from-rose-600 to-rose-700 text-white py-2 px-4 rounded-md hover:from-rose-700 hover:to-rose-800 disabled:opacity-70 transition-all duration-200 shadow-md"
                      >
                        {isDischargingBed ? 'Discharging...' : 'Discharge Patient'}
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            </div>
          )}
          
          {/* Maintenance Section */}
          {activeSection === 'maintenance' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
                <h2 className="text-xl font-semibold mb-4 text-amber-800 border-b pb-2">Maintenance Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Set Bed for Maintenance */}
                  <div className="bg-gradient-to-br from-white to-amber-50 rounded-lg shadow-md p-4 border border-amber-100">
                    <h3 className="text-md font-medium text-amber-800 mb-3">Set Bed for Maintenance</h3>
                    <form onSubmit={handleMaintenanceBed}>
                      <div className="mb-3">
                        <label htmlFor="bedToMaintain" className="block text-sm font-medium text-amber-700 mb-1">
                          Select Bed for Maintenance
                        </label>
                        <select
                          id="bedToMaintain"
                          className="w-full rounded-md border-amber-300 shadow-sm p-2 border focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                          value={bedToMaintain}
                          onChange={(e) => setBedToMaintain(e.target.value)}
                          required
                        >
                          <option value="">-- Select Bed --</option>
                          {beds
                            .filter(bed => !bed.isOccupied && !bed.isUnderMaintenance)
                            .sort((a, b) => a.bedNumber - b.bedNumber)
                            .map(bed => (
                              <option key={bed._id} value={bed.bedNumber}>
                                Bed #{bed.bedNumber} ({bed.wardType === 'icu' ? 'ICU' : 'General'})
                              </option>
                            ))
                          }
                        </select>
                        {beds.filter(bed => !bed.isOccupied && !bed.isUnderMaintenance).length === 0 && (
                          <p className="mt-1 text-xs text-amber-500">No beds available for maintenance</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={isMaintenanceBed || !bedToMaintain}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-2 px-4 rounded-md hover:from-amber-700 hover:to-amber-800 disabled:opacity-70 transition-all duration-200 shadow-md"
                      >
                        {isMaintenanceBed ? 'Processing...' : 'Set for Maintenance'}
                      </button>
                    </form>
                  </div>
                  
                  {/* Return Bed from Maintenance */}
                  <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-md p-4 border border-blue-100">
                    <h3 className="text-md font-medium text-blue-800 mb-3">Return Bed from Maintenance</h3>
                    <form onSubmit={handleReturnBedFromMaintenance}>
                      <div className="mb-3">
                        <label htmlFor="bedToReturn" className="block text-sm font-medium text-blue-700 mb-1">
                          Select Bed to Return from Maintenance
                        </label>
                        <select
                          id="bedToReturn"
                          className="w-full rounded-md border-blue-300 shadow-sm p-2 border focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          value={bedToReturn}
                          onChange={(e) => setBedToReturn(e.target.value)}
                          required
                        >
                          <option value="">-- Select Bed --</option>
                          {beds
                            .filter(bed => bed.isUnderMaintenance)
                            .sort((a, b) => a.bedNumber - b.bedNumber)
                            .map(bed => (
                              <option key={bed._id} value={bed.bedNumber}>
                                Bed #{bed.bedNumber} ({bed.wardType === 'icu' ? 'ICU' : 'General'})
                              </option>
                            ))
                          }
                        </select>
                        {beds.filter(bed => bed.isUnderMaintenance).length === 0 && (
                          <p className="mt-1 text-xs text-blue-500">No beds currently under maintenance</p>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={isReturningBed || !bedToReturn}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-md hover:from-blue-700 hover:to-blue-800 disabled:opacity-70 transition-all duration-200 shadow-md"
                      >
                        {isReturningBed ? 'Processing...' : 'Return to Service'}
                      </button>
                    </form>
                  </div>
                </div>
                
                {/* Maintenance Beds List */}
                <div className="mt-4 bg-white shadow-md rounded-lg overflow-hidden border border-amber-100">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-600 p-3 border-b flex justify-between items-center">
                    <h3 className="text-md font-medium text-white">Current Maintenance Beds</h3>
                    <button 
                      className="px-2 py-1 text-xs bg-white text-amber-700 font-medium rounded-md hover:bg-amber-50 transition-colors duration-200 shadow-sm flex items-center"
                      onClick={() => fetchBeds()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Refresh
                    </button>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-b from-white to-amber-50 max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {beds.filter(bed => bed.isUnderMaintenance).length === 0 ? (
                        <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                          No beds currently under maintenance
                        </div>
                      ) : (
                        beds.filter(bed => bed.isUnderMaintenance).map((bed) => (
                          <div 
                            key={bed._id} 
                            className="relative overflow-hidden rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-100 shadow-sm transition-all hover:shadow-md p-2"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold">{bed.bedNumber}</span>
                              <span className="text-xs font-medium px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded">
                                {bed.wardType === 'icu' ? 'ICU' : 'GEN'}
                              </span>
                            </div>
                            
                            <div className="text-xs mt-1 text-gray-600">
                              Since: {bed.maintenanceStartTime ? new Date(bed.maintenanceStartTime).toLocaleString() : '-'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
          
          {/* History Section */}
          {activeSection === 'history' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <h2 className="text-xl font-semibold mb-4 text-purple-800 border-b pb-2">Patient History</h2>
                <div className="bg-white shadow-md rounded-lg overflow-hidden border border-purple-100">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 border-b flex justify-between items-center">
                    <h3 className="text-md font-medium text-white">Recent Allocations</h3>
                    <button 
                      className="px-2 py-1 text-xs bg-white text-indigo-700 font-medium rounded-md hover:bg-indigo-50 transition-colors duration-200 shadow-sm flex items-center"
                      onClick={() => fetchBedHistory()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Refresh
                    </button>
                  </div>
                  
                  {historyError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 m-2 rounded text-xs relative">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {historyError}
                      </div>
                      <button 
                        className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                        onClick={() => setHistoryError('')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {historyLoading ? (
                    <div className="text-center py-4 text-sm">Loading history...</div>
                  ) : (
                    <div className="p-3 bg-gradient-to-b from-white to-purple-50 max-h-80 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {bedHistory.length === 0 ? (
                          <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                            No patient history available
                          </div>
                        ) : (
                          bedHistory.map((record) => (
                            <div 
                              key={record._id} 
                              className={`overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md p-2 ${
                                record.isActive 
                                  ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200' 
                                  : 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex gap-1 items-center">
                                  <span className="text-md font-bold">#{record.bedNumber}</span>
                                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                    record.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {record.isActive ? 'Current' : 'Past'}
                                  </span>
                                </div>
                                <span className="text-xs font-medium px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">
                                  {record.wardType === 'icu' ? 'ICU' : 'GEN'}
                                </span>
                              </div>
                              
                              <div className="text-sm font-semibold mt-1">{record.patientName}</div>
                              
                              <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
                                <div>
                                  <span className="text-gray-500">In:</span> {new Date(record.allocatedAt).toLocaleDateString()}
                                </div>
                                
                                {record.dischargedAt && (
                                  <div>
                                    <span className="text-gray-500">Out:</span> {new Date(record.dischargedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BedDashboard; 

// NavButton Component
const NavButton = ({ icon, label, isActive, onClick, isExpanded, color }) => {
  // Pre-defined classes for each color to avoid string interpolation issues with Tailwind
  const getColorClasses = () => {
    if (isActive) {
      if (color === 'indigo') return 'bg-indigo-100 text-indigo-700';
      if (color === 'blue') return 'bg-blue-100 text-blue-700';
      if (color === 'green') return 'bg-green-100 text-green-700';
      if (color === 'amber') return 'bg-amber-100 text-amber-700';
      if (color === 'purple') return 'bg-purple-100 text-purple-700';
    }
    
    return `text-gray-600 ${
      color === 'indigo' ? 'hover:bg-indigo-50 hover:text-indigo-700' :
      color === 'blue' ? 'hover:bg-blue-50 hover:text-blue-700' :
      color === 'green' ? 'hover:bg-green-50 hover:text-green-700' :
      color === 'amber' ? 'hover:bg-amber-50 hover:text-amber-700' :
      'hover:bg-purple-50 hover:text-purple-700'
    }`;
  };

  // Map icon names to SVG icons
  const renderIcon = () => {
    switch(icon) {
      case 'dashboard':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        );
      case 'add_circle':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        );
      case 'people':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        );
      case 'build':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      case 'history':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'refresh':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center ${isExpanded ? 'px-4' : 'justify-center'} py-3 rounded-lg transition-all duration-200 ${getColorClasses()}`}
      title={!isExpanded ? label : ''}
    >
      <div className="flex-shrink-0">
        {renderIcon()}
      </div>
      {isExpanded && <span className="ml-3 font-medium">{label}</span>}
    </button>
  );
}; 