import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useState, useEffect } from "react";

interface Contact {
  _id: Id<"contacts">;
  name: string;
  email?: string;
  phone?: string;
}

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
}

interface CalendarGridProps {
  dates: Date[];
  weatherLocation: LocationData;
  temperatureUnit: string;
  onDragStart: (contactId: Id<"contacts">, fromDate?: string) => void;
  onDrop: (e: React.DragEvent, date: string) => void;
  onDragOver: (e: React.DragEvent) => void;
}

export function CalendarGrid({
  dates,
  weatherLocation,
  temperatureUnit,
  onDragStart,
  onDrop,
  onDragOver
}: CalendarGridProps) {
  const contacts = useQuery(api.contacts.list) || [];
  const boatSessions = useQuery(api.boatSessions.list) || [];
  const removeContact = useMutation(api.boatSessions.removeContact);
  const updateTime = useMutation(api.boatSessions.updateTime);
  const addContact = useMutation(api.boatSessions.addContact);

  // State for autocomplete
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter contacts based on search term and exclude already added contacts
  const getFilteredContacts = (dateString: string) => {
    const session = getSessionForDate(dateString);
    const addedContactIds = session?.contactIds || [];
    
    return contacts
      .filter(contact => 
        !addedContactIds.includes(contact._id) &&
        contact.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 results
  };

  // Handle click on day to start autocomplete
  const handleDayClick = (dateString: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't activate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('input, button, .contact-item') || target.tagName === 'INPUT' || target.tagName === 'BUTTON') {
      return;
    }
    
    console.log('Day clicked:', dateString); // Debug log
    setActiveDate(dateString);
    setSearchTerm("");
    setSelectedIndex(0);
  };

  // Handle autocomplete input
  const handleAutocompleteKeyDown = (e: React.KeyboardEvent, dateString: string) => {
    const filteredContacts = getFilteredContacts(dateString);
    
    if (e.key === 'Escape') {
      setActiveDate(null);
      setSearchTerm("");
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredContacts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredContacts.length > 0) {
        handleAddContact(dateString, filteredContacts[selectedIndex]._id);
      }
    }
  };

  // Handle adding contact
  const handleAddContact = async (dateString: string, contactId: Id<"contacts">) => {
    try {
      await addContact({ date: dateString, contactId });
      // Keep the autocomplete active, just clear the search term
      setSearchTerm("");
      setSelectedIndex(0);
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  // Reset autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDate(null);
      setSearchTerm("");
    };
    
    if (activeDate) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDate]);

  // Function to get weather-based background color
  const getWeatherBackgroundColor = (weather: any, temperatureUnit: string): string => {
    if (!weather || weather.error) return 'bg-white dark:bg-gray-800';
    
    const temp = weather.high;
    const condition = weather.condition?.toLowerCase() || '';
    
    // Temperature-based colors (pale theme)
    const tempThreshold = temperatureUnit === 'celsius' ? 
      { hot: 32, warm: 24, cool: 10, cold: 0 } : 
      { hot: 90, warm: 75, cool: 50, cold: 32 };
    
    // Condition-based colors (overrides temperature in some cases)
    if (condition.includes('rain') || condition.includes('shower')) {
      return 'bg-slate-100 dark:bg-slate-800'; // Pale blue-gray for rain
    }
    if (condition.includes('thunderstorm') || condition.includes('storm')) {
      return 'bg-slate-200 dark:bg-slate-700'; // Darker gray for storms
    }
    if (condition.includes('snow') || condition.includes('blizzard')) {
      return 'bg-blue-50 dark:bg-blue-900/30'; // Very pale blue for snow
    }
    if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) {
      return 'bg-gray-100 dark:bg-gray-700'; // Light gray for fog
    }
    if (condition.includes('cloudy')) {
      return 'bg-gray-50 dark:bg-gray-800'; // Very pale gray for clouds
    }
    
    // Temperature-based colors for clear/sunny days
    if (temp >= tempThreshold.hot) {
      return 'bg-red-50 dark:bg-red-900/30'; // Pale red for very hot
    } else if (temp >= tempThreshold.warm) {
      return 'bg-yellow-50 dark:bg-yellow-900/30'; // Pale yellow for warm/sunny
    } else if (temp >= tempThreshold.cool) {
      return 'bg-green-50 dark:bg-green-900/30'; // Pale green for mild
    } else {
      return 'bg-blue-100 dark:bg-blue-900/40'; // Pale blue for cold
    }
  };

  const formatDate = (date: Date) => {
    // Use local timezone to avoid date shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getSessionForDate = (date: string) => {
    return boatSessions.find(session => session.date === date);
  };

  const handleRemoveFromSession = (date: string, contactId: Id<"contacts">) => {
    void removeContact({ date, contactId });
  };

  const parseTimeRange = (input: string): { startTime: string; endTime: string } | null => {
    // Remove extra spaces and convert to lowercase
    const cleaned = input.replace(/\s+/g, '').toLowerCase();
    
    // Try to match patterns like "9am-5pm", "9:30am-5:30pm", etc.
    const match = cleaned.match(/^(\d{1,2})(:(\d{2}))?(am|pm)-(\d{1,2})(:(\d{2}))?(am|pm)$/);
    
    if (!match) return null;
    
    const [, startHour, , startMin = '00', startAmPm, endHour, , endMin = '00', endAmPm] = match;
    
    // Convert 12-hour to 24-hour format
    const convertTo24Hour = (hour: string, minute: string, ampm: string) => {
      let h = parseInt(hour);
      const m = parseInt(minute);
      
      if (ampm === 'am' && h === 12) h = 0;
      else if (ampm === 'pm' && h !== 12) h += 12;
      
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };
    
    return {
      startTime: convertTo24Hour(startHour, startMin, startAmPm),
      endTime: convertTo24Hour(endHour, endMin, endAmPm)
    };
  };

  const formatTimeRange = (startTime: string, endTime: string): string => {
    const formatTime = (time: string) => {
      const [hour, minute] = time.split(':');
      const h = parseInt(hour);
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'am' : 'pm';
      return minute === '00' ? `${displayHour}${ampm}` : `${displayHour}:${minute}${ampm}`;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const handleTimeRangeChange = (date: string, value: string) => {
    const parsed = parseTimeRange(value);
    if (parsed) {
      void updateTime({ date, startTime: parsed.startTime, endTime: parsed.endTime });
    }
  };

  // Weather functionality now handled by Convex backend batch action
  const [weatherData, setWeatherData] = useState<Record<string, any>>({});
  const [weatherLoading, setWeatherLoading] = useState(false);
  const getWeatherBatch = useAction(api.weather.getWeatherBatch);

  // Load weather data for all dates when location or dates change
  useEffect(() => {
    const loadWeatherBatch = async () => {
      if (weatherLoading) return;
      
      const dateStrings = dates.map(formatDate);
      const cacheKey = `${weatherLocation.name}-${temperatureUnit}-${dateStrings[0]}-${dateStrings[dateStrings.length - 1]}`;
      
      // Check if we already have data for this date range
      if (weatherData[cacheKey]) {
        return;
      }
      
      setWeatherLoading(true);
      
      try {
        console.log('Fetching weather batch with:', {
          latitude: weatherLocation.latitude,
          longitude: weatherLocation.longitude,
          locationName: weatherLocation.name,
          dates: dateStrings,
          cacheKey
        });
        
        const batchResults = await getWeatherBatch({
          latitude: weatherLocation.latitude,
          longitude: weatherLocation.longitude,
          locationName: weatherLocation.name,
          dates: dateStrings,
          temperatureUnit: temperatureUnit as 'fahrenheit' | 'celsius'
        });
        
        console.log('Weather batch results received:', batchResults);
        setWeatherData(prev => {
          const newData = { ...prev, [cacheKey]: batchResults };
          console.log('Updated weather data cache:', Object.keys(newData));
          return newData;
        });
      } catch (error) {
        console.error('Weather batch fetch error:', error);
      } finally {
        setWeatherLoading(false);
      }
    };
    
    loadWeatherBatch();
  }, [weatherLocation, dates[0]?.getTime(), dates[dates.length - 1]?.getTime(), temperatureUnit]);

  // Weather component for each day
  const WeatherDisplay = ({ date }: { date: Date }) => {
    const dateString = formatDate(date);
    
    // Find weather data from the batch results
    const dateStrings = dates.map(formatDate);
    const cacheKey = `${weatherLocation.name}-${temperatureUnit}-${dateStrings[0]}-${dateStrings[dateStrings.length - 1]}`;
    const batchData = weatherData[cacheKey];
    const weather = batchData?.[dateString];
    
    // Debug logging
    console.log('WeatherDisplay debug:', {
      dateString,
      cacheKey,
      hasBatchData: !!batchData,
      hasWeather: !!weather,
      weatherLoading,
      allCacheKeys: Object.keys(weatherData)
    });

    if (weatherLoading && !weather) {
      console.log('Showing loading for', dateString);
      return (
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <span>⏳</span>
        </div>
      );
    }

    // Don't show anything if there's no weather data or if it's fallback/error data
    if (!weather || weather.error || weather.condition === 'Data unavailable') {
      console.log('No weather data or error for', dateString, weather?.error || 'no data');
      return null;
    }
    
    console.log('Rendering weather for', dateString, weather);

    return (
      <div className="text-xs text-gray-400 flex items-center gap-1 group">
        <span className="group-hover:animate-spin">{weather.icon}</span>
        <span className="font-medium">{weather.high}°/{weather.low}°</span>
        {weather.error && (
          <span className="text-red-400" title={weather.error}>⚠️</span>
        )}
      </div>
    );
  };
  return (
    <div className="grid grid-cols-7 gap-4">
      {/* Calendar Headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2">
          {day}
        </div>
      ))}
      
      {/* Calendar Days */}
      {dates.map((date) => {
        const dateString = formatDate(date);
        const session = getSessionForDate(dateString);
        const isToday = dateString === formatDate(new Date());
        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        // Get weather data for background color
        const dateStrings = dates.map(formatDate);
        const cacheKey = `${weatherLocation.name}-${temperatureUnit}-${dateStrings[0]}-${dateStrings[dateStrings.length - 1]}`;
        const batchData = weatherData[cacheKey];
        const weather = batchData?.[dateString];
        const weatherBg = getWeatherBackgroundColor(weather, temperatureUnit);
        
        return (
          <div
            key={dateString}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, dateString)}
            onClick={(e) => handleDayClick(dateString, e)}
            className={`min-h-32 p-2 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
              weather ? `${weatherBg} border-blue-200 dark:border-gray-600` :
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
            } hover:border-blue-400 dark:hover:border-gray-500 hover:shadow-lg hover:scale-[1.02] ${
              isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-blue-400 dark:border-gray-500' : ''
            } ${
              activeDate === dateString ? 'ring-2 ring-green-500 dark:ring-green-400 border-green-400 dark:border-gray-500' : ''
            } hover:ring-1 hover:ring-green-300 dark:hover:ring-green-400`}
          >
            
            <div className="flex justify-between items-center mb-2 relative z-10">
              <div className="flex items-center gap-1">
                <span className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
                  {date.getDate()}
                </span>
                {isWeekend && !isPast && <span className="text-xs">🌊</span>}
              </div>
              
              {/* Person count in center */}
              {session && session.contactIds.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs">👤</span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{session.contactIds.length}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {date.getDate() === 1 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                )}
                <WeatherDisplay date={date} />
              </div>
            </div>
            
            {session && session.contactIds.length > 0 && (
              <div className="space-y-2 relative z-10">
                {/* Time Range Input */}
                <div className="text-xs">
                  <input
                    type="text"
                    placeholder="9am - 5pm"
                    defaultValue={session.startTime && session.endTime ? formatTimeRange(session.startTime, session.endTime) : ''}
                    onChange={() => {
                      // Time input formatting handled by parent component
                    }}
                    onBlur={(e) => handleTimeRangeChange(dateString, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTimeRangeChange(dateString, e.currentTarget.value);
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-24 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                {/* Invited Contacts */}
                <div className="space-y-1">
                  {session.contactIds.map((contactId: Id<"contacts">) => {
                    const contact = contacts.find(c => c._id === contactId);
                    if (!contact) return null;
                    return (
                      <div
                        key={contactId}
                        draggable
                        onDragStart={() => onDragStart(contactId, dateString)}
                        className="contact-item flex justify-between items-center bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-lg text-xs group cursor-move hover:from-blue-200 hover:to-cyan-200 dark:hover:from-blue-800/70 dark:hover:to-cyan-800/70 transition-all duration-200 hover:scale-105 shadow-sm border border-blue-200 dark:border-blue-700"
                      >
                        <span className="truncate">{contact.name}</span>
                        <button
                          onClick={() => handleRemoveFromSession(dateString, contactId)}
                          className="opacity-0 group-hover:opacity-100 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {((!session) || (session && session.contactIds.length === 0)) && activeDate !== dateString && (
              <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4 flex flex-col items-center gap-1">
                <div className="text-lg">⛵</div>
                <div>Click to add sailors</div>
              </div>
            )}

            {/* Autocomplete Input */}
            {activeDate === dateString && (
              <div className="relative mt-2" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="Search sailors..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={(e) => handleAutocompleteKeyDown(e, dateString)}
                  className="w-full px-2 py-1 border border-green-300 dark:border-green-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
                
                {/* Autocomplete Dropdown */}
                {searchTerm && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-lg z-10 max-h-32 overflow-y-auto">
                    {getFilteredContacts(dateString).map((contact, index) => (
                      <div
                        key={contact._id}
                        onClick={() => handleAddContact(dateString, contact._id)}
                        className={`px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {contact.name}
                      </div>
                    ))}
                    {getFilteredContacts(dateString).length === 0 && (
                      <div className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500">No sailors found</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}