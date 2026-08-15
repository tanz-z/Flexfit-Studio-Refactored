"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { RescheduleModal } from "@/components/reschedule-modal";
import { MembershipSummary } from "@/components/features/dashboard/MembershipSummary";
import { BookingsList } from "@/components/features/dashboard/BookingsList";
import { RescheduleHistory } from "@/components/features/dashboard/RescheduleHistory";

export default function DashboardPage() {
  const [rescheduleModal, setRescheduleModal] = useState<{
    isOpen: boolean;
    bookingId: number;
    className: string;
    classTime: string;
  }>({
    isOpen: false,
    bookingId: 0,
    className: "",
    classTime: "",
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.members.profile.useQuery(undefined, {
    retry: false,
  });
  const { data: bookings } = trpc.bookings.mine.useQuery({ includePast: false });
  const { data: rescheduleHistory } = trpc.reschedules.history.useQuery();

  const cancel = trpc.bookings.cancel.useMutation({
    onSuccess: async () => {
      await utils.bookings.mine.invalidate();
      await utils.members.profile.invalidate();
      await utils.classes.list.invalidate();
    },
  });

  if (isLoading) return <p className="muted">Loading...</p>;
  if (!profile) return <p className="muted">Please sign in to view your bookings.</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hello, {profile.name.split(" ")[0]}
        </h1>
        <p className="muted mt-1 text-sm">
          {profile.classesAttended} classes attended
        </p>
      </div>

      <MembershipSummary membership={profile.membership} />

      <BookingsList
        bookings={bookings}
        cancelError={cancel.error?.message}
        successMessage={successMessage}
        isCancelling={cancel.isPending}
        onCancel={(bookingId) => cancel.mutate({ bookingId })}
        onReschedule={(b) =>
          setRescheduleModal({
            isOpen: true,
            bookingId: b.id,
            className: b.className,
            classTime: b.startsAt,
          })
        }
      />

      {rescheduleHistory && rescheduleHistory.length > 0 && (
        <RescheduleHistory history={rescheduleHistory} />
      )}

      <RescheduleModal
        isOpen={rescheduleModal.isOpen}
        onClose={() =>
          setRescheduleModal({ ...rescheduleModal, isOpen: false })
        }
        fromBookingId={rescheduleModal.bookingId}
        fromClassName={rescheduleModal.className}
        fromClassTime={rescheduleModal.classTime}
        onSuccess={() => {
          setSuccessMessage("Class rescheduled successfully!");
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />
    </div>
  );
}
