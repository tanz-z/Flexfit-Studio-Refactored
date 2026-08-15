import { formatDate, formatDateTime } from "@/lib/format";

type RescheduleEntry = {
  id: number;
  fromClassName: string;
  fromClassTime: string | null;
  fromClassRoom: string | null;
  toClassTime: string | null;
  toClassRoom: string | null;
  rescheduledAt: string;
};

type RescheduleHistoryProps = {
  history: RescheduleEntry[];
};

export function RescheduleHistory({ history }: RescheduleHistoryProps) {
  if (history.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-medium">Reschedule history</h2>
      <div className="space-y-2">
        {history.map((r) => (
          <div key={r.id} className="panel p-4">
            <div className="text-sm">
              <p className="font-medium">{r.fromClassName}</p>
              <p className="muted text-xs mt-1">
                From: {formatDateTime(r.fromClassTime ?? "")} • {r.fromClassRoom}
              </p>
              <p className="muted text-xs">
                To: {formatDateTime(r.toClassTime ?? "")} • {r.toClassRoom}
              </p>
              <p className="muted text-xs mt-1">
                Rescheduled {formatDate(r.rescheduledAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
