import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface PendingInvitesWelcomeProps {
  pendingInvites: Array<{
    _id: Id<"boatInvites">;
    boat?: { name: string } | null;
    inviter?: { name?: string; email?: string } | null;
    email: string;
    status: string;
  }>;
  onClose: () => void;
}

export function PendingInvitesWelcome({ pendingInvites, onClose }: PendingInvitesWelcomeProps) {
  const acceptInvite = useMutation(api.boats.acceptBoatInvite);
  const declineInvite = useMutation(api.boats.declineBoatInvite);

  const handleAcceptInvite = async (inviteId: Id<"boatInvites">) => {
    try {
      await acceptInvite({ inviteId });
    } catch (error) {
      console.error("Failed to accept invite:", error);
    }
  };

  const handleDeclineInvite = async (inviteId: Id<"boatInvites">) => {
    try {
      await declineInvite({ inviteId });
    } catch (error) {
      console.error("Failed to decline invite:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-[500px] max-w-90vw">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Welcome to Crewly!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Great news! You've been invited to join {pendingInvites.length === 1 ? 'a boat crew' : 'some boat crews'}. 
            Accept the invitation{pendingInvites.length > 1 ? 's' : ''} below to get started.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {pendingInvites.map((invite) => (
            <div
              key={invite._id}
              className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg"
            >
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  🚤 {invite.boat?.name || 'Boat'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Invited by {invite.inviter?.name || invite.inviter?.email || 'someone'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptInvite(invite._id)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDeclineInvite(invite._id)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            I'll decide later
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-xl">⚓</div>
              <div>
                <div className="font-medium text-green-800 dark:text-green-200 text-sm mb-1">
                  What happens when you accept?
                </div>
                <div className="text-green-700 dark:text-green-300 text-sm">
                  You'll become a crew member and can help manage the boat's schedule, 
                  add contacts, and coordinate with other crew members.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}