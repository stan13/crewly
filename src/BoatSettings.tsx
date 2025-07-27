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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-w-90vw max-h-90vh overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            ⚓ Boat Settings & Sharing
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Pending Invites */}
        {pendingInvites && pendingInvites.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">
              📬 Pending Invitations
            </h4>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite._id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      🚤 {invite.boat?.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Invited by {invite.inviter?.name || invite.inviter?.email}
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
          </div>
        )}

        {boatId && (
          <>
            {/* Invite New Member */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">
                ➕ Invite New Crew Member
              </h4>
              <form onSubmit={handleInviteUser} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {inviting ? "Inviting..." : "Invite"}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                They'll receive an invitation to join this boat and manage schedules together.
              </p>
            </div>

            {/* Current Members */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">
                👥 Current Crew Members ({boatMembers?.length || 0})
              </h4>
              <div className="space-y-2">
                {boatMembers?.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {member.user?.name?.charAt(0) || member.user?.email?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {member.user?.name || member.user?.email}
                        </div>
                        <div className="text-sm text-gray-600">
                          {member.user?.email && member.user?.name && (
                            <span>{member.user.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          member.role === "owner"
                            ? "bg-gold-100 text-gold-800 border border-gold-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {member.role === "owner" ? "⭐ Owner" : "👤 Member"}
                      </span>
                      {/* Show remove button if current user is owner and this member is not the owner */}
                      {currentUser && boatMembers?.find(m => m.role === "owner" && m.userId === currentUser._id) && 
                       member.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          disabled={removingMember === member._id}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          {removingMember === member._id ? "..." : "✕"}
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
                <h4 className="text-md font-medium text-gray-800 mb-3">
                  📤 Pending Invitations ({outgoingInvites.filter(invite => invite.status === "pending").length})
                </h4>
                <div className="space-y-2">
                  {outgoingInvites.filter(invite => invite.status === "pending").map((invite) => (
                    <div
                      key={invite._id}
                      className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          @
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {invite.email}
                          </div>
                          <div className="text-sm text-gray-600">
                            Invited {new Date(invite.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                          ⏳ Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete Boat Section - Only for owners */}
            {currentUser && boatMembers?.find(m => m.role === "owner" && m.userId === currentUser._id) && (
              <div className="mt-8 pt-6 border-t border-red-200">
                <h4 className="text-md font-medium text-red-800 mb-3">
                  🗑️ Danger Zone
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-red-800">Delete this boat</div>
                      <div className="text-sm text-red-600">
                        This will permanently delete the boat, all members, invites, contacts, and sessions. This action cannot be undone.
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmDeleteBoat(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Delete Boat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Boat Confirmation Dialog */}
      {confirmDeleteBoat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-semibold mb-4 text-red-800 flex items-center gap-2">
              🗑️ Delete Boat
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this boat? This will permanently remove:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>The boat and all its settings</li>
              <li>All crew members and invitations</li>
              <li>All contacts and sessions</li>
              <li>All calendar data</li>
            </ul>
            <p className="text-red-600 font-medium mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteBoat(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBoat}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
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