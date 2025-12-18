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
    <div className="modal-overlay">
      <div className="modal-content p-8 w-[500px] max-w-[90vw]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-400 to-ocean-600 shadow-lg shadow-ocean-500/25 mb-5">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to <span className="text-gradient">Crewly</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            You've been invited to join {pendingInvites.length === 1 ? 'a boat crew' : 'some boat crews'}.
            Accept below to get started.
          </p>
        </div>

        {/* Invitations */}
        <div className="space-y-3 mb-6">
          {pendingInvites.map((invite) => (
            <div
              key={invite._id}
              className="flex items-center justify-between p-4 bg-ocean-50 dark:bg-ocean-900/20 border border-ocean-200 dark:border-ocean-800/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-ocean-600 dark:text-ocean-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 012 2v2.76a3 3 0 01-.88 2.12L9 21" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {invite.boat?.name || 'Boat'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    From {invite.inviter?.name || invite.inviter?.email || 'someone'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptInvite(invite._id)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDeclineInvite(invite._id)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Skip option */}
        <div className="text-center mb-6">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            I'll decide later
          </button>
        </div>

        {/* Info box */}
        <div className="pt-5 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200 text-sm mb-1">
                What happens when you accept?
              </p>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                You'll join the crew and can help manage schedules and coordinate with other members.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
