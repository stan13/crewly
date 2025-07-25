import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useRef } from "react";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-blue-600">⛵ Boat Calendar</h2>
        <SignOutButton />
      </header>
      <main className="flex-1">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Authenticated>
        <BoatCalendar />
      </Authenticated>
      <Unauthenticated>
        <div className="flex items-center justify-center h-96">
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

function BoatCalendar() {
  const contacts = useQuery(api.contacts.list) || [];
  const boatSessions = useQuery(api.boatSessions.list) || [];
  const addContact = useMutation(api.boatSessions.addContact);
  const removeContact = useMutation(api.boatSessions.removeContact);
  const updateTime = useMutation(api.boatSessions.updateTime);
  const createContact = useMutation(api.contacts.create);
  const deleteContact = useMutation(api.contacts.remove);

  const [draggedContact, setDraggedContact] = useState<Id<"contacts"> | null>(null);
  const [newContactName, setNewContactName] = useState("");

  // Generate calendar dates (current month + next month)
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const dates = [];
  for (let month = 0; month < 2; month++) {
    const targetMonth = (currentMonth + month) % 12;
    const targetYear = targetMonth < currentMonth ? currentYear + 1 : currentYear;
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(targetYear, targetMonth, day);
      dates.push(date);
    }
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getSessionForDate = (date: string) => {
    return boatSessions.find(session => session.date === date);
  };

  const handleDragStart = (contactId: Id<"contacts">) => {
    setDraggedContact(contactId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    if (draggedContact) {
      addContact({ date, contactId: draggedContact });
      setDraggedContact(null);
    }
  };

  const handleRemoveFromSession = (date: string, contactId: Id<"contacts">) => {
    removeContact({ date, contactId });
  };

  const handleTimeChange = (date: string, field: 'startTime' | 'endTime', value: string) => {
    const session = getSessionForDate(date);
    const startTime = field === 'startTime' ? value : (session?.startTime || '09:00');
    const endTime = field === 'endTime' ? value : (session?.endTime || '17:00');
    updateTime({ date, startTime, endTime });
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContactName.trim()) {
      createContact({ name: newContactName.trim() });
      setNewContactName("");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Contacts Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Contacts</h3>
        
        {/* Add Contact Form */}
        <form onSubmit={handleAddContact} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Add new contact..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </form>

        {/* Contacts List */}
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact._id}
              draggable
              onDragStart={() => handleDragStart(contact._id)}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">{contact.name}</div>
                  {contact.email && (
                    <div className="text-sm text-gray-500">{contact.email}</div>
                  )}
                </div>
                <button
                  onClick={() => deleteContact({ id: contact._id })}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-4 overflow-y-auto">
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
                  isPast ? 'bg-gray-50 opacity-50' : 'bg-white hover:border-blue-300'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                    {date.getDate()}
                  </span>
                  {date.getDate() === 1 && (
                    <span className="text-xs text-gray-400">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  )}
                </div>

                {session && (
                  <div className="space-y-2">
                    {/* Time Inputs */}
                    <div className="flex gap-1 text-xs">
                      <input
                        type="time"
                        value={session.startTime}
                        onChange={(e) => handleTimeChange(dateString, 'startTime', e.target.value)}
                        className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={session.endTime}
                        onChange={(e) => handleTimeChange(dateString, 'endTime', e.target.value)}
                        className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                            className="flex justify-between items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs group"
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

                {!session && !isPast && (
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
