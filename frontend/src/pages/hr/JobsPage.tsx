import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, MapPin, Users, Loader2, Trash2, ListPlus, RefreshCw } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useCandidates, useCreateJob, useJobs } from '../../hooks/useHireForce';
import type { ApplicationQuestion, ApplicationQuestionType, CreateJobInput } from '../../types';

interface QuestionDraft {
  id: string;
  prompt: string;
  type: ApplicationQuestionType;
  options: string[];
}

const EMPTY_FORM: CreateJobInput = {
  title: '',
  department: '',
  location: 'Remote / Hybrid',
  description: '',
  headcount: 1,
  priority: 'Medium',
  targetStartDate: '',
  applicationQuestions: [],
};

function newQuestionId(): string {
  return `q-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyQuestion(type: ApplicationQuestionType = 'free_response'): QuestionDraft {
  return {
    id: newQuestionId(),
    prompt: '',
    type,
    options: type === 'multiple_choice' ? ['', ''] : [],
  };
}

function toApplicationQuestions(drafts: QuestionDraft[]): ApplicationQuestion[] {
  return drafts
    .filter((q) => q.prompt.trim())
    .map((q) => ({
      id: q.id,
      prompt: q.prompt.trim(),
      type: q.type,
      options:
        q.type === 'multiple_choice'
          ? q.options.map((o) => o.trim()).filter(Boolean)
          : undefined,
    }))
    .filter((q) => q.type !== 'multiple_choice' || (q.options && q.options.length >= 2));
}

export function JobsPage() {
  const { data: jobs = [], isLoading, isRefreshing: jobsRefreshing, updatedAt: jobsUpdatedAt, refetch: refetchJobs, error } = useJobs();
  const { data: candidates = [], isRefreshing: candidatesRefreshing, updatedAt: candidatesUpdatedAt, refetch: refetchCandidates } = useCandidates();
  const createJob = useCreateJob();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateJobInput>(EMPTY_FORM);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [formError, setFormError] = useState('');
  const refreshing = jobsRefreshing || candidatesRefreshing;
  const lastUpdated = candidatesUpdatedAt || jobsUpdatedAt;

  const refreshJobs = useCallback(() => {
    refetchJobs();
    refetchCandidates();
  }, [refetchCandidates, refetchJobs]);

  useEffect(() => {
    window.addEventListener('focus', refreshJobs);
    return () => window.removeEventListener('focus', refreshJobs);
  }, [refreshJobs]);

  const countByJob = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of candidates) map[c.jobId] = (map[c.jobId] ?? 0) + 1;
    return map;
  }, [candidates]);

  const closeModal = () => {
    setOpen(false);
    setForm(EMPTY_FORM);
    setQuestions([]);
    setFormError('');
  };

  const addQuestion = (type: ApplicationQuestionType) => {
    setQuestions((current) => [...current, emptyQuestion(type)]);
  };

  const updateQuestion = (id: string, patch: Partial<QuestionDraft>) => {
    setQuestions((current) =>
      current.map((q) => {
        if (q.id !== id) return q;
        const next = { ...q, ...patch };
        if (patch.type === 'multiple_choice' && next.options.length < 2) {
          next.options = ['', ''];
        }
        if (patch.type === 'free_response') {
          next.options = [];
        }
        return next;
      }),
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions((current) => current.filter((q) => q.id !== id));
  };

  const updateOption = (questionId: string, index: number, value: string) => {
    setQuestions((current) =>
      current.map((q) => {
        if (q.id !== questionId) return q;
        const options = [...q.options];
        options[index] = value;
        return { ...q, options };
      }),
    );
  };

  const addOption = (questionId: string) => {
    setQuestions((current) =>
      current.map((q) => (q.id === questionId ? { ...q, options: [...q.options, ''] } : q)),
    );
  };

  const removeOption = (questionId: string, index: number) => {
    setQuestions((current) =>
      current.map((q) => {
        if (q.id !== questionId || q.options.length <= 2) return q;
        return { ...q, options: q.options.filter((_, i) => i !== index) };
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setFormError('');

    const invalidMc = questions.some(
      (q) =>
        q.prompt.trim() &&
        q.type === 'multiple_choice' &&
        q.options.map((o) => o.trim()).filter(Boolean).length < 2,
    );
    if (invalidMc) {
      setFormError('Multiple choice questions need at least two options.');
      return;
    }

    try {
      await createJob.mutateAsync({
        ...form,
        applicationQuestions: toApplicationQuestions(questions),
      });
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create role.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Job Openings</h1>
          <p className="mt-1 text-white/50">Create and track open roles</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lastUpdated && (
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">
              Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          <button type="button" onClick={refreshJobs} disabled={refreshing} className="btn-mono btn-mono-outline !px-4 !py-2 !text-sm">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
          <button type="button" onClick={() => setOpen(true)} className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm">
            <Plus className="h-4 w-4" />
            New Role
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white">
          {error instanceof Error ? error.message : 'Could not load jobs.'}
        </div>
      )}

      {jobs.length === 0 && !error ? (
        <EmptyState
          icon={Plus}
          title="No job openings yet"
          description="Create a role and it will appear here, on your dashboard, and on the candidate apply page."
          action={{ label: 'New Role', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <article key={job.id} className="panel p-5 transition-colors hover:border-white/40">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{job.title}</h2>
                  <p className="text-sm text-white/50">{job.department || 'No department'}</p>
                </div>
                <span className={job.status === 'open' ? 'badge-strong capitalize' : job.status === 'closed' ? 'badge-dim capitalize' : 'badge capitalize'}>
                  {job.status}
                </span>
              </div>
              {job.description && <p className="mt-3 text-sm text-white/60">{job.description}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/50">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {countByJob[job.id] ?? job.applicantCount} applicants
                </span>
                {(job.applicationQuestions?.length ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <ListPlus className="h-4 w-4" />
                    {job.applicationQuestions!.length} application question{job.applicationQuestions!.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} onClose={closeModal} title="New Role" wide>
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {formError && (
            <div className="rounded-lg border border-white/30 bg-white/5 px-3 py-2 text-sm text-white">{formError}</div>
          )}
          <div>
            <label htmlFor="job-title" className="block text-xs font-medium uppercase tracking-wider text-white/60">Title</label>
            <input id="job-title" required autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior Frontend Engineer" className="input-mono mt-1" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="job-dept" className="block text-xs font-medium uppercase tracking-wider text-white/60">Department</label>
              <input id="job-dept" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} placeholder="Engineering" className="input-mono mt-1" />
            </div>
            <div>
              <label htmlFor="job-loc" className="block text-xs font-medium uppercase tracking-wider text-white/60">Location</label>
              <input id="job-loc" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Remote" className="input-mono mt-1" />
            </div>
          </div>
          <div>
            <label htmlFor="job-desc" className="block text-xs font-medium uppercase tracking-wider text-white/60">Description</label>
            <textarea id="job-desc" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What will this person do?" className="input-mono mt-1" />
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">Application Questions</h3>
                <p className="text-xs text-white/50">Applicants answer these when they apply</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => addQuestion('free_response')} className="btn-mono btn-mono-outline !px-3 !py-1.5 !text-xs">+ Free response</button>
                <button type="button" onClick={() => addQuestion('multiple_choice')} className="btn-mono btn-mono-outline !px-3 !py-1.5 !text-xs">+ Multiple choice</button>
              </div>
            </div>

            {questions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/40">No questions yet — add free response or multiple choice.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span className="font-mono text-xs uppercase tracking-wider text-white/40">Question {index + 1}</span>
                      <button type="button" onClick={() => removeQuestion(question.id)} className="text-white/40 hover:text-white" aria-label="Remove question">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input value={question.prompt} onChange={(e) => updateQuestion(question.id, { prompt: e.target.value })} placeholder="Enter your question" className="input-mono mb-3" />
                    <select value={question.type} onChange={(e) => updateQuestion(question.id, { type: e.target.value as ApplicationQuestionType })} className="input-mono mb-3">
                      <option value="free_response">Free response</option>
                      <option value="multiple_choice">Multiple choice</option>
                    </select>
                    {question.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        <p className="text-xs text-white/50">Answer options</p>
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-2">
                            <input value={option} onChange={(e) => updateOption(question.id, optIndex, e.target.value)} placeholder={`Option ${optIndex + 1}`} className="input-mono flex-1" />
                            {question.options.length > 2 && (
                              <button type="button" onClick={() => removeOption(question.id, optIndex)} className="btn-mono btn-mono-outline !px-2 !py-2">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addOption(question.id)} className="text-xs text-white/60 hover:text-white">+ Add option</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="btn-mono btn-mono-outline !px-4 !py-2 !text-sm">Cancel</button>
            <button type="submit" disabled={!form.title?.trim() || createJob.isPending} className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm">
              {createJob.isPending ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
