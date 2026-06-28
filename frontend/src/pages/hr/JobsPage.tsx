import { useEffect, useState, type FormEvent } from 'react';
import { Plus, MapPin, Users } from 'lucide-react';
import { mockJobs } from '../../data/mockData';
import { createJob, getJobs } from '../../lib/api';
import type { CreateJobInput, JobOpening } from '../../types';

const emptyJobForm: CreateJobInput = {
  title: '',
  department: '',
  location: 'Remote / Hybrid',
  description: '',
  headcount: 1,
  priority: 'Medium',
  targetStartDate: '',
};

export function JobsPage() {
  const [jobs, setJobs] = useState<JobOpening[]>(mockJobs);
  const [source, setSource] = useState<'salesforce' | 'mock'>('mock');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateJobInput>(emptyJobForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJobs()
      .then((remoteJobs) => {
        if (!active) return;
        setJobs(remoteJobs);
        setSource('salesforce');
      })
      .catch(() => {
        if (!active) return;
        setSource('mock');
      });
    return () => {
      active = false;
    };
  }, []);

  const refreshJobs = async () => {
    const remoteJobs = await getJobs();
    setJobs(remoteJobs);
    setSource('salesforce');
  };

  const updateForm = (field: keyof CreateJobInput, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await createJob(form);
      setJobs((current) => [created, ...current.filter((job) => job.id !== created.id)]);
      setSource('salesforce');
      setForm(emptyJobForm);
      setShowForm(false);
      void refreshJobs();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create role.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Job Openings</h1>
          <p className="mt-1 text-white/50">
            Create and track open roles ({source === 'salesforce' ? 'Salesforce' : 'mock fallback'})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
          className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm"
        >
          <Plus className="h-4 w-4" />
          New Role
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateJob} className="panel grid gap-3 p-5 md:grid-cols-2">
          <input
            required
            value={form.title}
            onChange={(event) => updateForm('title', event.target.value)}
            placeholder="Role title"
            className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          />
          <input
            value={form.department}
            onChange={(event) => updateForm('department', event.target.value)}
            placeholder="Department name"
            className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          />
          <input
            value={form.location}
            onChange={(event) => updateForm('location', event.target.value)}
            placeholder="Location"
            className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          />
          <input
            min={1}
            type="number"
            value={form.headcount ?? 1}
            onChange={(event) => updateForm('headcount', Number(event.target.value))}
            placeholder="Headcount"
            className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          />
          <select
            value={form.priority}
            onChange={(event) => updateForm('priority', event.target.value)}
            className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <input
            type="date"
            value={form.targetStartDate}
            onChange={(event) => updateForm('targetStartDate', event.target.value)}
            className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          />
          <textarea
            value={form.description}
            onChange={(event) => updateForm('description', event.target.value)}
            placeholder="Role description"
            rows={3}
            className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white md:col-span-2"
          />
          {error && <p className="text-sm text-white/70 md:col-span-2">{error}</p>}
          <div className="flex gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Creating...' : 'Create Role'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-mono btn-mono-outline !px-4 !py-2 !text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job) => (
          <article key={job.id} className="panel p-5 transition-colors hover:border-white/40">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{job.title}</h2>
                <p className="text-sm text-white/50">{job.department}</p>
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
            <p className="mt-3 text-sm text-white/60">{job.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {job.applicantCount} applicants
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
