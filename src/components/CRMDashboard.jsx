// src/components/CRMDashboard.jsx (Updated with authentication)
import React, { useState, useEffect } from 'react';
import { Bell, X, Phone, Mail, Calendar, User, AlertTriangle, Clock, Flame, LogOut, Settings, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Configuration - Use environment variables for different environments
const API_BASE_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwe1tEgKARL6aWD3LdnldHG3JudUFDZihK_2BVxv1LhrviIdFwk5BSZ035dbdDinVEAtg/exec';

const CRMDashboard = () => {
  const { user, signOut } = useAuth();
  const [sheetData, setSheetData] = useState({ headers: [], data: [] });
  const [columnDefs, setColumnDefs] = useState({ editableColumns: {}, updateColumn: null });
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newDataIndicator, setNewDataIndicator] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Filter functionality
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    leadStage: '',
    leadStatus1: '',
    leadStatus2: '',
    leadStatus3: '',
    leadStatus4: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);

  // Fuzzy search function
  const performSearch = (query) => {
    if (!query.trim() || !sheetData.data) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const results = [];

    sheetData.data.forEach((row, rowIndex) => {
      const firstName = (row.values[2] || '').toLowerCase();
      const lastName = (row.values[3] || '').toLowerCase();
      const email = (row.values[4] || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();

      // Check if search term matches name or email
      const nameMatch = fullName.includes(searchTerm) || 
                       firstName.includes(searchTerm) || 
                       lastName.includes(searchTerm);
      const emailMatch = email.includes(searchTerm);

      if (nameMatch || emailMatch) {
        results.push({
          rowIndex,
          row,
          firstName: row.values[2] || '',
          lastName: row.values[3] || '',
          email: row.values[4] || '',
          submissionDate: row.values[0],
          leadStage: row.values[13] || '',
          matchType: nameMatch ? 'name' : 'email'
        });
      }
    });

    // Sort results by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aFullName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const bFullName = `${b.firstName} ${b.lastName}`.toLowerCase();
      
      const aExactName = aFullName === searchTerm;
      const bExactName = bFullName === searchTerm;
      const aExactEmail = a.email === searchTerm;
      const bExactEmail = b.email === searchTerm;
      
      if (aExactName && !bExactName) return -1;
      if (!aExactName && bExactName) return 1;
      if (aExactEmail && !bExactEmail) return -1;
      if (!aExactEmail && bExactEmail) return 1;
      
      return 0;
    });

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
    setShowSearchResults(results.length > 0);
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  // Handle search result click
  const handleSearchResultClick = (result) => {
    setSelectedProfile({ row: result.row, rowIndex: result.rowIndex });
    setShowProfile(true);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Apply filters to data
  const applyFilters = () => {
    if (!sheetData.data) return;

    let filtered = [...sheetData.data];
    const newActiveFilters = [];

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(row => {
        const submissionDate = new Date(row.values[0]);
        if (isNaN(submissionDate)) return false;

        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && endDate) {
          return submissionDate >= startDate && submissionDate <= endDate;
        } else if (startDate) {
          return submissionDate >= startDate;
        } else if (endDate) {
          return submissionDate <= endDate;
        }
        return true;
      });
      newActiveFilters.push('Date Range');
    }

    // Lead Stage filter
    if (filters.leadStage) {
      filtered = filtered.filter(row => {
        const stage = (row.values[13] || '').toString().toLowerCase();
        return stage === filters.leadStage.toLowerCase();
      });
      newActiveFilters.push(`Lead Stage: ${filters.leadStage}`);
    }

    // Lead Status filters
    const statusColumns = [15, 16, 17, 18]; // Columns P, Q, R, S
    const statusFilters = [filters.leadStatus1, filters.leadStatus2, filters.leadStatus3, filters.leadStatus4];
    
    statusFilters.forEach((status, index) => {
      if (status) {
        filtered = filtered.filter(row => {
          const rowStatus = (row.values[statusColumns[index]] || '').toString().toLowerCase();
          return rowStatus === status.toLowerCase();
        });
        newActiveFilters.push(`Status ${index + 1}: ${status}`);
      }
    });

    setFilteredData(filtered);
    setActiveFilters(newActiveFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateRange: { start: '', end: '' },
      leadStage: '',
      leadStatus1: '',
      leadStatus2: '',
      leadStatus3: '',
      leadStatus4: ''
    });
    setFilteredData([]);
    setActiveFilters([]);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle date range changes
  const handleDateRangeChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value
      }
    }));
  };

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
  }, [filters, sheetData.data]);

  // Force scrollbar visibility for Chromebox Chrome
  useEffect(() => {
    const forceScrollbarVisibility = () => {
      const tableContainer = document.querySelector('.sticky-table-container');
      if (tableContainer) {
        // Force horizontal scrollbar to be visible
        tableContainer.style.overflowX = 'scroll';
        tableContainer.style.overflowY = 'auto';
        
        // Add padding to ensure scrollbar space
        tableContainer.style.paddingBottom = '24px';
        
        // Force scrollbar to show by temporarily making content wider
        const table = tableContainer.querySelector('table');
        if (table) {
          const currentWidth = table.scrollWidth;
          table.style.minWidth = `${currentWidth + 50}px`;
          
          // Reset after a short delay
          setTimeout(() => {
            table.style.minWidth = '';
          }, 100);
        }
      }
    };

    // Run on mount and when data changes
    forceScrollbarVisibility();
    
    // Also run when window resizes
    window.addEventListener('resize', forceScrollbarVisibility);
    
    return () => {
      window.removeEventListener('resize', forceScrollbarVisibility);
    };
  }, [sheetData.data]);

  // Add mouse drag scrolling functionality
  useEffect(() => {
    const tableContainer = document.querySelector('.sticky-table-container');
    if (!tableContainer) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    const handleMouseDown = (e) => {
      // Only activate on left mouse button and not on interactive elements
      if (e.button !== 0 || e.target.closest('select, button, input, a, td, th')) return;
      
      // Add a small delay to distinguish between click and drag
      const dragTimeout = setTimeout(() => {
        isDragging = true;
        startX = e.pageX - tableContainer.offsetLeft;
        startY = e.pageY - tableContainer.offsetTop;
        scrollLeft = tableContainer.scrollLeft;
        scrollTop = tableContainer.scrollTop;
        
        // Change cursor to indicate dragging
        tableContainer.style.cursor = 'grabbing';
        tableContainer.style.userSelect = 'none';
        tableContainer.classList.add('dragging');
        
        // Prevent text selection
        e.preventDefault();
      }, 150); // 150ms delay to distinguish from clicks
      
      // Store timeout to clear if mouse up happens quickly
      tableContainer.dragTimeout = dragTimeout;
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      const x = e.pageX - tableContainer.offsetLeft;
      const y = e.pageY - tableContainer.offsetTop;
      const walkX = (x - startX) * 1.5; // Scroll speed multiplier
      const walkY = (y - startY) * 1.5;
      
      tableContainer.scrollLeft = scrollLeft - walkX;
      tableContainer.scrollTop = scrollTop - walkY;
    };

    const handleMouseUp = () => {
      // Clear the drag timeout if it exists
      if (tableContainer.dragTimeout) {
        clearTimeout(tableContainer.dragTimeout);
        tableContainer.dragTimeout = null;
      }
      
      isDragging = false;
      tableContainer.style.cursor = 'grab';
      tableContainer.style.userSelect = 'auto';
      tableContainer.classList.remove('dragging');
    };

    const handleMouseLeave = () => {
      if (isDragging) {
        isDragging = false;
        tableContainer.style.cursor = 'grab';
        tableContainer.style.userSelect = 'auto';
        tableContainer.classList.remove('dragging');
      }
      
      // Clear any pending drag timeout
      if (tableContainer.dragTimeout) {
        clearTimeout(tableContainer.dragTimeout);
        tableContainer.dragTimeout = null;
      }
    };

    // Add event listeners
    tableContainer.addEventListener('mousedown', handleMouseDown);
    tableContainer.addEventListener('mousemove', handleMouseMove);
    tableContainer.addEventListener('mouseup', handleMouseUp);
    tableContainer.addEventListener('mouseleave', handleMouseLeave);
    
    // Set initial cursor style
    tableContainer.style.cursor = 'grab';

    return () => {
      tableContainer.removeEventListener('mousedown', handleMouseDown);
      tableContainer.removeEventListener('mousemove', handleMouseMove);
      tableContainer.removeEventListener('mouseup', handleMouseUp);
      tableContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [sheetData.data]);

  // Add custom scrollbar indicator for Asus Chromebox
  useEffect(() => {
    const tableContainer = document.querySelector('.sticky-table-container');
    if (!tableContainer) return;

    // Create custom scrollbar indicator
    const createScrollbarIndicator = () => {
      // Remove existing indicator if any
      const existingIndicator = document.getElementById('custom-scrollbar-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }

      // Create new indicator
      const indicator = document.createElement('div');
      indicator.id = 'custom-scrollbar-indicator';
      indicator.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 8px;
        background: #3e2f1c;
        border-radius: 4px;
        margin: 0 4px 4px 4px;
        z-index: 1000;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.2s;
      `;

      // Add hover effect
      indicator.addEventListener('mouseenter', () => {
        indicator.style.opacity = '1';
        indicator.style.height = '12px';
      });

      indicator.addEventListener('mouseleave', () => {
        indicator.style.opacity = '0.8';
        indicator.style.height = '8px';
      });

      // Add click functionality to scroll
      indicator.addEventListener('click', (e) => {
        const rect = indicator.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const maxScroll = tableContainer.scrollWidth - tableContainer.clientWidth;
        tableContainer.scrollLeft = maxScroll * percentage;
      });

      // Add to container
      tableContainer.style.position = 'relative';
      tableContainer.appendChild(indicator);
    };

    // Create indicator after a short delay to ensure table is rendered
    setTimeout(createScrollbarIndicator, 500);

    // Update indicator on scroll
    const updateIndicator = () => {
      const indicator = document.getElementById('custom-scrollbar-indicator');
      if (indicator && tableContainer) {
        const maxScroll = tableContainer.scrollWidth - tableContainer.clientWidth;
        const scrollPercentage = maxScroll > 0 ? tableContainer.scrollLeft / maxScroll : 0;
        indicator.style.transform = `translateX(${scrollPercentage * 100}%)`;
      }
    };

    tableContainer.addEventListener('scroll', updateIndicator);

    return () => {
      const indicator = document.getElementById('custom-scrollbar-indicator');
      if (indicator) {
        indicator.remove();
      }
      tableContainer.removeEventListener('scroll', updateIndicator);
    };
  }, [sheetData.data]);

  // Fetch data from Google Sheets API using local proxy
  const fetchData = async (showIndicator = false) => {
    try {
      if (showIndicator) {
        setIsUpdating(true);
      }
      setError(null);
      
      console.log('Fetching data from proxy...');
      console.log('API_BASE_URL:', API_BASE_URL);
      
      // Use direct fetch through local proxy
      const [dataResponse, colResponse, alertResponse] = await Promise.all([
        fetch(`${API_BASE_URL}?type=data`),
        fetch(`${API_BASE_URL}?type=columns`),
        fetch(`${API_BASE_URL}?type=alerts`)
      ]);
      
      console.log('Data response status:', dataResponse.status);
      console.log('Columns response status:', colResponse.status);
      console.log('Alerts response status:', alertResponse.status);
      
      console.log('Data response headers:', Object.fromEntries(dataResponse.headers.entries()));
      console.log('Columns response headers:', Object.fromEntries(colResponse.headers.entries()));
      console.log('Alerts response headers:', Object.fromEntries(alertResponse.headers.entries()));
      
      if (!dataResponse.ok || !colResponse.ok || !alertResponse.ok) {
        throw new Error(`HTTP error! Data: ${dataResponse.status}, Columns: ${colResponse.status}, Alerts: ${alertResponse.status}`);
      }
      
      // Get response text first to debug
      const [dataText, colText, alertText] = await Promise.all([
        dataResponse.text(),
        colResponse.text(),
        alertResponse.text()
      ]);
      
      console.log('Data response text (first 200 chars):', dataText.substring(0, 200));
      console.log('Columns response text (first 200 chars):', colText.substring(0, 200));
      console.log('Alerts response text (first 200 chars):', alertText.substring(0, 200));
      
      // Parse JSON
      const [dataJson, colJson, alertJson] = await Promise.all([
        JSON.parse(dataText),
        JSON.parse(colText),
        JSON.parse(alertText)
      ]);
      
      console.log('Data loaded successfully:', { dataJson, colJson, alertJson });
      
      // Check if we have new data
      const hasNewData = showIndicator && (
        JSON.stringify(dataJson) !== JSON.stringify(sheetData) ||
        JSON.stringify(alertJson) !== JSON.stringify(alerts)
      );
      
      setSheetData(dataJson);
      setColumnDefs(colJson);
      setAlerts(alertJson);
      setAlertCount(alertJson.length);
      setLastUpdateTime(new Date());
      
      // Show new data indicator if there's new data
      if (hasNewData) {
        setNewDataIndicator(true);
        setTimeout(() => setNewDataIndicator(false), 3000); // Hide after 3 seconds
      }
      
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Fetch error:', err);
      console.error('Error stack:', err.stack);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  // Update a cell in the sheet using GET request with URL parameters
  const updateCell = async (rowIndex, columnIndex, value) => {
    try {
      console.log('Sending update request to:', API_BASE_URL);
      
      // Create URL parameters for the update
      const params = new URLSearchParams({
        type: 'update',
        action: 'updateRow',
        rowIndex: rowIndex.toString(),
        columnIndex: columnIndex.toString(),
        value: value
      });
      
      const url = `${API_BASE_URL}?${params.toString()}`;
      console.log('Update URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON:', responseText);
        throw new Error('Invalid JSON response from server');
      }
      
      if (result.success) {
        // Update local state
        const newData = [...sheetData.data];
        newData[rowIndex].values[columnIndex] = value;
        setSheetData(prev => ({ ...prev, data: newData }));
        console.log('Cell updated successfully in local state');
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert(`Update failed: ${err.message}`);
    }
  };

  // Trigger lead update (column O button) using GET request
  const triggerLeadUpdate = async (rowIndex) => {
    try {
      const params = new URLSearchParams({
        type: 'update',
        action: 'triggerLeadUpdate',
        rowIndex: rowIndex.toString()
      });
      
      const url = `${API_BASE_URL}?${params.toString()}`;
      const response = await fetch(url);
      
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        fetchData(); // Refresh data
      } else {
        throw new Error(result.error || 'Lead update failed');
      }
    } catch (err) {
      alert(`Lead update failed: ${err.message}`);
    }
  };

  // Dismiss an alert using GET request
  const dismissAlert = async (alertId) => {
    try {
      const params = new URLSearchParams({
        type: 'update',
        action: 'dismissAlert',
        alertId: alertId
      });
      
      const url = `${API_BASE_URL}?${params.toString()}`;
      const response = await fetch(url);
      
      const result = await response.json();
      if (result.success) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        setAlertCount(prev => prev - 1);
      } else {
        throw new Error(result.error || 'Dismiss failed');
      }
    } catch (err) {
      alert(`Failed to dismiss alert: ${err.message}`);
    }
  };

  // Open call form with pre-filled data
  const openCallForm = async (rowIndex) => {
    try {
      const params = new URLSearchParams({
        type: 'update',
        action: 'openCallForm',
        rowIndex: rowIndex.toString()
      });
      
      const url = `${API_BASE_URL}?${params.toString()}`;
      const response = await fetch(url);
      
      const result = await response.json();
      if (result.success) {
        // Open the form URL in a new tab
        window.open(result.url, '_blank');
      } else {
        throw new Error(result.error || 'Failed to generate call form URL');
      }
    } catch (err) {
      alert(`Failed to open call form: ${err.message}`);
    }
  };

  // Handle row click to show profile
  const handleRowClick = (row, rowIndex) => {
    setSelectedProfile({ row, rowIndex, headers: sheetData.headers });
    setShowProfile(true);
  };

  // Close profile view
  const closeProfile = () => {
    setShowProfile(false);
    setSelectedProfile(null);
  };

  // Handle alert click to show full report
  const handleAlertClick = (alert) => {
    if (alert.type === 'daily_call_list' || alert.type === 'stale_no_call_report' || alert.type === 'stale_no_tour_report') {
      setSelectedAlert(alert);
      setShowAlertModal(true);
    }
  };

  // Close alert modal
  const closeAlertModal = () => {
    setShowAlertModal(false);
    setSelectedAlert(null);
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get alert icon based on type
  const getAlertIcon = (type) => {
    switch (type) {
      case 'hot_lead': return <Flame className="w-4 h-4 text-red-500" />;
      case 'follow_up': return <Phone className="w-4 h-4 text-blue-500" />;
      case 'stale_no_call':
      case 'stale_no_tour': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'daily_call_list': return <Phone className="w-4 h-4 text-green-600" />;
      case 'stale_no_call_report': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'stale_no_tour_report': return <Calendar className="w-4 h-4 text-purple-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'normal': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
    
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(() => fetchData(true), 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowAlerts(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e3] flex items-center justify-center">
        <div className="text-[#3e2f1c] text-xl">Loading CRM Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f1e3] flex items-center justify-center">
        <div className="text-red-600 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1e3] text-[#3e2f1c]" style={{ fontFamily: 'Avenir, sans-serif' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[#3e2f1c]/20 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Cochin, serif' }}>
              Milea Estate Vineyard - CRM Dashboard
            </h1>
            <p className="text-sm text-[#3e2f1c]/70 mt-1">
              Welcome back, {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-xs text-[#3e2f1c]/60">
                {isUpdating ? 'Updating...' : 'Live'}
              </span>
              {lastUpdateTime && (
                <span className="text-xs text-[#3e2f1c]/40">
                  • Last update: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative search-container flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] text-sm"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleSearchResultClick(result)}
                    className="p-3 hover:bg-[#f5f1e3] cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-[#3e2f1c]">
                          {result.firstName} {result.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{result.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Submitted: {formatDate(result.submissionDate)} • Stage: {result.leadStage || 'N/A'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2">
                        {result.matchType === 'name' ? '👤' : '📧'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Alert Bell */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative p-2 rounded-full hover:bg-[#f5f1e3] transition-colors"
              >
                <Bell className="w-6 h-6" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {alertCount}
                  </span>
                )}
              </button>

              {/* Alert Dropdown */}
              {showAlerts && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-[#3e2f1c]/20 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-[#3e2f1c]/20">
                    <h3 className="font-semibold" style={{ fontFamily: 'Cochin, serif' }}>
                      Active Alerts ({alertCount})
                    </h3>
                  </div>
                  
                  {alerts.length === 0 ? (
                    <div className="p-4 text-gray-500 text-center">
                      No active alerts
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {alerts.map((alert) => (
                        <div key={alert.id} className={`p-3 border-l-4 ${getPriorityColor(alert.priority)} border-b border-gray-100 last:border-b-0`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getAlertIcon(alert.type)}
                                <span className="font-medium text-sm">{alert.title}</span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(alert.timestamp).toLocaleString()}
                              </p>
                              {/* Show full content for daily reports */}
                              {(alert.type === 'daily_call_list' || alert.type === 'stale_no_call_report' || alert.type === 'stale_no_tour_report') && alert.fullContent && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => handleAlertClick(alert)}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
                                  >
                                    View Full Report
                                  </button>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => dismissAlert(alert.id)}
                              className="ml-2 p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-[#f5f1e3] transition-colors"
              >
                <div className="w-8 h-8 bg-[#3e2f1c] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#3e2f1c]/20 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-[#3e2f1c]/20">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-[#3e2f1c]/70">CRM User</p>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f5f1e3] rounded-md transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* New Data Notification */}
      {newDataIndicator && (
        <div className="bg-green-100 border-l-4 border-green-500 p-4 mx-6 mt-4 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-800 font-medium">New data available!</span>
              <span className="text-green-600 text-sm">Your CRM has been updated with the latest information.</span>
            </div>
            <button
              onClick={() => setNewDataIndicator(false)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-[#3e2f1c]/20 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#3e2f1c]" style={{ fontFamily: 'Cochin, serif' }}>
              Filters
            </h3>
            <div className="flex items-center gap-2">
              {activeFilters.length > 0 && (
                <span className="text-sm text-gray-600">
                  {activeFilters.length} active filter{activeFilters.length !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 bg-[#3e2f1c] text-white rounded-lg hover:bg-[#3e2f1c]/80 transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              {activeFilters.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="mb-4 p-3 bg-[#f5f1e3] rounded-lg">
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-[#3e2f1c] text-white text-xs rounded-full"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Filter Controls */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3e2f1c]">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] text-sm"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] text-sm"
                    placeholder="End Date"
                  />
                </div>
              </div>

              {/* Lead Stage */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3e2f1c]">Lead Stage</label>
                <select
                  value={filters.leadStage}
                  onChange={(e) => handleFilterChange('leadStage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] text-sm"
                >
                  <option value="">All Stages</option>
                  <option value="Hot">Hot</option>
                  <option value="Hot - manual reply">Hot - manual reply</option>
                  <option value="Warm - no call">Warm - no call</option>
                  <option value="Warm - no tour">Warm - no tour</option>
                  <option value="Cold">Cold</option>
                  <option value="Closed-Won">Closed-Won</option>
                  <option value="Closed-Lost">Closed-Lost</option>
                </select>
              </div>

              {/* Lead Status 1 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3e2f1c]">Lead Status 1</label>
                <select
                  value={filters.leadStatus1}
                  onChange={(e) => handleFilterChange('leadStatus1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Contacted & Communicated">Contacted & Communicated</option>
                  <option value="Tour Scheduled">Tour Scheduled</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Closed-Won">Closed-Won</option>
                  <option value="Closed-Lost">Closed-Lost</option>
                </select>
              </div>

              {/* Lead Status 2 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3e2f1c]">Lead Status 2</label>
                <select
                  value={filters.leadStatus2}
                  onChange={(e) => handleFilterChange('leadStatus2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Contacted & Communicated">Contacted & Communicated</option>
                  <option value="Tour Scheduled">Tour Scheduled</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Closed-Won">Closed-Won</option>
                  <option value="Closed-Lost">Closed-Lost</option>
                </select>
              </div>

              {/* Lead Status 3 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3e2f1c]">Lead Status 3</label>
                <select
                  value={filters.leadStatus3}
                  onChange={(e) => handleFilterChange('leadStatus3', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Contacted & Communicated">Contacted & Communicated</option>
                  <option value="Tour Scheduled">Tour Scheduled</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Closed-Won">Closed-Won</option>
                  <option value="Closed-Lost">Closed-Lost</option>
                </select>
              </div>

              {/* Lead Status 4 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3e2f1c]">Lead Status 4</label>
                <select
                  value={filters.leadStatus4}
                  onChange={(e) => handleFilterChange('leadStatus4', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Contacted & Communicated">Contacted & Communicated</option>
                  <option value="Tour Scheduled">Tour Scheduled</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Closed-Won">Closed-Won</option>
                  <option value="Closed-Lost">Closed-Lost</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[#3e2f1c]/20 overflow-hidden">
          <div className="sticky-table-container">
            <table className="w-full">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#3e2f1c] text-white">
                  {(sheetData.headers || []).slice(0, 26).map((header, index) => (
                    <th 
                      key={index} 
                      className="p-3 text-left text-sm font-medium border-r border-white/20 last:border-r-0"
                    >
                      {header || `Column ${String.fromCharCode(65 + index)}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(filteredData.length > 0 ? filteredData : (sheetData.data || [])).map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className="border-b border-gray-200 hover:bg-[#f5f1e3]/50 cursor-pointer"
                    onClick={() => handleRowClick(row, rowIndex)}
                  >
                    {(row.values || []).slice(0, 26).map((cell, colIndex) => (
                      <td 
                        key={colIndex} 
                        className="p-3 border-r border-gray-200 last:border-r-0"
                      >
                        {colIndex === columnDefs.updateColumn ? (
                          // Update Lead Button (Column O)
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerLeadUpdate(rowIndex);
                            }}
                            className="bg-[#3e2f1c] text-white px-3 py-1 rounded text-sm hover:bg-[#3e2f1c]/80 transition-colors"
                          >
                            📞 Update Lead
                          </button>
                        ) : colIndex === 25 ? (
                          // Start Call Form Button (Column Z)
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCallForm(rowIndex);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            📞 Start Call Form
                          </button>
                        ) : columnDefs.editableColumns[colIndex] ? (
                          // Editable Dropdown Columns (N, P, Q, R, S)
                          <select
                            value={cell || ''}
                            data-value={cell || ''}
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full p-2 border border-gray-300 rounded text-sm bg-white min-w-[180px] focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c]"
                          >
                            {columnDefs.editableColumns[colIndex].options.map((option, optIndex) => (
                              <option key={optIndex} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          // Regular Display Cells
                          <div className="text-sm">
                            {colIndex === 0 || colIndex === 7 ? formatDate(cell) : (cell || '')}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center items-center gap-4">
          <button
            onClick={() => fetchData(true)}
            disabled={isUpdating}
            className={`px-6 py-2 rounded transition-colors flex items-center gap-2 ${
              isUpdating 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-[#3e2f1c] text-white hover:bg-[#3e2f1c]/80'
            }`}
            style={{ fontFamily: 'Cochin, serif' }}
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              'Refresh Data'
            )}
          </button>
          {lastUpdateTime && (
            <span className="text-sm text-[#3e2f1c]/60">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </main>

      {/* Instructions */}
      <div className="p-6 bg-white/50 border-t border-[#3e2f1c]/20 mt-6">
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Cochin, serif' }}>
          How to Use:
        </h3>
        <ul className="text-sm space-y-1 text-[#3e2f1c]/80">
          <li>• Use the search bar to quickly find leads by name or email (fuzzy matching)</li>
          <li>• Click on search results to open the lead's full profile</li>
          <li>• Use filters to view leads by date range, lead stage, or status</li>
          <li>• Combine multiple filters to narrow down your results</li>
          <li>• Use the dropdowns in columns N, P, Q, R, S to update lead status</li>
          <li>• Click "📞 Update Lead" in column O to trigger lead updates</li>
          <li>• Check the bell icon for active alerts from your CRM system</li>
          <li>• Data syncs automatically with your Google Sheet</li>
          <li>• Alerts refresh every 5 minutes automatically</li>
          <li>• Click your profile icon to access account settings</li>
        </ul>
      </div>

      {/* Profile Modal */}
      {showProfile && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto profile-modal">
            {/* Header */}
            <div className="sticky top-0 bg-[#3e2f1c] text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Cochin, serif' }}>
                    Lead Profile
                  </h2>
                  <p className="text-sm opacity-80 mt-1">
                    {selectedProfile.row.values[2]} {selectedProfile.row.values[3]} • {selectedProfile.row.values[4]}
                  </p>
                </div>
                <button
                  onClick={closeProfile}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#3e2f1c] border-b border-gray-200 pb-2">
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">First Name</label>
                      <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[2] || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Name</label>
                      <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[3] || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[4] || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[5] || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Submission Date</label>
                      <p className="text-[#3e2f1c] font-medium">{formatDate(selectedProfile.row.values[0]) || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Submission Time</label>
                      <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[1] || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#3e2f1c] border-b border-gray-200 pb-2">
                    Event Details
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Event Type</label>
                      <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[6] || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Desired Date</label>
                      <p className="text-[#3e2f1c] font-medium">{formatDate(selectedProfile.row.values[7]) || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Guest Count</label>
                      <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[8] || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ceremony Type</label>
                      <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[10] || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Wedding Style</label>
                      <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[11] || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Associated Events</label>
                      <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[12] || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Lead Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#3e2f1c] border-b border-gray-200 pb-2">
                    Lead Status
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lead Stage</label>
                      <div className="mt-1">
                                                 <select
                           value={selectedProfile.row.values[13] || ''}
                           data-value={selectedProfile.row.values[13] || ''}
                           onChange={(e) => {
                             updateCell(selectedProfile.rowIndex, 13, e.target.value);
                             // Update the local state immediately
                             const newData = [...sheetData.data];
                             newData[selectedProfile.rowIndex].values[13] = e.target.value;
                             setSheetData(prev => ({ ...prev, data: newData }));
                           }}
                           className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] sticky-table-container"
                         >
                          {columnDefs.editableColumns[13]?.options.map((option, optIndex) => (
                            <option key={optIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lead Status 1</label>
                      <div className="mt-1">
                                                 <select
                           value={selectedProfile.row.values[15] || ''}
                           data-value={selectedProfile.row.values[15] || ''}
                           onChange={(e) => {
                             updateCell(selectedProfile.rowIndex, 15, e.target.value);
                             const newData = [...sheetData.data];
                             newData[selectedProfile.rowIndex].values[15] = e.target.value;
                             setSheetData(prev => ({ ...prev, data: newData }));
                           }}
                           className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] sticky-table-container"
                         >
                          {columnDefs.editableColumns[15]?.options.map((option, optIndex) => (
                            <option key={optIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lead Status 2</label>
                      <div className="mt-1">
                                                 <select
                           value={selectedProfile.row.values[16] || ''}
                           data-value={selectedProfile.row.values[16] || ''}
                           onChange={(e) => {
                             updateCell(selectedProfile.rowIndex, 16, e.target.value);
                             const newData = [...sheetData.data];
                             newData[selectedProfile.rowIndex].values[16] = e.target.value;
                             setSheetData(prev => ({ ...prev, data: newData }));
                           }}
                           className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] sticky-table-container"
                         >
                          {columnDefs.editableColumns[16]?.options.map((option, optIndex) => (
                            <option key={optIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lead Status 3</label>
                      <div className="mt-1">
                                                 <select
                           value={selectedProfile.row.values[17] || ''}
                           data-value={selectedProfile.row.values[17] || ''}
                           onChange={(e) => {
                             updateCell(selectedProfile.rowIndex, 17, e.target.value);
                             const newData = [...sheetData.data];
                             newData[selectedProfile.rowIndex].values[17] = e.target.value;
                             setSheetData(prev => ({ ...prev, data: newData }));
                           }}
                           className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] sticky-table-container"
                         >
                          {columnDefs.editableColumns[17]?.options.map((option, optIndex) => (
                            <option key={optIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lead Status 4</label>
                      <div className="mt-1">
                                                 <select
                           value={selectedProfile.row.values[18] || ''}
                           data-value={selectedProfile.row.values[18] || ''}
                           onChange={(e) => {
                             updateCell(selectedProfile.rowIndex, 18, e.target.value);
                             const newData = [...sheetData.data];
                             newData[selectedProfile.rowIndex].values[18] = e.target.value;
                             setSheetData(prev => ({ ...prev, data: newData }));
                           }}
                           className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] sticky-table-container"
                         >
                          {columnDefs.editableColumns[18]?.options.map((option, optIndex) => (
                            <option key={optIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#3e2f1c] border-b border-gray-200 pb-2">
                    Additional Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Message</label>
                      <p className="text-[#3e2f1c] mt-1 bg-gray-50 p-3 rounded border">
                        {selectedProfile.row.values[9] || 'No message provided'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <textarea
                        value={selectedProfile.notes !== undefined ? selectedProfile.notes : (selectedProfile.row.values[19] || '')}
                        onChange={(e) => {
                          // Update local state only, don't save to Google Sheet yet
                          setSelectedProfile(prev => ({
                            ...prev,
                            notes: e.target.value
                          }));
                        }}
                        placeholder="Add notes about this lead..."
                        className="w-full mt-1 p-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] bg-white resize-none"
                        rows={4}
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            // Reset to original value
                            setSelectedProfile(prev => ({
                              ...prev,
                              notes: undefined
                            }));
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const notesToSave = selectedProfile.notes !== undefined ? selectedProfile.notes : (selectedProfile.row.values[19] || '');
                            updateCell(selectedProfile.rowIndex, 19, notesToSave);
                            // Update the local state to reflect the saved value
                            const newData = [...sheetData.data];
                            newData[selectedProfile.rowIndex].values[19] = notesToSave;
                            setSheetData(prev => ({ ...prev, data: newData }));
                            // Clear the local notes state
                            setSelectedProfile(prev => ({
                              ...prev,
                              notes: undefined
                            }));
                          }}
                          className="bg-[#3e2f1c] text-white px-4 py-2 rounded text-sm hover:bg-[#3e2f1c]/80 transition-colors"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Inquiry Source</label>
                        <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[21] || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Partner's Name</label>
                        <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[22] || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Planning Stage</label>
                        <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[23] || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Preferred Contact</label>
                        <p className="text-[#3e2f1c] font-medium">{selectedProfile.row.values[24] || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                             {/* Action Buttons */}
               <div className="mt-8 flex gap-4 justify-center">
                 <button
                   onClick={() => triggerLeadUpdate(selectedProfile.rowIndex)}
                   className="bg-[#3e2f1c] text-white px-6 py-2 rounded hover:bg-[#3e2f1c]/80 transition-colors"
                 >
                   📞 Update Lead
                 </button>
                 <button
                   onClick={() => openCallForm(selectedProfile.rowIndex)}
                   className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                 >
                   📞 Start Call Form
                 </button>
                <button
                  onClick={closeProfile}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Report Modal */}
      {showAlertModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#3e2f1c] text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Cochin, serif' }}>
                    {selectedAlert.title}
                  </h2>
                  <p className="text-sm opacity-80 mt-1">
                    Generated on {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={closeAlertModal}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#3e2f1c] mb-3">Summary</h3>
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="text-sm whitespace-pre-wrap">{selectedAlert.message}</p>
                </div>
              </div>

              {/* Full Report */}
              {selectedAlert.fullContent && (
                <div>
                  <h3 className="text-lg font-semibold text-[#3e2f1c] mb-3">Full Report</h3>
                  <div className="bg-gray-50 p-6 rounded border">
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                      {selectedAlert.fullContent}
                    </pre>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4 justify-center">
                <button
                  onClick={() => {
                    dismissAlert(selectedAlert.id);
                    closeAlertModal();
                  }}
                  className="bg-[#3e2f1c] text-white px-6 py-2 rounded hover:bg-[#3e2f1c]/80 transition-colors"
                >
                  Dismiss Report
                </button>
                <button
                  onClick={closeAlertModal}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMDashboard;