import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import { WeatherLocationModal } from "./WeatherLocationModal";
import { ContactSidebar } from "./ContactSidebar";
import { CalendarGrid } from "./CalendarGrid";


export default function App() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userLocation = useQuery(api.weather.getUserLocation);
  const userTemperatureUnit = useQuery(api.weather.getUserTemperatureUnit);
  const updateUserLocation = useMutation(api.weather.updateUserLocation);
  const updateUserTemperatureUnit = useMutation(api.weather.updateUserTemperatureUnit);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const weatherLocation = userLocation || { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060 };

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-blue-600">⛵ Boat Calendar</h2>
        <div className="flex items-center gap-4">
          <Authenticated>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">📍 {weatherLocation?.name || 'No location set'}</span>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs text-blue-700 transition-colors"
                >
                  Change
                </button>
              </div>
              
              {/* Temperature unit toggle */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateUserTemperatureUnit({ temperatureUnit: userTemperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius' })}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors"
                  title="Toggle temperature unit"
                >
                  🌡️ {userTemperatureUnit === 'celsius' ? '°C' : '°F'}
                </button>
              </div>
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
        <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-blue-600 mb-4">Boat Calendar</h1>
              <p className="text-gray-600">Sign in to manage your boat invitations</p>
            </div>
            <SignInForm />
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
          <button onClick={handlePrev} className="px-2 py-1 rounded hover:bg-gray-200 text-lg" aria-label="Previous 4 weeks">←</button>
          <span className="font-semibold text-gray-700">{monthLabel()}</span>
          <button onClick={handleNext} className="px-2 py-1 rounded hover:bg-gray-200 text-lg" aria-label="Next 4 weeks">→</button>
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
