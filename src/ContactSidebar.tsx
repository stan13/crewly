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
    <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Contacts</h3>
      
      <ContactForm
        formData={newContactForm}
        onChange={handleContactFormChange}
        onSubmit={handleAddContact}
      />
      
      <div className="space-y-2">
        {contacts.map((contact) => (
          <div key={contact._id}>
            {editingContact === contact._id ? (
              <form onSubmit={handleSaveContact} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    placeholder="Name"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => handleEditFormChange('phone', e.target.value)}
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
                onDragStart={() => onDragStart(contact._id)}
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
                    onClick={() => handleDeleteContact(contact._id)}
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
  );
}