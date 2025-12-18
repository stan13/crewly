import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { CrewConfirmation } from "./CrewConfirmation";

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
    const addedContactIds = session?.crew?.map((c: any) => c.contactId) || [];

    return contacts
      .filter(contact =>
        !addedContactIds.includes(contact._id) &&
        contact.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5);
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

    // Temperature thresholds
    const tempThreshold = temperatureUnit === 'celsius' ?
      { hot: 32, warm: 24, cool: 10, cold: 0 } :
      { hot: 90, warm: 75, cool: 50, cold: 32 };

    // Condition-based colors (overrides temperature)
    if (condition.includes('rain') || condition.includes('shower')) {
      return 'bg-slate-50 dark:bg-slate-800/50';
    }
    if (condition.includes('thunderstorm') || condition.includes('storm')) {
      return 'bg-slate-100 dark:bg-slate-800';
    }
    if (condition.includes('snow') || condition.includes('blizzard')) {
      return 'bg-blue-50/50 dark:bg-blue-900/20';
    }
    if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) {
      return 'bg-gray-50 dark:bg-gray-800';
    }
    if (condition.includes('cloudy')) {
      return 'bg-gray-50/50 dark:bg-gray-800';
    }

    // Temperature-based colors for clear/sunny days
    if (temp >= tempThreshold.hot) {
      return 'bg-amber-50/60 dark:bg-amber-900/20';
    } else if (temp >= tempThreshold.warm) {
      return 'bg-yellow-50/50 dark:bg-yellow-900/20';
    } else if (temp >= tempThreshold.cool) {
      return 'bg-emerald-50/50 dark:bg-emerald-900/20';
    } else {
      return 'bg-sky-50/50 dark:bg-sky-900/20';
    }
  };

  const formatDate = (date: Date) => {
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
    const cleaned = input.replace(/\s+/g, '').toLowerCase();
    const match = cleaned.match(/^(\d{1,2})(:(\d{2}))?(am|pm)-(\d{1,2})(:(\d{2}))?(am|pm)$/);

    if (!match) return null;

    const [, startHour, , startMin = '00', startAmPm, endHour, , endMin = '00', endAmPm] = match;

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

  // Weather functionality
  const [weatherData, setWeatherData] = useState<Record<string, any>>({});
  const [weatherLoading, setWeatherLoading] = useState(false);
  const getWeatherBatch = useAction(api.weather.getWeatherBatch);

  useEffect(() => {
    const loadWeatherBatch = async () => {
      if (weatherLoading) return;

      const dateStrings = dates.map(formatDate);
      const cacheKey = `${weatherLocation.name}-${temperatureUnit}-${dateStrings[0]}-${dateStrings[dateStrings.length - 1]}`;

      if (weatherData[cacheKey]) {
        return;
      }

      setWeatherLoading(true);

      try {
        const batchResults = await getWeatherBatch({
          latitude: weatherLocation.latitude,
          longitude: weatherLocation.longitude,
          locationName: weatherLocation.name,
          dates: dateStrings,
          temperatureUnit: temperatureUnit as 'fahrenheit' | 'celsius'
        });

        setWeatherData(prev => ({ ...prev, [cacheKey]: batchResults }));
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
    const dateStrings = dates.map(formatDate);
    const cacheKey = `${weatherLocation.name}-${temperatureUnit}-${dateStrings[0]}-${dateStrings[dateStrings.length - 1]}`;
    const batchData = weatherData[cacheKey];
    const weather = batchData?.[dateString];

    if (weatherLoading && !weather) {
      return (
        <div className="text-xs text-gray-300 dark:text-gray-600">
          <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin"></div>
        </div>
      );
    }

    if (!weather || weather.error || weather.condition === 'Data unavailable') {
      return null;
    }

    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <span className="text-sm">{weather.icon}</span>
        <span className="font-medium tabular-nums">{weather.high}°</span>
        <span className="text-gray-400 dark:text-gray-500">/</span>
        <span className="tabular-nums">{weather.low}°</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-7 gap-3">
      {/* Calendar Headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
        <div
          key={day}
          className={`text-center text-sm font-medium py-3 rounded-lg ${
            index === 0 || index === 6
              ? 'text-ocean-600 dark:text-ocean-400 bg-ocean-50/50 dark:bg-ocean-900/20'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
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
            className={`min-h-36 p-3 rounded-xl border transition-all duration-200 cursor-pointer group ${
              weather
                ? `${weatherBg} border-gray-100 dark:border-gray-700/50`
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/50'
            } ${
              isToday
                ? 'ring-2 ring-ocean-400 dark:ring-ocean-500 border-ocean-200 dark:border-ocean-800 shadow-md shadow-ocean-100 dark:shadow-ocean-900/20'
                : 'hover:border-ocean-200 dark:hover:border-ocean-800 hover:shadow-md'
            } ${
              activeDate === dateString
                ? 'ring-2 ring-emerald-400 dark:ring-emerald-500 border-emerald-200 dark:border-emerald-800'
                : ''
            } ${
              isPast && !isToday ? 'opacity-60' : ''
            }`}
          >
            {/* Header row */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  isToday
                    ? 'text-ocean-600 dark:text-ocean-400'
                    : isWeekend
                      ? 'text-gray-700 dark:text-gray-200'
                      : 'text-gray-800 dark:text-gray-200'
                }`}>
                  {date.getDate()}
                </span>
                {date.getDate() === 1 && (
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Crew count badge */}
                {session && session.crew.length > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700">
                    <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {session.crew.filter((m: any) => m.status === 'confirmed').length}/{session.crew.length}
                    </span>
                  </div>
                )}
                <WeatherDisplay date={date} />
              </div>
            </div>

            {session && session.crew.length > 0 && (
              <div className="space-y-2">
                {/* Time Range Input */}
                <input
                  type="text"
                  placeholder={isWeekend ? "12pm - 6pm" : "5pm - 8pm"}
                  defaultValue={session.startTime && session.endTime ? formatTimeRange(session.startTime, session.endTime) : ''}
                  onBlur={(e) => handleTimeRangeChange(dateString, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTimeRangeChange(dateString, e.currentTarget.value);
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full px-2 py-1 text-xs text-center rounded-md
                    bg-white/60 dark:bg-gray-700/60
                    border border-gray-200/50 dark:border-gray-600/50
                    focus:border-ocean-300 dark:focus:border-ocean-600
                    focus:ring-1 focus:ring-ocean-200 dark:focus:ring-ocean-800
                    text-gray-700 dark:text-gray-300
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    transition-colors"
                />

                {/* Crew Members */}
                <div className="space-y-1">
                  {session.crew.map((crewMember: any) => {
                    const crewMemberWithContact = {
                      ...crewMember,
                      contact: contacts.find(c => c._id === crewMember.contactId) || null
                    };
                    return (
                      <CrewConfirmation
                        key={crewMember.contactId}
                        date={dateString}
                        crewMember={crewMemberWithContact}
                        onDragStart={onDragStart}
                        onRemove={handleRemoveFromSession}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {(!session || session.crew.length === 0) && activeDate !== dateString && (
              <div className="flex flex-col items-center justify-center h-16 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors">
                <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">Add crew</span>
              </div>
            )}

            {/* Autocomplete Input */}
            {activeDate === dateString && (
              <div className="relative mt-2" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="Search crew..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={(e) => handleAutocompleteKeyDown(e, dateString)}
                  className="w-full px-2.5 py-1.5 text-sm rounded-lg
                    bg-white dark:bg-gray-700
                    border border-emerald-300 dark:border-emerald-600
                    focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800
                    text-gray-900 dark:text-gray-100
                    placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  autoFocus
                />

                {/* Autocomplete Dropdown */}
                {(searchTerm || getFilteredContacts(dateString).length > 0) && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                    {getFilteredContacts(dateString).map((contact, index) => (
                      <div
                        key={contact._id}
                        onClick={() => handleAddContact(dateString, contact._id)}
                        className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 ${
                          index === selectedIndex
                            ? 'bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white text-xs font-medium">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        {contact.name}
                      </div>
                    ))}
                    {getFilteredContacts(dateString).length === 0 && searchTerm && (
                      <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No crew found</div>
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
