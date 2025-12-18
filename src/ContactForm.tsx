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
    if (!formData.name.trim() && !formData.email.trim() && !formData.phone.trim()) {
      setIsExpanded(false);
      setNameIsFocused(false);
    }
  }, [formData.name, formData.email, formData.phone]);

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
    if (!hasAnyData) {
      setIsExpanded(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-2">
        {/* Name input with integrated submit button */}
        <div className="relative">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            onFocus={handleNameFocus}
            onBlur={handleNameBlur}
            placeholder="Add crew member..."
            className="w-full px-3 py-2.5 pr-12 rounded-lg text-sm
              bg-gray-50 dark:bg-gray-700
              border border-gray-200 dark:border-gray-600
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              focus:outline-none focus:ring-2 focus:ring-ocean-400/30 dark:focus:ring-ocean-500/30
              focus:border-ocean-400 dark:focus:border-ocean-500
              focus:bg-white dark:focus:bg-gray-600
              transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!formData.name.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5
              bg-ocean-500 hover:bg-ocean-600 text-white rounded-md
              disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
              transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
          <div className="space-y-2 pt-1">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="Email (optional)"
              className="w-full px-3 py-2 rounded-lg text-sm
                bg-gray-50 dark:bg-gray-700
                border border-gray-200 dark:border-gray-600
                text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                focus:outline-none focus:ring-2 focus:ring-ocean-400/30 dark:focus:ring-ocean-500/30
                focus:border-ocean-400 dark:focus:border-ocean-500
                focus:bg-white dark:focus:bg-gray-600
                transition-all duration-200"
            />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="Phone (optional)"
              className="w-full px-3 py-2 rounded-lg text-sm
                bg-gray-50 dark:bg-gray-700
                border border-gray-200 dark:border-gray-600
                text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                focus:outline-none focus:ring-2 focus:ring-ocean-400/30 dark:focus:ring-ocean-500/30
                focus:border-ocean-400 dark:focus:border-ocean-500
                focus:bg-white dark:focus:bg-gray-600
                transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
