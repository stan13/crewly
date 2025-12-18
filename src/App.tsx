import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { Id } from "../convex/_generated/dataModel";
import { WeatherLocationModal } from "./WeatherLocationModal";
import { ContactSidebar } from "./ContactSidebar";
import { CalendarGrid } from "./CalendarGrid";
import { BoatSettings } from "./BoatSettings";
import { FirstTimeUserOnboarding } from "./FirstTimeUserOnboarding";
import { PendingInvitesWelcome } from "./PendingInvitesWelcome";
import { ChillwaveIcon } from "./ChillwaveIcon";

function SailingBoat({ size, bottom, initialDelay, bobDelay }: { size: number; bottom: number; initialDelay: number; bobDelay: number }) {
  const [animKey, setAnimKey] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const scheduleNextSail = useCallback((delay: number) => {
    setTimeout(() => {
      setAnimKey(k => k + 1);
      setIsVisible(true);
    }, delay * 1000);
  }, []);

  // Initial delay
  useEffect(() => {
    scheduleNextSail(initialDelay);
  }, [initialDelay, scheduleNextSail]);

  const handleAnimationEnd = () => {
    setIsVisible(false);
    const randomDelay = 2 + Math.random() * 4; // 2-6 seconds
    scheduleNextSail(randomDelay);
  };

  return (
    <div
      className="absolute left-0 right-0 h-24 pointer-events-none overflow-hidden"
      style={{ bottom: `${bottom}%` }}
    >
      {isVisible && (
        <div
          key={animKey}
          className="animate-sail-once"
          onAnimationEnd={handleAnimationEnd}
        >
          <svg
            className="animate-bob"
            style={{
              width: `${size * 4}px`,
              height: `${size * 4}px`,
              animationDelay: `${bobDelay}s`,
            }}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Sail */}
            <path
              d="M32 8 L32 40 L48 40 Z"
              className="fill-white/90 dark:fill-gray-200/80"
            />
            {/* Mast */}
            <line
              x1="32"
              y1="8"
              x2="32"
              y2="44"
              className="stroke-gray-600 dark:stroke-gray-400"
              strokeWidth="2"
            />
            {/* Hull */}
            <path
              d="M16 44 L20 54 L44 54 L48 44 Z"
              className="fill-ocean-600 dark:fill-ocean-500"
            />
            {/* Hull accent */}
            <path
              d="M18 48 L20 54 L44 54 L46 48 Z"
              className="fill-ocean-700 dark:fill-ocean-600"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInvitesWelcome, setShowInvitesWelcome] = useState(false);
  const [newBoatName, setNewBoatName] = useState("");

  const weatherLocation = userLocation || { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060 };

  // Show onboarding for first-time users
  useEffect(() => {
    if (loggedInUser && userBoats !== undefined && pendingInvites !== undefined) {
      if (userBoats.length === 0) {
        // If user has pending invites, show invites welcome
        if (pendingInvites.length > 0) {
          setShowInvitesWelcome(true);
          setShowOnboarding(false);
        } else {
          // If no boats and no invites, show regular onboarding
          setShowOnboarding(true);
          setShowInvitesWelcome(false);
        }
      } else {
        // User has boats, don't show any onboarding
        setShowOnboarding(false);
        setShowInvitesWelcome(false);
      }
    }
  }, [loggedInUser, userBoats, pendingInvites]);

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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      userTheme === 'dark' ? 'dark bg-gray-900' : 'bg-slate-50'
    }`}>
      <Authenticated>
      <header className={`sticky top-0 z-30 h-16 flex justify-between items-center border-b px-6 transition-all duration-300 ${
        userTheme === 'dark'
          ? 'bg-gray-900/95 backdrop-blur-md border-gray-800'
          : 'bg-white/95 backdrop-blur-md border-gray-200/80'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ChillwaveIcon size={32} className="shadow-md" />
            <h2 className="text-xl font-semibold text-gradient">
              Crewly
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Authenticated>
            <div className="flex items-center gap-2">
              {/* Boat selector */}
              <div className="relative" data-boat-dropdown>
                <button
                  onClick={() => setShowBoatDropdown(!showBoatDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative
                    bg-ocean-50 dark:bg-ocean-900/20 text-ocean-700 dark:text-ocean-300
                    border border-ocean-200/50 dark:border-ocean-800/50
                    hover:bg-ocean-100 dark:hover:bg-ocean-900/30 hover:border-ocean-300 dark:hover:border-ocean-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v2.76a3 3 0 01-.88 2.12L9 21" />
                  </svg>
                  <span className="max-w-32 truncate">{selectedBoat?.name || 'Select boat'}</span>
                  <svg className="w-4 h-4 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  {pendingInvites && pendingInvites.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                      {pendingInvites.length}
                    </span>
                  )}
                </button>

                {showBoatDropdown && (
                  <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-2 min-w-52 z-40 animate-scale-in">
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Your Boats
                    </div>
                    {userBoats?.map((boat) => (
                      <button
                        key={boat._id}
                        onClick={() => handleSelectBoat(boat._id)}
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                          selectedBoat?._id === boat._id
                            ? 'bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v2.76a3 3 0 01-.88 2.12L9 21" />
                            </svg>
                            <span className="font-medium">{boat.name}</span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{boat.role}</span>
                        </div>
                      </button>
                    ))}

                    <div className="my-2 border-t border-gray-100 dark:border-gray-700" />

                    <button
                      onClick={() => {
                        setShowCreateBoat(true);
                        setShowBoatDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm text-ocean-600 dark:text-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-900/20 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Create new boat
                    </button>

                    <button
                      onClick={() => {
                        setShowBoatSettings(true);
                        setShowBoatDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings & sharing
                      </div>
                      {pendingInvites && pendingInvites.length > 0 && (
                        <span className="bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                          {pendingInvites.length}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Location button */}
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  border border-gray-200/50 dark:border-gray-700/50
                  hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Change location"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline max-w-24 truncate">{weatherLocation?.name || 'Location'}</span>
              </button>

              {/* Temperature unit toggle */}
              <button
                onClick={() => updateUserTemperatureUnit({ temperatureUnit: userTemperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius' })}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200
                  bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  border border-gray-200/50 dark:border-gray-700/50
                  hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Toggle temperature unit"
              >
                {userTemperatureUnit === 'celsius' ? '°C' : '°F'}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => updateUserTheme({ theme: userTheme === 'light' ? 'dark' : 'light' })}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-sm transition-all duration-200
                  bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  border border-gray-200/50 dark:border-gray-700/50
                  hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Toggle dark mode"
              >
                {userTheme === 'light' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
            </div>
          </Authenticated>
          <SignOutButton />
        </div>
      </header>
      </Authenticated>
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
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateBoat(false);
              setNewBoatName("");
            }
          }}
        >
          <div className="modal-content p-6 w-[420px] max-w-[90vw]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Create New Boat
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add a new boat to your fleet</p>
              </div>
            </div>
            <form onSubmit={handleCreateBoat}>
              <div className="mb-5">
                <label htmlFor="boatName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Boat Name
                </label>
                <input
                  type="text"
                  id="boatName"
                  value={newBoatName}
                  onChange={(e) => setNewBoatName(e.target.value)}
                  placeholder="Enter boat name..."
                  className="input-field"
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
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
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

      {/* First Time User Onboarding */}
      {showOnboarding && (
        <FirstTimeUserOnboarding
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* Pending Invites Welcome */}
      {showInvitesWelcome && pendingInvites && (
        <PendingInvitesWelcome
          pendingInvites={pendingInvites}
          onClose={() => setShowInvitesWelcome(false)}
        />
      )}

      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-gray-100',
        }}
      />
    </div>
  );
}

function Content({ weatherLocation, temperatureUnit }: { weatherLocation: { name: string; latitude: number; longitude: number }, temperatureUnit: string }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-ocean-200 border-t-ocean-500 rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex flex-col">
      <Authenticated>

        <BoatCalendar weatherLocation={weatherLocation} temperatureUnit={temperatureUnit} />
      </Authenticated>
      <Unauthenticated>
        <div className="flex flex-1 items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 via-ocean-50/50 to-ocean-100/80 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
          {/* Layered sine wave background - using CSS transform for GPU acceleration */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Soft ambient gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ocean-200/30 dark:to-ocean-900/20"></div>

            {/* Wave layer 1 - Back (slowest, largest amplitude) */}
            <div className="absolute bottom-0 left-0 right-0 h-[45%]">
              <svg
                className="absolute bottom-0 w-[200%] h-full text-ocean-100/70 dark:text-ocean-900/50 animate-wave-slow"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                fill="currentColor"
              >
                <path d="M0,160 C180,220 360,100 540,160 C720,220 900,100 1080,160 C1260,220 1440,100 1440,160 L1440,320 L0,320 Z"/>
              </svg>
            </div>

            {/* Wave layer 2 - Middle */}
            <div className="absolute bottom-0 left-0 right-0 h-[35%]">
              <svg
                className="absolute bottom-0 w-[200%] h-full text-ocean-200/60 dark:text-ocean-800/40 animate-wave-medium"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                fill="currentColor"
              >
                <path d="M0,192 C120,240 240,144 360,192 C480,240 600,144 720,192 C840,240 960,144 1080,192 C1200,240 1320,144 1440,192 L1440,320 L0,320 Z"/>
              </svg>
            </div>

            {/* Wave layer 3 - Front middle */}
            <div className="absolute bottom-0 left-0 right-0 h-[28%]">
              <svg
                className="absolute bottom-0 w-[200%] h-full text-ocean-300/50 dark:text-ocean-700/30 animate-wave-fast"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                fill="currentColor"
              >
                <path d="M0,224 C60,256 120,192 180,224 C240,256 300,192 360,224 C420,256 480,192 540,224 C600,256 660,192 720,224 C780,256 840,192 900,224 C960,256 1020,192 1080,224 C1140,256 1200,192 1260,224 C1320,256 1380,192 1440,224 L1440,320 L0,320 Z"/>
              </svg>
            </div>

            {/* Wave layer 4 - Front (fastest, smallest amplitude) */}
            <div className="absolute bottom-0 left-0 right-0 h-[20%]">
              <svg
                className="absolute bottom-0 w-[200%] h-full text-ocean-400/40 dark:text-ocean-600/25 animate-wave-fastest"
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
                fill="currentColor"
              >
                <path d="M0,256 C60,272 120,240 180,256 C240,272 300,240 360,256 C420,272 480,240 540,256 C600,272 660,240 720,256 C780,272 840,240 900,256 C960,272 1020,240 1080,256 C1140,272 1200,240 1260,256 C1320,272 1380,240 1440,256 L1440,320 L0,320 Z"/>
              </svg>
            </div>

            {/* Subtle foam/sparkle effect on top wave */}
            <div className="absolute bottom-[18%] left-0 right-0 h-8 opacity-30">
              <div className="w-[200%] h-full animate-wave-fastest flex items-center">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-white mx-8"
                    style={{
                      opacity: 0.3 + Math.random() * 0.4,
                      transform: `translateY(${Math.sin(i * 0.5) * 8}px)`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Sailing boats */}
            {[...Array(3)].map((_, i) => (
              <SailingBoat
                key={i}
                size={16 + (i * 3)}
                bottom={4 + (i * 2)}
                initialDelay={i * 12}
                bobDelay={i * 0.5}
              />
            ))}
          </div>

          <div className="w-full max-w-md mx-auto px-6 relative z-10 animate-fade-in mb-32">
            {/* Hero section */}
            <div className="text-center mb-8">
              <ChillwaveIcon size={80} className="mb-6" />

              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome to <span className="text-gradient">Crewly</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Organize your crew, track schedules, and plan your adventures on the water.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-ocean-700 dark:text-ocean-300 text-sm font-medium shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-cyan-700 dark:text-cyan-300 text-sm font-medium shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Crew
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-emerald-700 dark:text-emerald-300 text-sm font-medium shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  Weather
                </span>
              </div>
            </div>

            {/* Sign-in card */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-ocean-900/10 dark:shadow-black/30 border border-white/60 dark:border-gray-700/50 p-8">
              <SignInForm />
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
    <div className="flex h-[calc(100vh-4rem)]">
      <ContactSidebar onDragStart={handleDragStart} />

      {/* Calendar */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 dark:bg-gray-900">
        {/* Navigation and Month Label */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrev}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 shadow-sm"
            aria-label="Previous 4 weeks"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{monthLabel()}</h2>
          <button
            onClick={handleNext}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 shadow-sm"
            aria-label="Next 4 weeks"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
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
