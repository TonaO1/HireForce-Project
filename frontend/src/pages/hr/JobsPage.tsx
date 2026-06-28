import { useMemo, useState } from 'react';
import { Plus, MapPin, Users } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';

const EMPTY_FORM = { title: '', department: '', location: '', description: '' };

export function JobsPage() {
  const { jobs, candidates, addJob } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const countByJob = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of candidates) map[c.jobId] = (map[c.jobId] ?? 0) + 1;
    return map;
  }, [candidates]);

  const closeModal = () => {
    setOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addJob(form);
    closeModal();
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Job Openings</h1>
          <p className="mt-1 text-white/50">Create and track open roles</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm"
        >
          <Plus className="h-4 w-4" />
          New Role
        </button>
      </div>

      {jobs.length === 0 ? (
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
                <span
                  className={
                    job.status === 'open'
                      ? 'badge-strong capitalize'
                      : job.status === 'closed'
                        ? 'badge-dim capitalize'
                        : 'badge capitalize'
                  }
                >
                  {job.status}
                </span>
              </div>
              {job.description && <p className="mt-3 text-sm text-white/60">{job.description}</p>}
              <div className="mt-4 flex items-center gap-4 text-sm text-white/50">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {countByJob[job.id] ?? 0} applicants
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} onClose={closeModal} title="New Role">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="job-title" className="block text-xs font-medium uppercase tracking-wider text-white/60">
              Title
            </label>
            <input
              id="job-title"
              required
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Senior Frontend Engineer"
              className="input-mono mt-1"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="job-dept" className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Department
              </label>
              <input
                id="job-dept"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="Engineering"
                className="input-mono mt-1"
              />
            </div>
            <div>
              <label htmlFor="job-loc" className="block text-xs font-medium uppercase tracking-wider text-white/60">
                Location
              </label>
              <input
                id="job-loc"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Remote"
                className="input-mono mt-1"
              />
            </div>
          </div>
          <div>
            <label htmlFor="job-desc" className="block text-xs font-medium uppercase tracking-wider text-white/60">
              Description
            </label>
            <textarea
              id="job-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What will this person do?"
              className="input-mono mt-1"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="btn-mono btn-mono-outline !px-4 !py-2 !text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!form.title.trim()}
              className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm"
            >
              Create Role
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
