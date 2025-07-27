import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";
import { WeatherLocationModal } from "./WeatherLocationModal";
import { ContactSidebar } from "./ContactSidebar";
import { CalendarGrid } from "./CalendarGrid";
import { BoatSettings } from "./BoatSettings";


export default function App() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userLocation = useQuery(api.weather.getUserLocation);
  const userTemperatureUnit = useQuery(api.weather.getUserTemperatureUnit);
  const userTheme = useQuery(api.weather.getUserTheme);
  const updateUserLocation = useMutation(api.weather.updateUserLocation);
  const updateUserTemperatureUnit = useMutation(api.weather.updateUserTemperatureUnit);
  const updateUserTheme = useMutation(api.weather.updateUserTheme);
  
  // Boat management
  const userBoats = useQuery(api.boats.getUserBoats);
  const selectedBoat = useQuery(api.boats.getSelectedBoat);
  const pendingInvites = useQuery(api.boats.getPendingInvites);
  const selectBoat = useMutation(api.boats.selectBoat);
  const createBoat = useMutation(api.boats.createBoat);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBoatDropdown, setShowBoatDropdown] = useState(false);
  const [showCreateBoat, setShowCreateBoat] = useState(false);
  const [showBoatSettings, setShowBoatSettings] = useState(false);
  const [newBoatName, setNewBoatName] = useState("");

  const weatherLocation = userLocation || { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060 };

  // Click-away to close dropdowns and modals
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close boat dropdown if clicking outside
      if (showBoatDropdown && !target.closest('[data-boat-dropdown]')) {
        setShowBoatDropdown(false);
      }
    };

    if (showBoatDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showBoatDropdown]);

  const handleLocationSave = async (newLocation: { name: string; latitude: number; longitude: number }) => {
    try {
      await updateUserLocation({ 
        locationName: newLocation.name,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude
      });
      setShowLocationModal(false);
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const handleCreateBoat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoatName.trim()) {
      try {
        await createBoat({ name: newBoatName.trim() });
        setNewBoatName("");
        setShowCreateBoat(false);
      } catch (error) {
        console.error('Failed to create boat:', error);
      }
    }
  };

  const handleSelectBoat = async (boatId: Id<"boats">) => {
    try {
      await selectBoat({ boatId });
      setShowBoatDropdown(false);
    } catch (error) {
      console.error('Failed to select boat:', error);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      userTheme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      <header className={`sticky top-0 z-30 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4 transition-colors ${
        userTheme === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Crewly
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <Authenticated>
            <div className="flex items-center gap-3">
              {/* Boat selector */}
              <div className="relative" data-boat-dropdown>
                <button
                  onClick={() => setShowBoatDropdown(!showBoatDropdown)}
                  className="flex items-center gap-2 bg-cyan-50 dark:bg-cyan-900/30 rounded px-3 py-2 border border-cyan-200 dark:border-cyan-700 hover:bg-cyan-100 dark:hover:bg-cyan-800/50 transition-colors text-sm relative"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">🚤 {selectedBoat?.name || 'No boat selected'}</span>
                  <span className="text-xs">▼</span>
                  {pendingInvites && pendingInvites.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {pendingInvites.length}
                    </span>
                  )}
                </button>
                
                {showBoatDropdown && (
                  <div className="absolute top-full mt-1 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-48 z-40">
                    {userBoats?.map((boat) => (
                      <button
                        key={boat._id}
                        onClick={() => handleSelectBoat(boat._id)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          selectedBoat?._id === boat._id ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>🚤 {boat.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{boat.role}</span>
                        </div>
                      </button>
                    ))}
                    
                    <hr className="my-1" />
                    
                    <button
                      onClick={() => {
                        setShowCreateBoat(true);
                        setShowBoatDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      ➕ Create new boat
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowBoatSettings(true);
                        setShowBoatDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
                    >
                      <span>⚙️ Boat settings & sharing</span>
                      {pendingInvites && pendingInvites.length > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                          {pendingInvites.length}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 rounded px-3 py-2 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-sm"
                title="Click to change location"
              >
                <span className="text-gray-700 dark:text-gray-300">🌊 {weatherLocation?.name || 'No location set'}</span>
              </button>
              
              {/* Temperature unit toggle */}
              <button
                onClick={() => updateUserTemperatureUnit({ temperatureUnit: userTemperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius' })}
                className="px-3 py-2 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-800/50 rounded text-sm text-gray-700 dark:text-gray-300 transition-colors border border-orange-200 dark:border-orange-700"
                title="Toggle temperature unit"
              >
                🌡️ {userTemperatureUnit === 'celsius' ? '°C' : '°F'}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => updateUserTheme({ theme: userTheme === 'light' ? 'dark' : 'light' })}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-600"
                title="Toggle dark mode"
              >
                {userTheme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </Authenticated>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <Content weatherLocation={weatherLocation} temperatureUnit={userTemperatureUnit || 'fahrenheit'} />
      </main>
      
      <WeatherLocationModal
        isOpen={showLocationModal}
        currentLocation={weatherLocation}
        onSave={handleLocationSave}
        onClose={() => setShowLocationModal(false)}
      />

      {/* Create Boat Modal */}
      {showCreateBoat && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateBoat(false);
              setNewBoatName("");
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              ⛵ Create New Boat
            </h3>
            <form onSubmit={handleCreateBoat}>
              <div className="mb-4">
                <label htmlFor="boatName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Boat Name
                </label>
                <input
                  type="text"
                  id="boatName"
                  value={newBoatName}
                  onChange={(e) => setNewBoatName(e.target.value)}
                  placeholder="Enter boat name..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateBoat(false);
                    setNewBoatName("");
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Create Boat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Boat Settings Modal */}
      <BoatSettings
        isOpen={showBoatSettings}
        boatId={selectedBoat?._id || null}
        onClose={() => setShowBoatSettings(false)}
      />
      
      <Toaster />
    </div>
  );
}

function Content({ weatherLocation, temperatureUnit }: { weatherLocation: { name: string; latitude: number; longitude: number }, temperatureUnit: string }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex flex-col">
      <Authenticated>
        
        <BoatCalendar weatherLocation={weatherLocation} temperatureUnit={temperatureUnit} />
      </Authenticated>
      <Unauthenticated>
        <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 relative overflow-hidden">
          {/* Animated background waves */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-200 to-transparent animate-pulse"></div>
            <div className="absolute top-1/4 -left-20 w-40 h-40 bg-blue-300 rounded-full opacity-30"></div>
            <div className="absolute top-1/3 -right-16 w-24 h-24 bg-cyan-300 rounded-full opacity-40"></div>
            <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-blue-400 rounded-full opacity-25"></div>
          </div>
          
          <div className="w-full max-w-md mx-auto relative z-10">
            <div className="text-center mb-8">
              {/* Large boat with wind effect */}
              <div 
                className="text-8xl mb-4 transition-transform duration-300 ease-out cursor-pointer select-none"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left - rect.width / 2;
                  const maxRotation = 15;
                  const rotation = (x / rect.width) * maxRotation * 2;
                  e.currentTarget.style.transform = `rotate(${Math.max(-maxRotation, Math.min(maxRotation, rotation))}deg)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ⛵
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent mb-4">
                Ahoy, Captain! 🌊
              </h1>
              <p className="text-gray-700 text-lg mb-2">Welcome aboard Crewly</p>
              <p className="text-gray-600">Chart your course and manage your maritime adventures</p>
              
              {/* Decorative elements - reduced animations */}
              <div className="flex justify-center items-center gap-4 mt-4 text-2xl">
                <span>🐟</span>
                <span>⚓</span>
                <span>🌊</span>
                <span>🦭</span>
                <span>🐚</span>
              </div>
            </div>
            
            {/* Enhanced sign-in form container */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-100 p-8 relative overflow-hidden">
              {/* Decorative corner waves */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-cyan-100 to-transparent rounded-tr-full"></div>
              
              <SignInForm />
              
              {/* Bottom decoration */}
              <div className="text-center mt-6 text-sm text-gray-500">
                <span>⚓ Secure Harbor ⚓</span>
              </div>
            </div>
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}

function BoatCalendar({ weatherLocation, temperatureUnit }: { weatherLocation: { name: string; latitude: number; longitude: number }, temperatureUnit: string }) {
  const addContact = useMutation(api.boatSessions.addContact);
  const removeContact = useMutation(api.boatSessions.removeContact);

  const [draggedContact, setDraggedContact] = useState<Id<"contacts"> | null>(null);
  const [draggedFromDate, setDraggedFromDate] = useState<string | null>(null);
  // New state for calendar window navigation
  const [windowStart, setWindowStart] = useState(() => {
    const today = new Date();
    // Start from the most recent Sunday
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // Generate 4 weeks (28 days) from windowStart
  const dates: Date[] = [];
  for (let i = 0; i < 28; i++) {
    const date = new Date(windowStart);
    date.setDate(windowStart.getDate() + i);
    dates.push(date);
  }

  const handleDragStart = (contactId: Id<"contacts">, fromDate?: string) => {
    setDraggedContact(contactId);
    setDraggedFromDate(fromDate || null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    if (draggedContact) {
      if (draggedFromDate && draggedFromDate !== date) {
        // Moving from one date to another
        void removeContact({ date: draggedFromDate, contactId: draggedContact });
        void addContact({ date, contactId: draggedContact });
      } else if (!draggedFromDate) {
        // Adding from sidebar
        void addContact({ date, contactId: draggedContact });
      }
      // If draggedFromDate === date, it's the same day so do nothing
      setDraggedContact(null);
      setDraggedFromDate(null);
    }
  };

  // Navigation handlers
  const handlePrev = () => {
    const prev = new Date(windowStart);
    prev.setDate(windowStart.getDate() - 28);
    setWindowStart(prev);
  };
  const handleNext = () => {
    const next = new Date(windowStart);
    next.setDate(windowStart.getDate() + 28);
    setWindowStart(next);
  };

  // Get month label for the current window
  const monthLabel = () => {
    const first = dates[0];
    const last = dates[dates.length - 1];
    if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
      return `${first.toLocaleString('en-US', { month: 'long' })} ${first.getFullYear()}`;
    } else {
      return `${first.toLocaleString('en-US', { month: 'short' })} ${first.getFullYear()} - ${last.toLocaleString('en-US', { month: 'short' })} ${last.getFullYear()}`;
    }
  };

  return (
    <div className="flex h-screen">
      <ContactSidebar onDragStart={handleDragStart} />
      
      {/* Calendar */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Navigation and Month Label */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrev} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-lg" aria-label="Previous 4 weeks">←</button>
          <span className="font-semibold text-gray-700 dark:text-gray-300">{monthLabel()}</span>
          <button onClick={handleNext} className="px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-lg" aria-label="Next 4 weeks">→</button>
        </div>
        <CalendarGrid
          dates={dates}
          weatherLocation={weatherLocation}
          temperatureUnit={temperatureUnit}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        />
      </div>
    </div>
  );
}
