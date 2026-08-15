"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { TrainerClassCard } from "@/components/features/trainer/TrainerClassCard";
import { AvailabilityEditor } from "@/components/features/trainer/AvailabilityEditor";

export default function TrainerSchedulePage() {
  const utils = trpc.useUtils();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: classes, isLoading: classesLoading } =
    trpc.trainers.upcomingClasses.useQuery(undefined, {
      enabled: user?.role === "trainer",
    });
  const { data: availability, isLoading: availLoading } =
    trpc.trainers.availability.useQuery(undefined, {
      enabled: user?.role === "trainer",
    });

  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const setAvailability = trpc.trainers.setAvailability.useMutation({
    onSuccess: async () => {
      await utils.trainers.availability.invalidate();
      setEditingDay(null);
      setStartTime("");
      setEndTime("");
    },
  });

  const removeAvailability = trpc.trainers.removeAvailability.useMutation({
    onSuccess: async () => {
      await utils.trainers.availability.invalidate();
    },
  });

  if (user?.role !== "trainer") {
    return <p className="muted">Access denied. Trainers only.</p>;
  }

  if (classesLoading || availLoading) return <p className="muted">Loading...</p>;

  const handleEditDay = (day: number) => {
    const existing = availability?.find((a) => a.dayOfWeek === day);
    setEditingDay(day);
    setStartTime(existing?.startTime || "");
    setEndTime(existing?.endTime || "");
  };

  const handleSave = () => {
    if (editingDay === null || !startTime || !endTime) return;
    setAvailability.mutate({
      dayOfWeek: editingDay,
      startTime,
      endTime,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trainer Schedule</h1>
        <p className="muted mt-1 text-sm">
          Manage your availability and upcoming classes
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Upcoming Classes</h2>
        {classes && classes.length > 0 ? (
          <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
            {classes.map((cls) => (
              <TrainerClassCard
                key={cls.id}
                classId={cls.id}
                className={cls.name}
                startsAt={cls.startsAt}
                room={cls.room}
                durationMin={cls.durationMin}
                cancelled={cls.cancelled}
              />
            ))}
          </div>
        ) : (
          <p className="muted text-sm">No upcoming classes.</p>
        )}
      </section>

      <AvailabilityEditor
        availability={availability}
        editingDay={editingDay}
        startTime={startTime}
        endTime={endTime}
        isSaving={setAvailability.isPending}
        isRemoving={removeAvailability.isPending}
        onEditDay={handleEditDay}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        onSave={handleSave}
        onCancelEdit={() => setEditingDay(null)}
        onRemove={(day) => removeAvailability.mutate({ dayOfWeek: day })}
      />
    </div>
  );
}
