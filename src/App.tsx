import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useRef, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-blue-600">⛵ Boat Calendar</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex flex-col">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [weatherLocation, setWeatherLocation] = useState(() => {
    return localStorage.getItem('weatherLocation') || 'New York,NY';
  });
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleLocationSave = (newLocation: string) => {
    setWeatherLocation(newLocation);
    localStorage.setItem('weatherLocation', newLocation);
    setShowLocationModal(false);
  };

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
        {/* Header with weather location button */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Weather for {weatherLocation}</h3>
          <button
            onClick={() => setShowLocationModal(true)}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-md text-sm text-blue-700 transition-colors"
          >
            Change Location
          </button>
        </div>
        
        {/* Location Modal */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Set Weather Location</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const location = formData.get('location') as string;
                if (location.trim()) {
                  handleLocationSave(location.trim());
                }
              }}>
                <input
                  name="location"
                  type="text"
                  defaultValue={weatherLocation}
                  placeholder="City, State (e.g., Miami, FL)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        <BoatCalendar weatherLocation={weatherLocation} />
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

function BoatCalendar({ weatherLocation }: { weatherLocation: string }) {
  const contacts = useQuery(api.contacts.list) || [];
  const boatSessions = useQuery(api.boatSessions.list) || [];
  const addContact = useMutation(api.boatSessions.addContact);
  const removeContact = useMutation(api.boatSessions.removeContact);
  const updateTime = useMutation(api.boatSessions.updateTime);
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const deleteContact = useMutation(api.contacts.remove);

  const [draggedContact, setDraggedContact] = useState<Id<"contacts"> | null>(null);
  const [draggedFromDate, setDraggedFromDate] = useState<string | null>(null);
  const [newContactForm, setNewContactForm] = useState({ name: "", email: "", phone: "" });
  const [editingContact, setEditingContact] = useState<Id<"contacts"> | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [weatherData, setWeatherData] = useState<Record<string, any>>({});
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

  const handleRemoveFromSession = (date: string, contactId: Id<"contacts">) => {
    void removeContact({ date, contactId });
  };

  const handleTimeChange = (date: string, field: 'startTime' | 'endTime', value: string) => {
    const session = getSessionForDate(date);
    const startTime = field === 'startTime' ? value : (session?.startTime || '09:00');
    const endTime = field === 'endTime' ? value : (session?.endTime || '17:00');
    void updateTime({ date, startTime, endTime });
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

  const handleTimeInputChange = (dateString: string, value: string, cursorPosition: number) => {
    // Define the expected pattern: "h:mm am - h:mm pm" or "hh:mm am - hh:mm pm"
    // We'll format as user types and enforce valid characters
    
    let formatted = '';
    let validChars = '';
    
    // Remove spaces and dashes, keep only alphanumeric
    const cleanInput = value.replace(/[^0-9apm]/g, '').toLowerCase();
    
    // Build the formatted string character by character
    let pos = 0;
    const maxLength = cleanInput.length;
    
    // First time (start time)
    if (pos < maxLength) {
      // First digit of hour (1-9 or 1)
      const firstDigit = cleanInput[pos];
      if (/[1-9]/.test(firstDigit)) {
        formatted += firstDigit;
        validChars += firstDigit;
        pos++;
        
        // Check if we need a second digit for hour
        if (pos < maxLength && /[0-9]/.test(cleanInput[pos])) {
          const secondDigit = cleanInput[pos];
          const hourValue = parseInt(firstDigit + secondDigit);
          if (hourValue <= 12) {
            formatted += secondDigit;
            validChars += secondDigit;
            pos++;
          }
        }
        
        // Add colon if we have minutes
        if (pos < maxLength && /[0-5]/.test(cleanInput[pos])) {
          formatted += ':';
          // First minute digit (0-5)
          formatted += cleanInput[pos];
          validChars += cleanInput[pos];
          pos++;
          
          // Second minute digit (0-9)
          if (pos < maxLength && /[0-9]/.test(cleanInput[pos])) {
            formatted += cleanInput[pos];
            validChars += cleanInput[pos];
            pos++;
          } else {
            formatted += '0';
          }
        }
        
        // Add AM/PM
        if (pos < maxLength) {
          if (cleanInput.substring(pos, pos + 2) === 'am') {
            formatted += 'am';
            validChars += 'am';
            pos += 2;
          } else if (cleanInput.substring(pos, pos + 2) === 'pm') {
            formatted += 'pm';
            validChars += 'pm';
            pos += 2;
          } else if (cleanInput[pos] === 'a') {
            formatted += 'a';
            validChars += 'a';
            pos++;
          } else if (cleanInput[pos] === 'p') {
            formatted += 'p';
            validChars += 'p';
            pos++;
          }
        }
        
        // Add separator
        if (pos < maxLength) {
          formatted += ' - ';
        }
        
        // Second time (end time) - similar logic
        if (pos < maxLength) {
          const firstDigit = cleanInput[pos];
          if (/[1-9]/.test(firstDigit)) {
            formatted += firstDigit;
            validChars += firstDigit;
            pos++;
            
            if (pos < maxLength && /[0-9]/.test(cleanInput[pos])) {
              const secondDigit = cleanInput[pos];
              const hourValue = parseInt(firstDigit + secondDigit);
              if (hourValue <= 12) {
                formatted += secondDigit;
                validChars += secondDigit;
                pos++;
              }
            }
            
            if (pos < maxLength && /[0-5]/.test(cleanInput[pos])) {
              formatted += ':';
              formatted += cleanInput[pos];
              validChars += cleanInput[pos];
              pos++;
              
              if (pos < maxLength && /[0-9]/.test(cleanInput[pos])) {
                formatted += cleanInput[pos];
                validChars += cleanInput[pos];
                pos++;
              } else {
                formatted += '0';
              }
            }
            
            if (pos < maxLength) {
              if (cleanInput.substring(pos, pos + 2) === 'am') {
                formatted += 'am';
                validChars += 'am';
                pos += 2;
              } else if (cleanInput.substring(pos, pos + 2) === 'pm') {
                formatted += 'pm';
                validChars += 'pm';
                pos += 2;
              } else if (cleanInput[pos] === 'a') {
                formatted += 'a';
                validChars += 'a';
                pos++;
              } else if (cleanInput[pos] === 'p') {
                formatted += 'p';
                validChars += 'p';
                pos++;
              }
            }
          }
        }
      }
    }
    
    return formatted;
  };

  const handleTimeRangeChange = (date: string, value: string) => {
    const parsed = parseTimeRange(value);
    if (parsed) {
      void updateTime({ date, startTime: parsed.startTime, endTime: parsed.endTime });
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContactForm.name.trim()) {
      void createContact({ 
        name: newContactForm.name.trim(),
        email: newContactForm.email.trim() || undefined,
        phone: newContactForm.phone.trim() || undefined
      });
      setNewContactForm({ name: "", email: "", phone: "" });
    }
  };

  const handleEditContact = (contact: { _id: Id<"contacts">; name: string; email?: string; phone?: string }) => {
    setEditingContact(contact._id);
    setEditForm({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || ""
    });
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact && editForm.name.trim()) {
      void updateContact({
        id: editingContact,
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined
      });
      setEditingContact(null);
      setEditForm({ name: "", email: "", phone: "" });
    }
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setEditForm({ name: "", email: "", phone: "" });
  };


  const fetchWeather = async (location: string, date: string) => {
    // Use OpenWeatherMap free API (requires API key)
    // For demo purposes, I'll create a mock weather function
    // In production, you'd sign up for an API key at openweathermap.org
    
    const cacheKey = `${location}-${date}`;
    if (weatherData[cacheKey]) {
      return weatherData[cacheKey];
    }

    try {
      // Mock weather data for demonstration
      // Replace this with actual API call to OpenWeatherMap
      const baseTemp = Math.round(Math.random() * 25 + 65); // 65-90°F for high
      const mockWeather = {
        high: baseTemp,
        low: baseTemp - Math.round(Math.random() * 15 + 10), // 10-25°F lower than high
        condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
        icon: ['☀️', '☁️', '🌧️', '⛅'][Math.floor(Math.random() * 4)]
      };
      
      setWeatherData(prev => ({ ...prev, [cacheKey]: mockWeather }));
      return mockWeather;
    } catch (error) {
      console.error('Weather fetch error:', error);
      return null;
    }
  };

  // Weather component for each day
  const WeatherDisplay = ({ date }: { date: Date }) => {
    const dateString = formatDate(date);
    const [weather, setWeather] = useState<any>(null);

    useEffect(() => {
      const loadWeather = async () => {
        const weatherInfo = await fetchWeather(weatherLocation, dateString);
        setWeather(weatherInfo);
      };
      loadWeather();
    }, [dateString, weatherLocation]);

    if (!weather) return null;

    return (
      <div className="text-xs text-gray-400 flex items-center gap-1">
        <span>{weather.icon}</span>
        <span>{weather.high}°/{weather.low}°</span>
      </div>
    );
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
      {/* Contacts Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Contacts</h3>
        {/* Add Contact Form */}
        <form onSubmit={handleAddContact} className="mb-4">
          <div className="space-y-2">
            <input
              type="text"
              value={newContactForm.name}
              onChange={(e) => setNewContactForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contact name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              value={newContactForm.email}
              onChange={(e) => setNewContactForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              value={newContactForm.phone}
              onChange={(e) => setNewContactForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Add Contact
            </button>
          </div>
        </form>
        {/* Contacts List */}
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div key={contact._id}>
              {editingContact === contact._id ? (
                <form onSubmit={handleSaveContact} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Name"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email (optional)"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone (optional)"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div
                  draggable
                  onDragStart={() => handleDragStart(contact._id)}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0" onClick={() => handleEditContact(contact)}>
                      <div className="font-medium text-gray-900 cursor-pointer hover:text-blue-600">
                        {contact.name}
                      </div>
                      {contact.email && (
                        <div className="text-sm text-gray-500 truncate cursor-pointer hover:text-blue-600">
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="text-sm text-gray-500 cursor-pointer hover:text-blue-600">
                          {contact.phone}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { void deleteContact({ id: contact._id }); }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all ml-2 flex-shrink-0"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Calendar */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Navigation and Month Label */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrev} className="px-2 py-1 rounded hover:bg-gray-200 text-lg" aria-label="Previous 4 weeks">←</button>
          <span className="font-semibold text-gray-700">{monthLabel()}</span>
          <button onClick={handleNext} className="px-2 py-1 rounded hover:bg-gray-200 text-lg" aria-label="Next 4 weeks">→</button>
        </div>
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
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dateString)}
                className={`min-h-32 p-2 border-2 border-dashed border-gray-200 rounded-lg transition-colors ${
                  isPast ? 'bg-gray-50' : 'bg-white'
                } hover:border-blue-300 ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>{date.getDate()}</span>
                  <div className="flex items-center gap-2">
                    {date.getDate() === 1 && (
                      <span className="text-xs text-gray-400">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
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
                        defaultValue={formatTimeRange(session.startTime, session.endTime)}
                        onChange={(e) => {
                          const formatted = handleTimeInputChange(dateString, e.target.value, e.target.selectionStart || 0);
                          e.target.value = formatted;
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
                      {session.contactIds.map((contactId) => {
                        const contact = contacts.find(c => c._id === contactId);
                        if (!contact) return null;
                        return (
                          <div
                            key={contactId}
                            draggable
                            onDragStart={() => handleDragStart(contactId, dateString)}
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
      </div>
    </div>
  );
}
