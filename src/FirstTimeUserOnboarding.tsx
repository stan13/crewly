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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-[500px] max-w-90vw">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⛵</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Welcome to Crewly!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Let's get you started by creating your first boat. You'll be able to invite crew members, 
            manage schedules, and track your maritime adventures.
          </p>
        </div>

        <form onSubmit={handleCreateBoat} className="mb-6">
          <div className="mb-4">
            <label htmlFor="boatName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What's your boat called?
            </label>
            <input
              type="text"
              id="boatName"
              value={boatName}
              onChange={(e) => setBoatName(e.target.value)}
              placeholder="e.g., Sea Dream, Nautical Nonsense, The Salty Sailor..."
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={creating || !boatName.trim()}
            className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {creating ? "Creating your boat..." : "🚤 Create My Boat"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            I'll do this later
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-xl">💡</div>
              <div>
                <div className="font-medium text-blue-800 dark:text-blue-200 text-sm mb-1">
                  Pro tip: Already invited to a boat?
                </div>
                <div className="text-blue-700 dark:text-blue-300 text-sm">
                  If someone already invited you to their boat, you should see a notification badge on the boat dropdown above. 
                  Click there to accept their invitation instead!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}