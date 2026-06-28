import { useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Briefcase, Check, FileText, Paperclip } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useJobs, useMyApplications, useSubmitApplication } from '../../hooks/useHireForce';
import type { ApplicationAnswer, JobOpening } from '../../types';

const ACCEPTED_RESUME_TYPES = '.pdf,.doc,.docx';

export function ApplyPage() {
  const { user } = useAuth();
  const { data: jobs = [], isLoading, error } = useJobs();
  const { data: myApplications = [] } = useMyApplications(user?.email);
  const submitApplication = useSubmitApplication();

  const [applyJob, setApplyJob] = useState<JobOpening | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  const openJobs = jobs.filter((j) => j.status === 'open');

  const hasAppliedTo = (jobId: string, email: string) =>
    myApplications.some((c) => c.jobId === jobId && c.email === email);

  const questions = applyJob?.applicationQuestions ?? [];

  const closeApplyModal = () => {
    setApplyJob(null);
    setAnswers({});
    setResumeFile(null);
    setFormError('');
  };

  const openApplyModal = (job: JobOpening) => {
    setApplyJob(job);
    setAnswers({});
    setResumeFile(null);
    setFormError('');
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !applyJob) return;
    setFormError('');

    const missing = questions.filter((q) => !answers[q.id]?.trim());
    if (missing.length > 0) {
      setFormError('Please answer all application questions.');
      return;
    }

    const applicationAnswers: ApplicationAnswer[] = questions.map((q) => ({
      questionId: q.id,
      questionPrompt: q.prompt,
      answer: answers[q.id].trim(),
    }));

    let resumeUrl: string | undefined;
    if (resumeFile) {
      resumeUrl = URL.createObjectURL(resumeFile);
    }

    try {
      await submitApplication.mutateAsync({
        jobId: applyJob.id,
        name: user.name,
        email: user.email,
        answers: applicationAnswers.length ? applicationAnswers : undefined,
        resumeFileName: resumeFile?.name,
        resumeUrl,
      });
      closeApplyModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit application.');
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
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Open Positions</h1>
        <p className="mt-1 text-white/50">Find your next role at HireForce</p>
      </div>
      {error && (
        <div className="rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white">
          {error instanceof Error ? error.message : 'Could not load jobs.'}
        </div>
      )}
      {openJobs.length === 0 && !error ? (
        <EmptyState icon={Briefcase} title="No open positions right now" description="There are no roles open at the moment. Check back soon." />
      ) : (
        <div className="space-y-4">
          {openJobs.map((job) => {
            const applied = user ? hasAppliedTo(job.id, user.email) : false;
            return (
              <article key={job.id} className="panel p-6">
                <h2 className="text-lg font-semibold text-white">{job.title}</h2>
                <p className="text-sm text-white/50">{job.department || 'No department'}</p>
                {job.description && <p className="mt-2 text-sm text-white/60">{job.description}</p>}
                {(job.applicationQuestions?.length ?? 0) > 0 && (
                  <p className="mt-2 text-xs text-white/40">
                    {job.applicationQuestions!.length} application question{job.applicationQuestions!.length === 1 ? '' : 's'}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1 text-sm text-white/50">
                    <MapPin className="h-4 w-4" />
                    {job.location || 'Location TBD'}
                  </span>
                  <button
                    type="button"
                    disabled={applied || !user}
                    onClick={() => !applied && openApplyModal(job)}
                    className={`btn-mono !px-4 !py-2 !text-sm ${applied ? 'btn-mono-outline' : 'btn-mono-solid'}`}
                  >
                    {applied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Applied
                      </>
                    ) : (
                      'Apply Now'
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {submitApplication.isSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-white">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm">Application submitted.</p>
        </div>
      )}

      <Modal open={Boolean(applyJob)} onClose={closeApplyModal} title={applyJob ? `Apply — ${applyJob.title}` : 'Apply'} wide>
        {applyJob && (
          <form onSubmit={handleSubmitApplication} className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
            {formError && (
              <div className="rounded-lg border border-white/30 bg-white/5 px-3 py-2 text-sm text-white">{formError}</div>
            )}

            {questions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Application Questions</h3>
                {questions.map((question) => (
                  <div key={question.id}>
                    <label className="mb-1.5 block text-sm text-white/80">{question.prompt}</label>
                    {question.type === 'multiple_choice' ? (
                      <select
                        required
                        value={answers[question.id] ?? ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [question.id]: e.target.value }))}
                        className="input-mono"
                      >
                        <option value="">Select an answer</option>
                        {question.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <textarea
                        required
                        rows={3}
                        value={answers[question.id] ?? ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [question.id]: e.target.value }))}
                        placeholder="Your answer"
                        className="input-mono"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-white">
                <Paperclip className="h-4 w-4 text-white/50" />
                Resume <span className="font-normal text-white/40">(optional)</span>
              </label>
              <input
                type="file"
                accept={ACCEPTED_RESUME_TYPES}
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-white/60 file:mr-3 file:rounded-md file:border file:border-white/20 file:bg-white/5 file:px-3 file:py-2 file:text-sm file:text-white hover:file:border-white/40"
              />
              {resumeFile && (
                <p className="mt-2 flex items-center gap-2 text-xs text-white/50">
                  <FileText className="h-3.5 w-3.5" />
                  {resumeFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeApplyModal} className="btn-mono btn-mono-outline !px-4 !py-2 !text-sm">
                Cancel
              </button>
              <button type="submit" disabled={submitApplication.isPending} className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm">
                {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
