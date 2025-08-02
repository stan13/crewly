import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface CrewMember {
  contactId: Id<"contacts">;
  status: "confirmed" | "declined" | "pending";
  confirmedAt?: number;
  contact: {
    _id: Id<"contacts">;
    name: string;
    email?: string;
    phone?: string;
  } | null;
}

interface CrewConfirmationProps {
  date: string;
  crewMember: CrewMember;
  onDragStart: (contactId: Id<"contacts">, fromDate?: string) => void;
  onRemove: (date: string, contactId: Id<"contacts">) => void;
}

export function CrewConfirmation({ date, crewMember, onDragStart, onRemove }: CrewConfirmationProps) {
  const updateCrewConfirmation = useMutation(api.boatSessions.updateCrewConfirmation);

  if (!crewMember.contact) return null;

  const handleStatusChange = (status: "confirmed" | "declined" | "pending") => {
    void updateCrewConfirmation({
      date,
      contactId: crewMember.contactId,
      status,
    });
  };

  const getStatusColor = () => {
    switch (crewMember.status) {
      case "confirmed":
        return "from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700";
      case "declined":
        return "from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700";
      default:
        return "from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700";
    }
  };

  const getStatusIcon = () => {
    switch (crewMember.status) {
      case "confirmed":
        return "✓";
      case "declined":
        return "✗";
      default:
        return "?";
    }
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(crewMember.contactId, date)}
      className={`contact-item flex justify-between items-center bg-gradient-to-r ${getStatusColor()} px-2 py-1 rounded-lg text-xs group cursor-move hover:scale-105 transition-all duration-200 shadow-sm border`}
    >
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-xs font-bold">{getStatusIcon()}</span>
        <span className="truncate">{crewMember.contact.name}</span>
      </div>
      <div className="flex items-center">
        <div className="hidden group-hover:flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange("confirmed");
            }}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 px-0.5 text-xs"
            title="Confirm"
          >
            ✓
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange("declined");
            }}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 px-0.5 text-xs"
            title="Decline"
          >
            ✗
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange("pending");
            }}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-0.5 text-xs"
            title="Reset to pending"
          >
            ?
          </button>
          <button
            onClick={() => onRemove(date, crewMember.contactId)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 px-0.5 text-xs"
            title="Remove from session"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}