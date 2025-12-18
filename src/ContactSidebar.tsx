import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { ContactForm } from "./ContactForm";

interface Contact {
  _id: Id<"contacts">;
  name: string;
  email?: string;
  phone?: string;
}

interface ContactSidebarProps {
  onDragStart: (contactId: Id<"contacts">, fromDate?: string) => void;
}

export function ContactSidebar({ onDragStart }: ContactSidebarProps) {
  const contacts = useQuery(api.contacts.list) || [];
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const deleteContact = useMutation(api.contacts.remove);

  const [newContactForm, setNewContactForm] = useState({ name: "", email: "", phone: "" });
  const [editingContact, setEditingContact] = useState<Id<"contacts"> | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });

  const handleContactFormChange = (field: string, value: string) => {
    setNewContactForm(prev => ({ ...prev, [field]: value }));
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

  const handleEditContact = (contact: Contact) => {
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

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteContact = (id: Id<"contacts">) => {
    void deleteContact({ id });
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-ocean-600 dark:text-ocean-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Crew Members</h3>
          </div>
          <span className="badge-primary">
            {contacts.length}
          </span>
        </div>
      </div>

      {/* Add Contact Form */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <ContactForm
          formData={newContactForm}
          onChange={handleContactFormChange}
          onSubmit={handleAddContact}
        />
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {contacts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No crew members yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add someone to get started</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact._id}>
              {editingContact === contact._id ? (
                <form onSubmit={handleSaveContact} className="p-3 bg-ocean-50 dark:bg-gray-700 rounded-xl border border-ocean-200 dark:border-gray-600">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleEditFormChange('name', e.target.value)}
                      placeholder="Name"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/30 dark:focus:ring-ocean-500/30 text-gray-900 dark:text-gray-100"
                      autoFocus
                    />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleEditFormChange('email', e.target.value)}
                      placeholder="Email (optional)"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/30 dark:focus:ring-ocean-500/30 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => handleEditFormChange('phone', e.target.value)}
                      placeholder="Phone (optional)"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/30 dark:focus:ring-ocean-500/30 text-gray-900 dark:text-gray-100"
                    />
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-ocean-500 hover:bg-ocean-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div
                  draggable
                  onDragStart={() => onDragStart(contact._id)}
                  className="group p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 cursor-grab
                    hover:bg-white dark:hover:bg-gray-700 hover:border-ocean-200 dark:hover:border-ocean-800 hover:shadow-md
                    active:cursor-grabbing active:shadow-lg active:scale-[1.02]
                    transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1 min-w-0" onClick={() => handleEditContact(contact)}>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 cursor-pointer">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
                          {contact.name}
                        </div>
                        {contact.email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact._id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ml-2 flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Drag hint */}
      {contacts.length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Drag to add to calendar
          </p>
        </div>
      )}
    </div>
  );
}
