import { useState, useRef, useEffect } from "react";

interface ContactFormProps {
  formData: { name: string; email: string; phone: string };
  onChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ContactForm({ 
  formData, 
  onChange, 
  onSubmit 
}: ContactFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [nameIsFocused, setNameIsFocused] = useState(false);
  const extraFieldsRef = useRef<HTMLDivElement>(null);
  
  // Close additional fields when form is reset (after successful submission)
  useEffect(() => {
    // If all fields are empty, it means the form was just reset after submission
    if (!formData.name.trim() && !formData.email.trim() && !formData.phone.trim()) {
      setIsExpanded(false);
      setNameIsFocused(false);
    }
  }, [formData.name, formData.email, formData.phone]);
  
  // Auto-expand if there's data in any field (including name) or email/phone fields
  const hasNameData = formData.name.trim();
  const hasExtraData = formData.email.trim() || formData.phone.trim();
  const hasAnyData = hasNameData || hasExtraData;
  const shouldShowExtra = isExpanded || nameIsFocused || hasAnyData;
  
  const handleNameFocus = () => {
    setNameIsFocused(true);
    setIsExpanded(true);
  };
  
  const handleNameBlur = () => {
    setNameIsFocused(false);
    // Only collapse if there's no data in ANY field
    if (!hasAnyData) {
      setIsExpanded(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
    // The fields will collapse automatically via the useEffect when formData is cleared
  };
  
  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="space-y-2">
        {/* Name input with integrated submit button */}
        <div className="relative">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            onFocus={handleNameFocus}
            onBlur={handleNameBlur}
            placeholder="Contact name..."
            className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!formData.name.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l8 8-8 8M4 12h16" />
            </svg>
          </button>
        </div>
        
        {/* Collapsible extra fields */}
        <div 
          ref={extraFieldsRef}
          className={`transition-all duration-300 ease-in-out ${
            shouldShowExtra ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="space-y-2 pt-2 px-1">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="Email (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="Phone (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </form>
  );
}