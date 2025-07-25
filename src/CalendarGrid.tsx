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
      <div className="text-xs text-gray-400 flex items-center gap-1">
        <span>{weather.icon}</span>
        <span>{weather.high}°/{weather.low}°</span>
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
        <div key={day} className="text-center font-semibold text-gray-600 py-2">
          {day}
        </div>
      ))}
      
      {/* Calendar Days */}
      {dates.map((date) => {
        const dateString = formatDate(date);
        const session = getSessionForDate(dateString);
        const isToday = dateString === formatDate(new Date());
        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
        
        return (
          <div
            key={dateString}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, dateString)}
            className={`min-h-32 p-2 border-2 border-dashed border-gray-200 rounded-lg transition-colors ${
              isPast ? 'bg-gray-50' : 'bg-white'
            } hover:border-blue-300 ${isToday ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                {date.getDate()}
              </span>
              <div className="flex items-center gap-2">
                {date.getDate() === 1 && (
                  <span className="text-xs text-gray-400">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                )}
                <WeatherDisplay date={date} />
              </div>
            </div>
            
            {session && session.contactIds.length > 0 && (
              <div className="space-y-2">
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
                    className="w-24 px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
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
                        className="flex justify-between items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs group cursor-move hover:bg-blue-200 transition-colors"
                      >
                        <span className="truncate">{contact.name}</span>
                        <button
                          onClick={() => handleRemoveFromSession(dateString, contactId)}
                          className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {((!session) || (session && session.contactIds.length === 0)) && (
              <div className="text-xs text-gray-400 text-center mt-4">
                Drop contacts here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}