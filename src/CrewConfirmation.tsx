import { useMutation } from "convex/react";
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

  const getStatusStyles = () => {
    switch (crewMember.status) {
      case "confirmed":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-900/30",
          border: "border-emerald-200 dark:border-emerald-800/50",
          text: "text-emerald-700 dark:text-emerald-300",
          dot: "bg-emerald-500",
        };
      case "declined":
        return {
          bg: "bg-red-50 dark:bg-red-900/30",
          border: "border-red-200 dark:border-red-800/50",
          text: "text-red-700 dark:text-red-300",
          dot: "bg-red-500",
        };
      default:
        return {
          bg: "bg-amber-50 dark:bg-amber-900/30",
          border: "border-amber-200 dark:border-amber-800/50",
          text: "text-amber-700 dark:text-amber-300",
          dot: "bg-amber-500",
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <div
      draggable
      onDragStart={() => onDragStart(crewMember.contactId, date)}
      className={`contact-item relative flex items-center ${styles.bg} ${styles.border} ${styles.text}
        px-2 py-1.5 rounded-lg text-xs group cursor-grab
        hover:shadow-sm active:cursor-grabbing active:scale-[1.02]
        transition-all duration-150 border`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full ${styles.dot} flex-shrink-0`}></div>
        <span className="truncate font-medium group-hover:max-w-[60px] transition-all duration-150">{crewMember.contact.name}</span>
      </div>
      {/* Action buttons - absolutely positioned to avoid layout shift */}
      <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${styles.bg} rounded-md pl-1`}>
        {crewMember.status !== "confirmed" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange("confirmed");
            }}
            className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 transition-colors"
            title="Confirm"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        {crewMember.status !== "declined" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange("declined");
            }}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
            title="Decline"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {crewMember.status !== "pending" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange("pending");
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            title="Reset to pending"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(date, crewMember.contactId);
          }}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Remove"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
