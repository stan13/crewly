import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface BoatSettingsProps {
  isOpen: boolean;
  boatId: Id<"boats"> | null;
  onClose: () => void;
}

export function BoatSettings({ isOpen, boatId, onClose }: BoatSettingsProps) {
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [confirmDeleteBoat, setConfirmDeleteBoat] = useState(false);
  const [removingMember, setRemovingMember] = useState<Id<"boatMembers"> | null>(null);

  const currentUser = useQuery(api.auth.loggedInUser);
  const boatMembers = useQuery(api.boats.getBoatMembers, boatId ? { boatId } : "skip");
  const pendingInvites = useQuery(api.boats.getPendingInvites);
  const outgoingInvites = useQuery(api.boats.getOutgoingInvites, boatId ? { boatId } : "skip");
  const inviteUser = useMutation(api.boats.inviteUserToBoat);
  const acceptInvite = useMutation(api.boats.acceptBoatInvite);
  const declineInvite = useMutation(api.boats.declineBoatInvite);
  const removeBoatMember = useMutation(api.boats.removeBoatMember);
  const deleteBoat = useMutation(api.boats.deleteBoat);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boatId || !email.trim()) return;

    setInviting(true);
    try {
      await inviteUser({ boatId, email: email.trim() });
      setEmail("");
    } catch (error) {
      console.error("Failed to invite user:", error);
    } finally {
      setInviting(false);
    }
  };

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

  const handleRemoveMember = async (memberId: Id<"boatMembers">) => {
    if (!boatId) return;
    setRemovingMember(memberId);
    try {
      await removeBoatMember({ boatId, memberId });
      setRemovingMember(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
      setRemovingMember(null);
    }
  };

  const handleDeleteBoat = async () => {
    if (!boatId) return;
    try {
      await deleteBoat({ boatId });
      setConfirmDeleteBoat(false);
      onClose();
    } catch (error) {
      console.error("Failed to delete boat:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content p-4 md:p-6 w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ocean-100 dark:bg-ocean-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-ocean-600 dark:text-ocean-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Boat Settings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage crew and sharing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pending Invites */}
        {pendingInvites && pendingInvites.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Pending Invitations
            </h4>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {invite.boat?.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      Invited by {invite.inviter?.name || invite.inviter?.email}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
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
          </div>
        )}

        {boatId && (
          <>
            {/* Invite New Member */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Invite Crew Member
              </h4>
              <form onSubmit={handleInviteUser} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="input-field flex-1"
                  required
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="btn-primary whitespace-nowrap"
                >
                  {inviting ? "Inviting..." : "Invite"}
                </button>
              </form>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                They'll receive an invitation to join and manage schedules together.
              </p>
            </div>

            {/* Current Members */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-ocean-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Current Crew ({boatMembers?.length || 0})
              </h4>
              <div className="space-y-2">
                {boatMembers?.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {member.user?.name?.charAt(0) || member.user?.email?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {member.user?.name || member.user?.email}
                        </div>
                        {member.user?.email && member.user?.name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {member.user.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          member.role === "owner"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {member.role === "owner" ? "Owner" : "Member"}
                      </span>
                      {currentUser && boatMembers?.find(m => m.role === "owner" && m.userId === currentUser._id) &&
                       member.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          disabled={removingMember === member._id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Outgoing Invites */}
            {outgoingInvites && outgoingInvites.filter(invite => invite.status === "pending").length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending Invitations ({outgoingInvites.filter(invite => invite.status === "pending").length})
                </h4>
                <div className="space-y-2">
                  {outgoingInvites.filter(invite => invite.status === "pending").map((invite) => (
                    <div
                      key={invite._id}
                      className="flex items-center gap-2 p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-medium flex-shrink-0">
                          @
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {invite.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Invited {new Date(invite.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span className="badge-warning flex-shrink-0">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete Boat Section - Only for owners */}
            {currentUser && boatMembers?.find(m => m.role === "owner" && m.userId === currentUser._id) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Danger Zone
                </h4>
                <div className="p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-red-700 dark:text-red-300">Delete this boat</div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Permanently delete all data. This cannot be undone.
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmDeleteBoat(true)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Done
          </button>
        </div>
      </div>

      {/* Delete Boat Confirmation Dialog */}
      {confirmDeleteBoat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="modal-content p-6 w-[400px] max-w-[90vw]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Boat
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This will permanently remove:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                The boat and all settings
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                All crew members and invitations
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                All contacts and sessions
              </li>
            </ul>
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteBoat(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBoat}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Delete Boat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
