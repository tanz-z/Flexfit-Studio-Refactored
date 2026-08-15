import { formatDateTime } from "@/lib/format";

type Booking = {
  id: number;
  className: string;
  status: string;
  startsAt: string;
  room: string;
};

type BookingsListProps = {
  bookings: Booking[] | undefined;
  cancelError: string | null | undefined;
  successMessage: string | null;
  isCancelling: boolean;
  onCancel: (bookingId: number) => void;
  onReschedule: (booking: Booking) => void;
};

export function BookingsList({
  bookings,
  cancelError,
  successMessage,
  isCancelling,
  onCancel,
  onReschedule,
}: BookingsListProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">Upcoming bookings</h2>

      {successMessage && (
        <p className="panel p-3 text-sm" style={{ color: "#4ade80" }}>
          {successMessage}
        </p>
      )}

      {cancelError && (
        <p className="panel p-3 text-sm" style={{ color: "#f87171" }}>
          {cancelError}
        </p>
      )}

      {bookings?.length ? (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="panel flex items-center gap-2 p-4 flex-wrap sm:flex-nowrap"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{b.className}</h3>
                  <span className="muted text-xs uppercase tracking-wide">
                    {b.status}
                  </span>
                </div>
                <p className="muted mt-0.5 text-sm">
                  {formatDateTime(b.startsAt)} &middot; {b.room}
                </p>
              </div>

              {(b.status === "booked" || b.status === "waitlisted") && (
                <div className="flex gap-2 w-full sm:w-auto">
                  {b.status === "booked" && (
                    <button
                      className="btn text-sm flex-1 sm:flex-none"
                      disabled={isCancelling}
                      onClick={() => onReschedule(b)}
                    >
                      Reschedule
                    </button>
                  )}
                  <button
                    className="btn text-sm flex-1 sm:flex-none"
                    disabled={isCancelling}
                    onClick={() => onCancel(b.id)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted text-sm">No upcoming bookings.</p>
      )}
    </section>
  );
}
