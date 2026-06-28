import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Loader2, Video } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { useCalendarInterviews, useInterviews, useUpdateInterview } from '../../hooks/useHireForce';
import type { Interview, InterviewOutcome } from '../../types';

type InterviewRow = Interview & { candidateName?: string };
type FeedbackDraft = { status: string; outcome: InterviewOutcome; score: string; feedback: string; strengths: string; concerns: string; evidence: string };

function draftFromInterview(interview: InterviewRow): FeedbackDraft {
  return {
    status: interview.status || (interview.outcome && interview.outcome !== 'pending' ? 'Completed' : 'Scheduled'),
    outcome: interview.outcome || 'pending',
    score: interview.score == null ? '' : String(interview.score),
    feedback: interview.feedback || '',
    strengths: interview.strengths || '',
    concerns: interview.concerns || '',
    evidence: interview.evidence || '',
  };
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function InterviewsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'pass' | 'fail'>('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, FeedbackDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => { const end = new Date(weekStart); end.setDate(end.getDate() + 14); return end; }, [weekStart]);

  const { data: interviews = [], isLoading, error: loadError } = useInterviews();
  const { data: calendarInterviews = [] } = useCalendarInterviews(weekStart.toISOString(), weekEnd.toISOString());
  const updateInterview = useUpdateInterview();

  const rows: InterviewRow[] = useMemo(() => interviews.map((i) => ({ ...i, candidateName: i.candidateName || 'Candidate' })), [interviews]);
  const effectiveDrafts = useMemo(() => ({ ...Object.fromEntries(rows.map((i) => [i.id, draftFromInterview(i)])), ...drafts }), [rows, drafts]);

  const filtered = rows.filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return i.outcome === 'pending' || !i.outcome;
    return i.outcome === filter;
  });

  const calendarByDay = useMemo(() => {
    const map: Record<string, Interview[]> = {};
    for (const interview of calendarInterviews) {
      const day = new Date(interview.scheduledAt).toLocaleDateString();
      if (!map[day]) map[day] = [];
      map[day].push(interview);
    }
    return Object.entries(map).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  }, [calendarInterviews]);

  const saveInterview = async (interview: InterviewRow) => {
    const draft = effectiveDrafts[interview.id] || draftFromInterview(interview);
    setSavingId(interview.id);
    setError('');
    try {
      await updateInterview.mutateAsync({ id: interview.id, input: { status: draft.status, outcome: draft.outcome, score: draft.score ? Number(draft.score) : undefined, feedback: draft.feedback, strengths: draft.strengths, concerns: draft.concerns, evidence: draft.evidence } });
      setDrafts((c) => { const n = { ...c }; delete n[interview.id]; return n; });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save interview.');
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20 text-white/50"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const displayError = error || (loadError instanceof Error ? loadError.message : loadError ? 'Could not load interviews.' : '');

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">Interview Tracking</h1>
          <p className="mt-1 text-white/50">Feedback, outcomes, and interview calendar</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setView('list')} className={`btn-mono !px-3 !py-2 !text-xs ${view === 'list' ? 'btn-mono-solid' : 'btn-mono-outline'}`}><Video className="h-4 w-4" />List</button>
          <button type="button" onClick={() => setView('calendar')} className={`btn-mono !px-3 !py-2 !text-xs ${view === 'calendar' ? 'btn-mono-solid' : 'btn-mono-outline'}`}><CalendarDays className="h-4 w-4" />Calendar</button>
        </div>
      </div>
      {displayError && <div className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm">{displayError}</div>}
      {view === 'calendar' ? (
        <section className="panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Upcoming Interviews (next 2 weeks)</h2>
          {calendarByDay.length === 0 ? <p className="text-sm text-white/40">No scheduled interviews in this window.</p> : calendarByDay.map(([day, dayInterviews]) => (
            <div key={day} className="mb-6">
              <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-white/50">{day}</h3>
              <ul className="space-y-2">
                {dayInterviews.map((interview) => (
                  <li key={interview.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                    <div>
                      <p className="font-medium">{interview.candidateName} — {interview.type}</p>
                      <p className="text-sm text-white/50">{new Date(interview.scheduledAt).toLocaleTimeString()} with {interview.interviewer}</p>
                    </div>
                    {interview.candidateId && <Link to={`/hr/candidates/${interview.candidateId}`} className="text-xs text-white/60 hover:text-white hover:underline">View candidate</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'pass', 'fail'] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${filter === f ? 'bg-white text-black' : 'border border-white/25 text-white/60 hover:border-white/50'}`}>{f}</button>
            ))}
          </div>
          {rows.length === 0 && !loadError ? <EmptyState icon={Video} title="No interviews yet" description="Schedule an interview from a candidate profile." /> : (
            <div className="space-y-3">
              {filtered.map((interview) => {
                const draft = effectiveDrafts[interview.id] || draftFromInterview(interview);
                return (
                  <div key={interview.id} className="panel p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        {interview.candidateId ? <Link to={`/hr/candidates/${interview.candidateId}`} className="font-medium hover:underline">{interview.candidateName}</Link> : <p className="font-medium">{interview.candidateName}</p>}
                        <p className="text-sm text-white/50">{interview.type} · {interview.interviewer}</p>
                        <p className="text-xs text-white/40">{new Date(interview.scheduledAt).toLocaleString()}</p>
                      </div>
                      <span className="badge capitalize">{interview.outcome ?? 'pending'}</span>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <select value={draft.status} onChange={(e) => setDrafts((c) => ({ ...c, [interview.id]: { ...draft, status: e.target.value } }))} className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm"><option>Scheduled</option><option>Completed</option><option>Cancelled</option></select>
                      <select value={draft.outcome} onChange={(e) => setDrafts((c) => ({ ...c, [interview.id]: { ...draft, outcome: e.target.value as InterviewOutcome } }))} className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm"><option value="pending">Needs Follow-up</option><option value="pass">Hire</option><option value="fail">No Hire</option></select>
                      <input type="number" min={1} max={100} value={draft.score} onChange={(e) => setDrafts((c) => ({ ...c, [interview.id]: { ...draft, score: e.target.value } }))} placeholder="Score" className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm" />
                      <textarea value={draft.feedback} onChange={(e) => setDrafts((c) => ({ ...c, [interview.id]: { ...draft, feedback: e.target.value } }))} placeholder="Feedback" rows={2} className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm md:col-span-3" />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button type="button" disabled={savingId === interview.id} onClick={() => void saveInterview(interview)} className="btn-mono btn-mono-solid !px-3 !py-2 !text-xs">{savingId === interview.id ? 'Saving...' : 'Save Feedback'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
