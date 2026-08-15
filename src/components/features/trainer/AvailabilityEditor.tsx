export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type Availability = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type AvailabilityEditorProps = {
  availability: Availability[] | undefined;
  editingDay: number | null;
  startTime: string;
  endTime: string;
  isSaving: boolean;
  isRemoving: boolean;
  onEditDay: (day: number) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onRemove: (day: number) => void;
};

export function AvailabilityEditor({
  availability,
  editingDay,
  startTime,
  endTime,
  isSaving,
  isRemoving,
  onEditDay,
  onStartTimeChange,
  onEndTimeChange,
  onSave,
  onCancelEdit,
  onRemove,
}: AvailabilityEditorProps) {
  const availabilityMap = new Map(
    availability?.map((a) => [a.dayOfWeek, a]) || [],
  );

  return (
    <section className="space-y-3">
      <h2 className="font-medium">Weekly Availability</h2>
      <div className="space-y-2">
        {DAYS.map((day, idx) => {
          const avail = availabilityMap.get(idx);
          const isEditing = editingDay === idx;

          return (
            <div key={idx} className="panel p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{day}</div>
                  {avail && !isEditing && (
                    <div className="muted mt-1 text-sm">
                      {avail.startTime} - {avail.endTime}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="ml-4 flex gap-2">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => onStartTimeChange(e.target.value)}
                      className="rounded border px-2 py-1 text-sm"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                        color: "var(--fg)",
                      }}
                    />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => onEndTimeChange(e.target.value)}
                      className="rounded border px-2 py-1 text-sm"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                        color: "var(--fg)",
                      }}
                    />
                    <button
                      onClick={onSave}
                      disabled={isSaving || !startTime || !endTime}
                      className="btn btn-primary btn-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="btn btn-sm"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--fg)",
                        borderColor: "var(--border)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="ml-4 flex gap-2">
                    <button
                      onClick={() => onEditDay(idx)}
                      className="btn btn-sm"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--fg)",
                        borderColor: "var(--border)",
                      }}
                    >
                      {avail ? "Edit" : "Add"}
                    </button>
                    {avail && (
                      <button
                        onClick={() => onRemove(idx)}
                        disabled={isRemoving}
                        className="btn btn-sm"
                        style={{
                          background: "var(--bg-secondary)",
                          color: "#ef4444",
                          borderColor: "var(--border)",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
