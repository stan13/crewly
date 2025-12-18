import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

interface FirstTimeUserOnboardingProps {
  onClose: () => void;
}

export function FirstTimeUserOnboarding({ onClose }: FirstTimeUserOnboardingProps) {
  const [boatName, setBoatName] = useState("");
  const [creating, setCreating] = useState(false);
  const createBoat = useMutation(api.boats.createBoat);

  const handleCreateBoat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boatName.trim()) return;

    setCreating(true);
    try {
      await createBoat({ name: boatName.trim() });
      onClose();
    } catch (error) {
      console.error("Failed to create boat:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-8 w-[480px] max-w-[90vw]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-400 to-ocean-600 shadow-lg shadow-ocean-500/25 mb-5">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v2.76a3 3 0 01-.88 2.12L9 21" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 3l-6 6m0-6l6 6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to Crewly
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Let's get started by creating your first boat. You'll be able to invite crew members and manage schedules.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateBoat} className="mb-6">
          <div className="mb-5">
            <label htmlFor="boatName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What's your boat called?
            </label>
            <input
              type="text"
              id="boatName"
              value={boatName}
              onChange={(e) => setBoatName(e.target.value)}
              placeholder="e.g., Sea Dream, Wind Dancer..."
              className="input-field"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={creating || !boatName.trim()}
            className="btn-primary w-full"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating your boat...
              </span>
            ) : (
              "Create My Boat"
            )}
          </button>
        </form>

        {/* Skip option */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            I'll do this later
          </button>
        </div>

        {/* Info box */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-ocean-50 dark:bg-ocean-900/20 border border-ocean-100 dark:border-ocean-800/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-ocean-100 dark:bg-ocean-900/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-ocean-600 dark:text-ocean-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-ocean-800 dark:text-ocean-200 text-sm mb-1">
                Already invited to a boat?
              </p>
              <p className="text-ocean-700 dark:text-ocean-300 text-sm">
                Check the boat dropdown in the header for pending invitations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
