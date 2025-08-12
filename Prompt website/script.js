// Global Variables
let map;
let userLocation = [26.8417, 75.5660]; // MUJ Campus coordinates
let userMarker;
let directionsPanel;
let currentRoute;
let searchHistory = JSON.parse(localStorage.getItem('sparrowSearchHistory')) || [];
let isTracking = false;
let campusGeoJSON;
let customMarkers = JSON.parse(localStorage.getItem('customMarkers')) || [];
let selectedMarkers = [];
let isAddingMarker = false;
let campusMarkers = []; // Store main campus markers separately
let locationComments = JSON.parse(localStorage.getItem('locationComments')) || {}; // Comments for locations
let currentSelectedLocation = null; // Currently selected main campus location

// MUJ Campus location data
const campusLocations = [
    {
        id: 1,
        name: "Academic Block 1 (AB1)",
        category: "academic",
        coordinates: [26.8420, 75.5647],
        description: "5-level academic building housing classrooms, computer labs, and faculty offices.",
        image: null
    },
    {
        id: 2,
        name: "Academic Block 2 (AB2)",
        category: "academic",
        coordinates: [26.8430, 75.5666],
        description: "Multi-level academic building with specialized laboratories and lecture halls.",
        image: null
    },
    {
        id: 3,
        name: "Lecture Hall Complex (LHC)",
        category: "academic",
        coordinates: [26.8441, 75.5648],
        description: "3-level lecture hall complex for large gatherings and academic presentations.",
        image: null
    },
    {
        id: 4,
        name: "Library",
        category: "academic",
        coordinates: [26.8425, 75.5655],
        description: "Central library with extensive collection of books, journals, and digital resources.",
        image: null
    },
    {
        id: 5,
        name: "Student Center",
        category: "facilities",
        coordinates: [26.8415, 75.5650],
        description: "Hub for student activities, cafeteria, and recreational facilities.",
        image: null
    },
    {
        id: 6,
        name: "Main Cafeteria",
        category: "cafeterias",
        coordinates: [26.8418, 75.5652],
        description: "Central dining facility serving various cuisines throughout the day.",
        image: null
    },
    {
        id: 7,
        name: "Computer Labs",
        category: "labs",
        coordinates: [26.8422, 75.5648],
        description: "State-of-the-art computer laboratories with latest hardware and software.",
        image: null
    },
    {
        id: 8,
        name: "Hostels",
        category: "hostels",
        coordinates: [26.8435, 75.5645],
        description: "Modern student accommodation with all necessary amenities.",
        image: null
    },
    {
        id: 9,
        name: "Main Parking",
        category: "parking",
        coordinates: [26.8410, 75.5658],
        description: "Primary parking area for students, faculty, and visitors with 24/7 security.",
        image: null
    },
    {
        id: 10,
        name: "Sports Complex",
        category: "facilities",
        coordinates: [26.8400, 75.5665],
        description: "Sports and recreational facilities including gymnasium and outdoor courts.",
        image: null
    }
];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadSettings();
});

// Initialize Application
function initializeApp() {
    // Check for geolocation support
    if ('geolocation' in navigator) {
        getUserLocation();
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('sparrowTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('theme-toggle').checked = false;
    } else {
        document.getElementById('theme-toggle').checked = true;
    }
    
    // Initialize search history
    updateRecentSearches();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    setupNavigation();
    
    // Page-specific event listeners
    setupSplashPage();
    setupMapPage();
    setupLocationPage();
    setupSearchPage();
    setupSettingsPage();
    
    // Global search functionality
    setupGlobalSearch();
}

// Navigation Setup
function setupNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const actionButtons = document.querySelectorAll('[data-page]');
    
    // Mobile menu toggle
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
    
    // Navigation links
    [...navLinks, ...actionButtons].forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            if (targetPage) {
                navigateToPage(targetPage);
                // Close mobile menu if open
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
}

// Page Navigation
function navigateToPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
        
        // Page-specific initialization
        if (pageId === 'map') {
            setTimeout(() => initializeMap(), 100);
        }
    }
}

// Splash Page Setup
function setupSplashPage() {
    // Animated particles
    createFloatingParticles();
}

// Create floating particles animation
function createFloatingParticles() {
    const particlesContainer = document.querySelector('.floating-particles');
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: var(--accent-cyan);
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.5 + 0.2};
            animation: float ${Math.random() * 10 + 5}s linear infinite;
        `;
        particlesContainer.appendChild(particle);
    }
}

// Map Page Setup
function setupMapPage() {
    // Search input
    const mapSearch = document.getElementById('map-search');
    mapSearch.addEventListener('input', handleMapSearch);
    
    // Category filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterMapLocations(this.getAttribute('data-category'));
        });
    });
    
    // Map controls
    document.getElementById('recenter-btn').addEventListener('click', recenterMap);
    document.getElementById('close-directions').addEventListener('click', hideDirectionsPanel);
    
    // Add marker button event listener (will be added to HTML)
    // This will be handled by the layers button for now
    document.getElementById('layers-btn').addEventListener('click', toggleAddMarkerMode);
    
    // Voice search (placeholder)
    document.querySelector('.voice-search-btn').addEventListener('click', function() {
        alert('Voice search feature coming soon!');
    });
}

// Initialize Map
function initializeMap() {
    if (map) {
        map.remove();
    }
    
    // Set zoom constraints: minimum zoom to show 750m radius area
    const campusCenter = [26.8417, 75.5660];
    const minZoom = 14; // Even lower minimum zoom for wider overview
    const maxZoom = 17; // Further reduced maximum zoom strength
    
    map = L.map('map', {
        center: userLocation,
        zoom: 15,
        minZoom: minZoom,
        maxZoom: maxZoom,
        maxBounds: getMaxBounds(), // Set initial bounds
        maxBoundsViscosity: 1.0, // Prevent dragging outside bounds
        zoomSnap: 0.25, // Smoother zoom increments
        zoomDelta: 0.5, // Smaller zoom steps
        wheelPxPerZoomLevel: 120, // Smoother wheel zoom
        zoomAnimation: true,
        zoomAnimationThreshold: 4
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    // Load and add MUJ campus GeoJSON data
    loadCampusGeoJSON();
    
    // Add user location marker
    userMarker = L.marker(userLocation, {
        icon: L.divIcon({
            className: 'user-marker',
            html: '<i class="fas fa-dot-circle" style="color: #00f5ff; font-size: 20px; filter: drop-shadow(0 0 10px rgba(0, 245, 255, 0.5));"></i>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(map);
    
    // Load custom markers
    loadCustomMarkers();
    
    // Add main campus markers
    addMainCampusMarkers();
    
    // Add map click event for adding markers
    map.on('click', function(e) {
        if (isAddingMarker) {
            showAddMarkerDialog(e.latlng);
        }
    });
    
    // Custom map controls styling
    setTimeout(() => {
        const zoomControls = document.querySelectorAll('.leaflet-control-zoom a');
        zoomControls.forEach(control => {
            control.style.color = 'var(--text-primary)';
            control.style.backgroundColor = 'transparent';
        });
    }, 100);
}

// Load custom markers from localStorage
function loadCustomMarkers() {
    customMarkers.forEach(markerData => {
        addCustomMarkerToMap(markerData);
    });
}

// Add custom marker to map
function addCustomMarkerToMap(markerData) {
    const marker = L.marker(markerData.coordinates, {
        icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: ${markerData.color}; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;"><i class="${markerData.icon}" style="color: white; font-size: 12px;"></i></div>`,
            iconSize: [25, 25],
            iconAnchor: [12, 12]
        })
    }).addTo(map);
    
    // Bind popup with marker details
    marker.bindPopup(`
        <div style="color: var(--text-primary); font-family: 'Inter', sans-serif;">
            <h4 style="margin: 0 0 0.5rem 0; color: var(--accent-cyan);">${markerData.name}</h4>
            <p style="margin: 0.25rem 0;">${markerData.description}</p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.8rem; color: var(--text-muted);">Category: ${markerData.category}</p>
            <div style="margin-top: 0.5rem;">
                <button onclick="selectMarker('${markerData.id}')" style="background: var(--accent-cyan); color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 0.3rem; margin-right: 0.5rem; cursor: pointer;">Select</button>
                <button onclick="deleteCustomMarker('${markerData.id}')" style="background: #ff4757; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 0.3rem; cursor: pointer;">Delete</button>
            </div>
        </div>
    `);
    
    // Store marker data
    marker.customData = markerData;
    
    return marker;
}

// Load MUJ Campus GeoJSON data
function loadCampusGeoJSON() {
    fetch('../campus.geojson')
        .then(response => response.json())
        .then(data => {
            campusGeoJSON = L.geoJSON(data, {
                style: function(feature) {
                    return {
                        color: '#a8b2b8',
                        weight: 2,
                        opacity: 0.7,
                        fillColor: '#8b9dc3',
                        fillOpacity: 0.15
                    };
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties.name) {
                        layer.bindPopup(`
                            <div style="color: var(--text-primary); font-family: 'Inter', sans-serif;">
                                <h4 style="margin: 0 0 0.5rem 0; color: var(--metallic-silver);">${feature.properties.name}</h4>
                                ${feature.properties['building:levels'] ? `<p style="margin: 0.25rem 0;"><strong>Levels:</strong> ${feature.properties['building:levels']}</p>` : ''}
                                ${feature.properties.landuse ? `<p style="margin: 0.25rem 0;"><strong>Type:</strong> ${feature.properties.landuse}</p>` : ''}
                                ${feature.properties.building ? `<p style="margin: 0.25rem 0;"><strong>Building:</strong> ${feature.properties.building}</p>` : ''}
                            </div>
                        `);
                    }
                }
            }).addTo(map);
            
            // Set 750m radius bounds around MUJ campus center
            const bounds750m = getMaxBounds();
            
            map.fitBounds(bounds750m);
            map.setMaxBounds(bounds750m);
        })
        .catch(error => {
            console.error('Error loading campus GeoJSON:', error);
            showNotification('Error loading campus map data', 'error');
        });
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        academic: 'fas fa-graduation-cap',
        labs: 'fas fa-flask',
        cafeterias: 'fas fa-utensils',
        hostels: 'fas fa-bed',
        facilities: 'fas fa-building',
        parking: 'fas fa-parking'
    };
    return icons[category] || 'fas fa-map-marker-alt';
}

// Filter map locations
function filterMapLocations(category) {
    map.eachLayer(layer => {
        if (layer.locationData) {
            if (category === 'all' || layer.locationData.category === category) {
                layer.setOpacity(1);
            } else {
                layer.setOpacity(0.3);
            }
        }
    });
}

// Handle map search
function handleMapSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length < 2) {
        // Reset all markers to full opacity
        map.eachLayer(layer => {
            if (layer.locationData) {
                layer.setOpacity(1);
            }
        });
        return;
    }
    
    map.eachLayer(layer => {
        if (layer.locationData) {
            const location = layer.locationData;
            const matches = location.name.toLowerCase().includes(query) || 
                          location.description.toLowerCase().includes(query) ||
                          location.category.toLowerCase().includes(query);
            
            layer.setOpacity(matches ? 1 : 0.2);
            
            if (matches && map.getZoom() < 16) {
                map.setView(location.coordinates, 16, {animate: true, duration: 0.8});
            }
        }
    });
}

// Recenter map to user location
function recenterMap() {
    if (userMarker && map) {
        map.setView(userLocation, 15, {animate: true, duration: 1.0});
        
        // Add a subtle animation effect
        userMarker.setIcon(L.divIcon({
            className: 'user-marker pulse',
            html: '<i class="fas fa-dot-circle" style="color: #00f5ff; font-size: 24px; filter: drop-shadow(0 0 15px rgba(0, 245, 255, 0.8));"></i>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        }));
        
        setTimeout(() => {
            userMarker.setIcon(L.divIcon({
                className: 'user-marker',
                html: '<i class="fas fa-dot-circle" style="color: #00f5ff; font-size: 20px; filter: drop-shadow(0 0 10px rgba(0, 245, 255, 0.5));"></i>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            }));
        }, 1000);
    }
}

// Show location details
function showLocationDetails(location) {
    document.getElementById('location-title').textContent = location.name;
    document.getElementById('location-description').textContent = location.description;
    
    // Calculate distance (rough estimation)
    const distance = calculateDistance(userLocation, location.coordinates);
    document.getElementById('location-distance').textContent = distance + 'm';
    
    // Store current location for navigation
    window.currentLocation = location;
    
    navigateToPage('location');
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(pos1, pos2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1[0] * Math.PI / 180;
    const φ2 = pos2[0] * Math.PI / 180;
    const Δφ = (pos2[0] - pos1[0]) * Math.PI / 180;
    const Δλ = (pos2[1] - pos1[1]) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    const distance = R * c;
    return Math.round(distance);
}

// Get maximum bounds for map (950m radius around campus center with more vertical buffer)
function getMaxBounds() {
    const campusCenter = [26.8417, 75.5660];
    const radiusKm = 0.85; // 850 meters base radius
    const extraVerticalKm = 0.1; // Additional 100m vertical buffer
    const radiusDegrees = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
    const extraVerticalDegrees = extraVerticalKm / 111;
    
    return L.latLngBounds(
        [campusCenter[0] - radiusDegrees - extraVerticalDegrees, campusCenter[1] - radiusDegrees],
        [campusCenter[0] + radiusDegrees + extraVerticalDegrees, campusCenter[1] + radiusDegrees]
    );
}

// Location Page Setup
function setupLocationPage() {
    document.getElementById('location-back').addEventListener('click', function() {
        navigateToPage('map');
    });
    
    document.getElementById('share-location').addEventListener('click', function() {
        if (navigator.share && window.currentLocation) {
            navigator.share({
                title: 'Sparrow - ' + window.currentLocation.name,
                text: window.currentLocation.description,
                url: window.location.href
            });
        } else {
            // Fallback for browsers without Web Share API
            const shareText = `Check out ${window.currentLocation?.name || 'this location'} on Sparrow campus navigation!`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText).then(() => {
                    showNotification('Location link copied to clipboard!');
                });
            } else {
                showNotification('Share feature not available');
            }
        }
    });
    
    document.getElementById('navigate-btn').addEventListener('click', function() {
        if (window.currentLocation) {
            showDirections(window.currentLocation);
            navigateToPage('map');
        }
    });
}

// Show directions
function showDirections(destination) {
    const directionsPanel = document.getElementById('directions-panel');
    directionsPanel.classList.add('active');
    
    // Simulate directions (in a real app, you'd use a routing service)
    const steps = generateDirections(userLocation, destination.coordinates);
    const directionsList = document.getElementById('directions-list');
    
    directionsList.innerHTML = steps.map((step, index) => `
        <div class="direction-step" style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="width: 30px; height: 30px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; font-weight: bold;">
                ${index + 1}
            </div>
            <div style="flex: 1;">
                <div style="color: var(--text-primary); font-weight: 500;">${step.instruction}</div>
                <div style="color: var(--text-muted); font-size: 0.875rem;">${step.distance}</div>
            </div>
        </div>
    `).join('');
}

// Generate sample directions
function generateDirections(start, end) {
    return [
        { instruction: "Head northeast on Campus Main Road", distance: "120m" },
        { instruction: "Turn right at the Student Center", distance: "80m" },
        { instruction: "Continue straight past the Library", distance: "150m" },
        { instruction: "Your destination will be on the left", distance: "50m" }
    ];
}

// Hide directions panel
function hideDirectionsPanel() {
    document.getElementById('directions-panel').classList.remove('active');
}

// Search Page Setup
function setupSearchPage() {
    const mainSearch = document.getElementById('main-search');
    const clearSearch = document.getElementById('clear-search');
    const resultsContainer = document.querySelector('.results-list');
    
    mainSearch.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        if (query.length > 0) {
            performSearch(query);
            clearSearch.style.display = 'block';
        } else {
            resultsContainer.innerHTML = '';
            clearSearch.style.display = 'none';
        }
    });
    
    clearSearch.addEventListener('click', function() {
        mainSearch.value = '';
        resultsContainer.innerHTML = '';
        this.style.display = 'none';
        mainSearch.focus();
    });
    
    // Recent search item handlers
    setupRecentSearchHandlers();
}

// Perform search
function performSearch(query) {
    const results = campusLocations.filter(location => 
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.description.toLowerCase().includes(query.toLowerCase()) ||
        location.category.toLowerCase().includes(query.toLowerCase())
    );
    
    displaySearchResults(results);
}

// Display search results
function displaySearchResults(results) {
    const resultsContainer = document.querySelector('.results-list');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>No locations found matching your search.</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = results.map(location => {
        const iconClass = getCategoryIcon(location.category);
        const distance = calculateDistance(userLocation, location.coordinates);
        
        return `
            <div class="result-item" data-location-id="${location.id}">
                <i class="${iconClass}"></i>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                        <span style="font-weight: 500;">${location.name}</span>
                        <span class="distance-badge" style="background: rgba(0, 245, 255, 0.1); color: var(--accent-cyan); padding: 0.25rem 0.5rem; border-radius: 1rem; font-size: 0.75rem;">${distance}m</span>
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.875rem; text-transform: capitalize;">${location.category.replace(/s$/, '')}</div>
                </div>
                <i class="fas fa-chevron-right" style="color: var(--text-muted);"></i>
            </div>
        `;
    }).join('');
    
    // Add click handlers to results
    document.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', function() {
            const locationId = parseInt(this.getAttribute('data-location-id'));
            const location = campusLocations.find(loc => loc.id === locationId);
            
            if (location) {
                addToSearchHistory(location.name);
                showLocationDetails(location);
            }
        });
    });
}

// Setup recent search handlers
function setupRecentSearchHandlers() {
    document.querySelectorAll('.recent-item').forEach(item => {
        const removeBtn = item.querySelector('.remove-recent');
        
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const searchTerm = item.querySelector('span').textContent;
            removeFromSearchHistory(searchTerm);
            item.remove();
        });
        
        item.addEventListener('click', function() {
            const searchTerm = this.querySelector('span').textContent;
            document.getElementById('main-search').value = searchTerm;
            performSearch(searchTerm);
        });
    });
}

// Add to search history
function addToSearchHistory(searchTerm) {
    if (!searchHistory.includes(searchTerm)) {
        searchHistory.unshift(searchTerm);
        searchHistory = searchHistory.slice(0, 5); // Keep only 5 recent searches
        localStorage.setItem('sparrowSearchHistory', JSON.stringify(searchHistory));
        updateRecentSearches();
    }
}

// Remove from search history
function removeFromSearchHistory(searchTerm) {
    searchHistory = searchHistory.filter(term => term !== searchTerm);
    localStorage.setItem('sparrowSearchHistory', JSON.stringify(searchHistory));
    updateRecentSearches();
}

// Update recent searches display
function updateRecentSearches() {
    const recentContainer = document.querySelector('.recent-list');
    
    if (searchHistory.length === 0) {
        recentContainer.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--text-muted);">
                <p>No recent searches</p>
            </div>
        `;
        return;
    }
    
    recentContainer.innerHTML = searchHistory.map(term => `
        <div class="recent-item">
            <i class="fas fa-clock-rotate-left"></i>
            <span>${term}</span>
            <button class="remove-recent">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    setupRecentSearchHandlers();
}

// Settings Page Setup
function setupSettingsPage() {
    const themeToggle = document.getElementById('theme-toggle');
    const unitsSelect = document.getElementById('units');
    const offlineToggle = document.getElementById('offline-toggle');
    const clearDataBtn = document.getElementById('clear-data');
    
    // Theme toggle
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.remove('light-mode');
            localStorage.setItem('sparrowTheme', 'dark');
        } else {
            document.body.classList.add('light-mode');
            localStorage.setItem('sparrowTheme', 'light');
        }
    });
    
    // Units selection
    unitsSelect.addEventListener('change', function() {
        localStorage.setItem('sparrowUnits', this.value);
    });
    
    // Offline toggle
    offlineToggle.addEventListener('change', function() {
        localStorage.setItem('sparrowOfflineMode', this.checked);
        if (this.checked) {
            showNotification('Offline mode enabled. Maps will be cached for offline use.');
        } else {
            showNotification('Offline mode disabled.');
        }
    });
    
    // Clear data
    clearDataBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.removeItem('sparrowSearchHistory');
            localStorage.removeItem('sparrowUnits');
            localStorage.removeItem('sparrowOfflineMode');
            
            // Reset to defaults
            searchHistory = [];
            updateRecentSearches();
            unitsSelect.value = 'metric';
            offlineToggle.checked = false;
            
            showNotification('All data cleared successfully.');
        }
    });
}

// Load settings
function loadSettings() {
    const units = localStorage.getItem('sparrowUnits') || 'metric';
    const offlineMode = localStorage.getItem('sparrowOfflineMode') === 'true';
    
    document.getElementById('units').value = units;
    document.getElementById('offline-toggle').checked = offlineMode;
}


// Global search functionality
function setupGlobalSearch() {
    // Handle Enter key in search inputs
    document.querySelectorAll('.search-input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    performGlobalSearch(query);
                }
            }
        });
    });
}

// Perform global search
function performGlobalSearch(query) {
    addToSearchHistory(query);
    
    // Navigate to search page and perform search
    navigateToPage('search');
    document.getElementById('main-search').value = query;
    performSearch(query);
}

// Get user location
function getUserLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = [position.coords.latitude, position.coords.longitude];
                
                // Update user marker if map is initialized
                if (map && userMarker) {
                    userMarker.setLatLng(userLocation);
                    map.setView(userLocation, 16);
                }
            },
            function(error) {
                console.warn('Geolocation error:', error);
                showNotification('Location access denied. Using default location.');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
        
        // Watch position for continuous tracking
        if (!isTracking) {
            navigator.geolocation.watchPosition(
                function(position) {
                    userLocation = [position.coords.latitude, position.coords.longitude];
                    
                    if (map && userMarker) {
                        userMarker.setLatLng(userLocation);
                    }
                },
                function(error) {
                    console.warn('Position tracking error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 60000
                }
            );
            isTracking = true;
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--gradient-surface);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-lg);
        padding: 1rem 1.5rem;
        color: var(--text-primary);
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        transform: translateX(100%);
        transition: transform 0.3s ease-out;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}" style="color: var(--accent-cyan);"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Service Worker Registration (for PWA functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Handle online/offline status
window.addEventListener('online', function() {
    showNotification('Back online!', 'success');
});

window.addEventListener('offline', function() {
    showNotification('You are now offline', 'info');
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigateToPage('search');
        document.getElementById('main-search').focus();
    }
    
    // Escape key to close modals/panels
    if (e.key === 'Escape') {
        const directionsPanel = document.getElementById('directions-panel');
        if (directionsPanel.classList.contains('active')) {
            hideDirectionsPanel();
        }
        
        // Close mobile menu
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    }
});

// Toggle add marker mode
function toggleAddMarkerMode() {
    isAddingMarker = !isAddingMarker;
    const layersBtn = document.getElementById('layers-btn');
    
    if (isAddingMarker) {
        layersBtn.style.background = 'var(--accent-cyan)';
        layersBtn.style.color = 'white';
        map.getContainer().style.cursor = 'crosshair';
        showNotification('Click anywhere on the map to add a marker', 'info');
    } else {
        layersBtn.style.background = '';
        layersBtn.style.color = '';
        map.getContainer().style.cursor = '';
    }
}

// Show add marker dialog
function showAddMarkerDialog(latlng) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--gradient-surface);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-lg);
        padding: 2rem;
        z-index: 2000;
        min-width: 300px;
        color: var(--text-primary);
        box-shadow: var(--shadow-lg);
    `;
    
    dialog.innerHTML = `
        <h3 style="margin: 0 0 1rem 0; color: var(--accent-cyan);">Add Custom Marker</h3>
        <form id="marker-form">
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem;">Name:</label>
                <input type="text" id="marker-name" required style="width: 100%; padding: 0.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 0.3rem; background: rgba(255,255,255,0.1); color: var(--text-primary);">
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem;">Description:</label>
                <textarea id="marker-description" rows="3" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 0.3rem; background: rgba(255,255,255,0.1); color: var(--text-primary); resize: vertical;"></textarea>
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem;">Category:</label>
                <select id="marker-category" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 0.3rem; background: rgba(255,255,255,0.1); color: var(--text-primary);">
                    <option value="custom">Custom</option>
                    <option value="academic">Academic</option>
                    <option value="labs">Labs</option>
                    <option value="cafeterias">Cafeterias</option>
                    <option value="hostels">Hostels</option>
                    <option value="facilities">Facilities</option>
                    <option value="parking">Parking</option>
                </select>
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem;">Icon:</label>
                <select id="marker-icon" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 0.3rem; background: rgba(255,255,255,0.1); color: var(--text-primary);">
                    <option value="fas fa-map-marker-alt">📍 Default Pin</option>
                    <option value="fas fa-star">⭐ Star</option>
                    <option value="fas fa-heart">❤️ Heart</option>
                    <option value="fas fa-flag">🚩 Flag</option>
                    <option value="fas fa-bookmark">🔖 Bookmark</option>
                    <option value="fas fa-home">🏠 Home</option>
                    <option value="fas fa-car">🚗 Car</option>
                    <option value="fas fa-coffee">☕ Coffee</option>
                    <option value="fas fa-tree">🌳 Tree</option>
                    <option value="fas fa-camera">📷 Camera</option>
                </select>
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem;">Color:</label>
                <div style="display: flex; gap: 0.5rem;">
                    <button type="button" onclick="selectColor('#00f5ff')" style="width: 30px; height: 30px; background: #00f5ff; border: 2px solid white; border-radius: 50%; cursor: pointer;"></button>
                    <button type="button" onclick="selectColor('#ff4757')" style="width: 30px; height: 30px; background: #ff4757; border: 2px solid white; border-radius: 50%; cursor: pointer;"></button>
                    <button type="button" onclick="selectColor('#2ed573')" style="width: 30px; height: 30px; background: #2ed573; border: 2px solid white; border-radius: 50%; cursor: pointer;"></button>
                    <button type="button" onclick="selectColor('#ffa502')" style="width: 30px; height: 30px; background: #ffa502; border: 2px solid white; border-radius: 50%; cursor: pointer;"></button>
                    <button type="button" onclick="selectColor('#a55eea')" style="width: 30px; height: 30px; background: #a55eea; border: 2px solid white; border-radius: 50%; cursor: pointer;"></button>
                    <button type="button" onclick="selectColor('#26de81')" style="width: 30px; height: 30px; background: #26de81; border: 2px solid white; border-radius: 50%; cursor: pointer;"></button>
                </div>
                <input type="hidden" id="marker-color" value="#00f5ff">
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button type="submit" style="flex: 1; background: var(--accent-cyan); color: white; border: none; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer;">Add Marker</button>
                <button type="button" onclick="closeAddMarkerDialog()" style="flex: 1; background: #ff4757; color: white; border: none; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer;">Cancel</button>
            </div>
        </form>
    `;
    
    document.body.appendChild(dialog);
    
    // Store coordinates
    window.pendingMarkerCoords = [latlng.lat, latlng.lng];
    
    // Handle form submission
    document.getElementById('marker-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addCustomMarker();
    });
}

// Select color for marker
function selectColor(color) {
    document.getElementById('marker-color').value = color;
    // Update visual feedback
    document.querySelectorAll('[onclick^="selectColor"]').forEach(btn => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
    });
    event.target.style.transform = 'scale(1.2)';
    event.target.style.boxShadow = '0 0 10px rgba(255,255,255,0.5)';
}

// Close add marker dialog
function closeAddMarkerDialog() {
    const dialog = document.querySelector('[id="marker-form"]').closest('div');
    dialog.remove();
    isAddingMarker = false;
    toggleAddMarkerMode();
}

// Add custom marker
function addCustomMarker() {
    const name = document.getElementById('marker-name').value;
    const description = document.getElementById('marker-description').value;
    const category = document.getElementById('marker-category').value;
    const icon = document.getElementById('marker-icon').value;
    const color = document.getElementById('marker-color').value;
    
    const markerData = {
        id: Date.now().toString(),
        name: name,
        description: description,
        category: category,
        icon: icon,
        color: color,
        coordinates: window.pendingMarkerCoords
    };
    
    // Add to array and save
    customMarkers.push(markerData);
    localStorage.setItem('customMarkers', JSON.stringify(customMarkers));
    
    // Add to map
    addCustomMarkerToMap(markerData);
    
    // Close dialog and exit add mode
    closeAddMarkerDialog();
    showNotification('Marker added successfully!', 'success');
}

// Select marker
function selectMarker(markerId) {
    const marker = customMarkers.find(m => m.id === markerId);
    if (marker) {
        if (selectedMarkers.includes(markerId)) {
            selectedMarkers = selectedMarkers.filter(id => id !== markerId);
            showNotification(`Deselected: ${marker.name}`, 'info');
        } else {
            selectedMarkers.push(markerId);
            showNotification(`Selected: ${marker.name}`, 'success');
        }
        updateSelectedMarkersDisplay();
    }
}

// Delete custom marker
function deleteCustomMarker(markerId) {
    if (confirm('Are you sure you want to delete this marker?')) {
        // Remove from array
        customMarkers = customMarkers.filter(m => m.id !== markerId);
        localStorage.setItem('customMarkers', JSON.stringify(customMarkers));
        
        // Remove from map
        map.eachLayer(layer => {
            if (layer.customData && layer.customData.id === markerId) {
                map.removeLayer(layer);
            }
        });
        
        // Remove from selected
        selectedMarkers = selectedMarkers.filter(id => id !== markerId);
        updateSelectedMarkersDisplay();
        
        showNotification('Marker deleted successfully!', 'success');
    }
}

// Update selected markers display
function updateSelectedMarkersDisplay() {
    if (selectedMarkers.length > 0) {
        const names = selectedMarkers.map(id => {
            const marker = customMarkers.find(m => m.id === id);
            return marker ? marker.name : 'Unknown';
        }).join(', ');
        
        showNotification(`Selected markers: ${names}`, 'info');
    }
}

// Clear all selected markers
function clearSelectedMarkers() {
    selectedMarkers = [];
    updateSelectedMarkersDisplay();
}

// Delete all selected markers
function deleteSelectedMarkers() {
    if (selectedMarkers.length === 0) {
        showNotification('No markers selected', 'info');
        return;
    }
    
    if (confirm(`Delete ${selectedMarkers.length} selected markers?`)) {
        selectedMarkers.forEach(markerId => {
            deleteCustomMarker(markerId);
        });
        selectedMarkers = [];
    }
}

// Add main campus markers to map
function addMainCampusMarkers() {
    campusLocations.forEach(location => {
        const marker = L.marker(location.coordinates, {
            icon: L.divIcon({
                className: 'main-campus-marker',
                html: `<div class="campus-marker-icon" style="background: var(--gradient-primary); border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(139, 157, 195, 0.4); border: 3px solid var(--metallic-silver); animation: pulse-glow 2s ease-in-out infinite;"><i class="${getCategoryIcon(location.category)}" style="color: #2c3e50; font-size: 14px; font-weight: 600;"></i></div>`,
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            })
        }).addTo(map);
        
        // Store location data
        marker.locationData = location;
        campusMarkers.push(marker);
        
        // Bind click event to open comments sidebar
        marker.on('click', function(e) {
            e.originalEvent.stopPropagation();
            openCommentsPanel(location);
        });
        
        // Enhanced popup for main campus markers
        marker.bindPopup(`
            <div style="color: var(--text-primary); font-family: 'Inter', sans-serif; min-width: 200px;">
                <h4 style="margin: 0 0 0.75rem 0; color: #2c3e50; font-size: 1.1rem; font-weight: 600;">${location.name}</h4>
                <p style="margin: 0.5rem 0; line-height: 1.4; font-size: 0.9rem; color: #34495e;">${location.description}</p>
                <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(52,73,94,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #7f8c8d; font-size: 0.8rem; text-transform: capitalize;">${location.category}</span>
                        <button onclick="openCommentsPanel({id: ${location.id}})" style="background: #3498db; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 0.4rem; cursor: pointer; font-size: 0.8rem; font-weight: 500;">Comments</button>
                    </div>
                </div>
            </div>
        `);
    });
}

// Open comments panel
function openCommentsPanel(location) {
    currentSelectedLocation = location;
    const sidebar = document.getElementById('comments-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Show sidebar and overlay
    sidebar.classList.add('active');
    overlay.classList.add('active');
    
    // Update sidebar content
    updateCommentsSidebar(location);
}

// Close comments panel
function closeCommentsPanel() {
    const sidebar = document.getElementById('comments-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    currentSelectedLocation = null;
}

// Update comments sidebar content
function updateCommentsSidebar(location) {
    const locationTitle = document.getElementById('comments-location-title');
    const commentsList = document.getElementById('comments-list');
    
    locationTitle.textContent = location.name;
    
    // Get comments for this location
    const comments = locationComments[location.id] || [];
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <i class="fas fa-comments" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
        `;
    } else {
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item" style="margin-bottom: 1rem; animation: slideInComment 0.3s ease-out;">
                <div style="background: var(--gradient-surface); border: 1px solid rgba(255,255,255,0.1); border-radius: var(--radius-lg); padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 32px; height: 32px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.8rem;">
                                ${comment.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style="font-weight: 500; color: var(--text-primary); font-size: 0.9rem;">${comment.author}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(comment.timestamp).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <button onclick="deleteComment('${location.id}', '${comment.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; border-radius: 0.25rem; transition: all 0.2s;" onmouseover="this.style.color='#ff4757'; this.style.background='rgba(255,71,87,0.1)'" onmouseout="this.style.color='var(--text-muted)'; this.style.background='none'">
                            <i class="fas fa-trash" style="font-size: 0.8rem;"></i>
                        </button>
                    </div>
                    <p style="margin: 0; color: var(--text-secondary); line-height: 1.4; font-size: 0.9rem;">${comment.text}</p>
                </div>
            </div>
        `).join('');
    }
}

// Add comment to location
function addComment() {
    if (!currentSelectedLocation) return;
    
    const commentInput = document.getElementById('comment-input');
    const authorInput = document.getElementById('comment-author');
    
    const commentText = commentInput.value.trim();
    const authorName = authorInput.value.trim();
    
    if (!commentText || !authorName) {
        showNotification('Please fill in both fields', 'error');
        return;
    }
    
    const comment = {
        id: Date.now().toString(),
        text: commentText,
        author: authorName,
        timestamp: new Date().toISOString()
    };
    
    // Add comment to location
    if (!locationComments[currentSelectedLocation.id]) {
        locationComments[currentSelectedLocation.id] = [];
    }
    locationComments[currentSelectedLocation.id].push(comment);
    
    // Save to localStorage
    localStorage.setItem('locationComments', JSON.stringify(locationComments));
    
    // Clear inputs
    commentInput.value = '';
    authorInput.value = '';
    
    // Update sidebar
    updateCommentsSidebar(currentSelectedLocation);
    
    showNotification('Comment added successfully!', 'success');
}

// Delete comment
function deleteComment(locationId, commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        locationComments[locationId] = locationComments[locationId].filter(c => c.id !== commentId);
        localStorage.setItem('locationComments', JSON.stringify(locationComments));
        updateCommentsSidebar(currentSelectedLocation);
        showNotification('Comment deleted', 'info');
    }
}

// Enhanced add marker dialog with animations
function showAddMarkerDialog(latlng) {
    const dialog = document.createElement('div');
    dialog.className = 'add-marker-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        background: var(--gradient-surface);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-xl);
        padding: 2rem;
        z-index: 2000;
        min-width: 350px;
        color: var(--text-primary);
        box-shadow: var(--shadow-lg);
        opacity: 0;
        animation: modalAppear 0.3s ease-out forwards;
    `;
    
    dialog.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="width: 60px; height: 60px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; animation: bounce 0.6s ease-out;">
                <i class="fas fa-map-marker-alt" style="color: white; font-size: 1.5rem;"></i>
            </div>
            <h3 style="margin: 0; color: var(--metallic-silver); font-size: 1.3rem;">Add Personal Marker</h3>
            <p style="margin: 0.5rem 0 0; color: var(--text-muted); font-size: 0.9rem;">Create your own custom location marker</p>
        </div>
        <form id="marker-form">
            <div class="form-group" style="margin-bottom: 1rem; animation: slideInUp 0.4s ease-out 0.1s both;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Name:</label>
                <input type="text" id="marker-name" required style="width: 100%; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-lg); background: rgba(255,255,255,0.1); color: var(--text-primary); font-size: 0.9rem; transition: all 0.3s ease;" placeholder="Enter marker name...">
            </div>
            <div class="form-group" style="margin-bottom: 1rem; animation: slideInUp 0.4s ease-out 0.2s both;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Description:</label>
                <textarea id="marker-description" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-lg); background: rgba(255,255,255,0.1); color: var(--text-primary); resize: vertical; font-size: 0.9rem; transition: all 0.3s ease;" placeholder="Describe this location..."></textarea>
            </div>
            <div class="form-group" style="margin-bottom: 1rem; animation: slideInUp 0.4s ease-out 0.3s both;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Category:</label>
                <select id="marker-category" style="width: 100%; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-lg); background: rgba(255,255,255,0.1); color: var(--text-primary); font-size: 0.9rem;">
                    <option value="custom">Personal</option>
                    <option value="academic">Academic</option>
                    <option value="labs">Labs</option>
                    <option value="cafeterias">Food & Dining</option>
                    <option value="hostels">Accommodation</option>
                    <option value="facilities">Facilities</option>
                    <option value="parking">Parking</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom: 1rem; animation: slideInUp 0.4s ease-out 0.4s both;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Icon:</label>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem;">
                    <button type="button" onclick="selectIcon('fas fa-map-marker-alt')" class="icon-btn" style="padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); background: rgba(255,255,255,0.1); cursor: pointer; transition: all 0.3s;"><i class="fas fa-map-marker-alt"></i></button>
                    <button type="button" onclick="selectIcon('fas fa-star')" class="icon-btn" style="padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); background: rgba(255,255,255,0.1); cursor: pointer; transition: all 0.3s;"><i class="fas fa-star"></i></button>
                    <button type="button" onclick="selectIcon('fas fa-heart')" class="icon-btn" style="padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); background: rgba(255,255,255,0.1); cursor: pointer; transition: all 0.3s;"><i class="fas fa-heart"></i></button>
                    <button type="button" onclick="selectIcon('fas fa-flag')" class="icon-btn" style="padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); background: rgba(255,255,255,0.1); cursor: pointer; transition: all 0.3s;"><i class="fas fa-flag"></i></button>
                    <button type="button" onclick="selectIcon('fas fa-bookmark')" class="icon-btn" style="padding: 0.75rem; border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-md); background: rgba(255,255,255,0.1); cursor: pointer; transition: all 0.3s;"><i class="fas fa-bookmark"></i></button>
                </div>
                <input type="hidden" id="marker-icon" value="fas fa-map-marker-alt">
            </div>
            <div class="form-group" style="margin-bottom: 1.5rem; animation: slideInUp 0.4s ease-out 0.5s both;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Color:</label>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button type="button" onclick="selectColor('#00f5ff')" class="color-btn" style="width: 35px; height: 35px; background: #00f5ff; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; cursor: pointer; transition: all 0.3s;"></button>
                    <button type="button" onclick="selectColor('#ff4757')" class="color-btn" style="width: 35px; height: 35px; background: #ff4757; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; cursor: pointer; transition: all 0.3s;"></button>
                    <button type="button" onclick="selectColor('#2ed573')" class="color-btn" style="width: 35px; height: 35px; background: #2ed573; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; cursor: pointer; transition: all 0.3s;"></button>
                    <button type="button" onclick="selectColor('#ffa502')" class="color-btn" style="width: 35px; height: 35px; background: #ffa502; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; cursor: pointer; transition: all 0.3s;"></button>
                    <button type="button" onclick="selectColor('#a55eea')" class="color-btn" style="width: 35px; height: 35px; background: #a55eea; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; cursor: pointer; transition: all 0.3s;"></button>
                    <button type="button" onclick="selectColor('#26de81')" class="color-btn" style="width: 35px; height: 35px; background: #26de81; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; cursor: pointer; transition: all 0.3s;"></button>
                </div>
                <input type="hidden" id="marker-color" value="#00f5ff">
            </div>
            <div style="display: flex; gap: 1rem; animation: slideInUp 0.4s ease-out 0.6s both;">
                <button type="submit" style="flex: 1; background: var(--gradient-primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500; transition: all 0.3s;">Create Marker</button>
                <button type="button" onclick="closeAddMarkerDialog()" style="flex: 1; background: rgba(255,71,87,0.8); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500; transition: all 0.3s;">Cancel</button>
            </div>
        </form>
    `;
    
    document.body.appendChild(dialog);
    
    // Store coordinates
    window.pendingMarkerCoords = [latlng.lat, latlng.lng];
    
    // Handle form submission
    document.getElementById('marker-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addCustomMarker();
    });
    
    // Focus first input
    setTimeout(() => {
        document.getElementById('marker-name').focus();
    }, 300);
}

// Select icon for marker
function selectIcon(iconClass) {
    document.getElementById('marker-icon').value = iconClass;
    // Update visual feedback
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.style.background = 'rgba(255,255,255,0.1)';
        btn.style.borderColor = 'rgba(255,255,255,0.2)';
        btn.style.color = 'var(--text-primary)';
    });
    event.target.closest('.icon-btn').style.background = 'var(--metallic-silver)';
    event.target.closest('.icon-btn').style.borderColor = 'var(--metallic-silver)';
    event.target.closest('.icon-btn').style.color = 'var(--primary-bg)';
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
