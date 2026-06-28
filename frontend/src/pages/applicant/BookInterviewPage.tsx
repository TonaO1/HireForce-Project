import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Loader2 } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useBookSchedulerSlot, useMyApplications, useSchedulerSlots } from '../../hooks/useHireForce';

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function BookInterviewPage() {
  const { user } = useAuth();
  const { data: applications = [], isLoading: appsLoading } = useMyApplications(user?.email);

  const eligibleApplication = useMemo(() => {
    return applications.find(
      (app) =>
        app.stage === 'screened' ||
        app.stage === 'interview' ||
        app.interviews.some((i) => i.status === 'Invited' || i.status === 'Scheduled'),
    );
  }, [applications]);

  const pendingInvite = useMemo(() => {
    if (!eligibleApplication) return undefined;
    return (
      eligibleApplication.interviews.find((i) => i.status === 'Invited') ||
      eligibleApplication.interviews.find((i) => !i.scheduledAt || i.status === 'Scheduled')
    );
  }, [eligibleApplication]);

  const rangeStart = useMemo(() => new Date().toISOString(), []);
  const rangeEnd = useMemo(() => addDays(new Date(), 14).toISOString(), []);

  const { data: slotData, isLoading: slotsLoading } = useSchedulerSlots({
    start: rangeStart,
    end: rangeEnd,
    enabled: Boolean(eligibleApplication),
  });

  const bookSlot = useBookSchedulerSlot();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState('');

  const slots = slotData?.slots ?? [];

  const slotsByDay = useMemo(() => {
    const map: Record<string, typeof slots> = {};
    for (const slot of slots) {
      const day = new Date(slot.start).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      if (!map[day]) map[day] = [];
      map[day].push(slot);
    }
    return Object.entries(map);
  }, [slots]);

  const handleBook = async () => {
    if (!eligibleApplication || !selectedSlot) return;
    const slot = slots.find((s) => s.start === selectedSlot);
    if (!slot) return;
    setError('');
    try {
      await bookSlot.mutateAsync({
        candidateId: eligibleApplication.id,
        interviewId: pendingInvite?.id,
        start: slot.start,
        end: slot.end,
        interviewerId: slot.interviewerId,
        type: pendingInvite?.type || 'Interview',
      });
      setBooked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book interview.');
    }
  };

  if (appsLoading) {
    return <div className="flex items-center justify-center py-20 text-white/50"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!eligibleApplication) {
    return (
      <div className="space-y-6 text-white">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">Book Your Interview</h1>
          <p className="mt-1 text-white/50">Pick a time that works for you</p>
        </div>
        <EmptyState icon={CalendarClock} title="No interview invitation yet" description="Once a recruiter invites you to interview, you'll be able to choose a slot here." action={{ label: 'Browse Jobs', to: '/apply' }} />
      </div>
    );
  }

  if (booked) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/5 px-4 py-6 text-white">
        <CheckCircle2 className="h-8 w-8 shrink-0" />
        <div>
          <h1 className="font-mono text-xl font-bold">Interview confirmed</h1>
          <p className="mt-1 text-sm text-white/60">Your interview for {eligibleApplication.roleApplied} has been booked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight">Book Your Interview</h1>
        <p className="mt-1 text-white/50">{eligibleApplication.roleApplied}</p>
      </div>
      {error && <div className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm">{error}</div>}
      {slotsLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/50" /></div>
      ) : slots.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No slots available" description="No open interview slots in the next two weeks. Check back later." />
      ) : (
        <div className="space-y-6">
          {slotsByDay.map(([day, daySlots]) => (
            <section key={day} className="panel p-5">
              <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-white/60">{day}</h2>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((slot) => {
                  const label = new Date(slot.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                  const isSelected = selectedSlot === slot.start;
                  return (
                    <button key={slot.start} type="button" onClick={() => setSelectedSlot(slot.start)} className={`rounded-lg border px-4 py-2 text-sm ${isSelected ? 'border-white bg-white text-black' : 'border-white/25 text-white/70 hover:border-white/50'}`}>
                      {label}{slot.interviewerName ? ` · ${slot.interviewerName}` : ''}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          <div className="flex justify-end">
            <button type="button" disabled={!selectedSlot || bookSlot.isPending} onClick={() => void handleBook()} className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm disabled:opacity-40">
              {bookSlot.isPending ? 'Booking...' : 'Confirm Interview'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
