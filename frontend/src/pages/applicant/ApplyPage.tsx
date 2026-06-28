import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { mockJobs } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { getJobs, submitApplication } from '../../lib/api';
import type { JobOpening } from '../../types';

export function ApplyPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobOpening[]>(mockJobs);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [source, setSource] = useState<'salesforce' | 'mock'>('mock');
  const openJobs = jobs.filter((j) => j.status === 'open');

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

  const handleApply = async (jobId: string) => {
    setApplyingId(jobId);
    setMessage('');
    try {
      const application = await submitApplication({ jobId, name, email, phone });
      setMessage(`Application submitted to Salesforce. Status id: ${application.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit application.');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Open Positions</h1>
        <p className="mt-1 text-slate-500">
          Find your next role at HireForce ({source === 'salesforce' ? 'Salesforce' : 'mock fallback'})
        </p>
      </div>

      <section className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5 md:grid-cols-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email"
          type="email"
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone optional"
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
        />
        {message && <p className="text-sm text-indigo-300 md:col-span-3">{message}</p>}
      </section>

      <div className="space-y-4">
        {openJobs.map((job) => (
          <article
            key={job.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
          >
            <h2 className="text-lg font-semibold text-slate-100">{job.title}</h2>
            <p className="text-sm text-indigo-300">{job.department}</p>
            <p className="mt-2 text-sm text-slate-400">{job.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <button
                type="button"
                disabled={applyingId === job.id || !name || !email || source !== 'salesforce'}
                onClick={() => void handleApply(job.id)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                {applyingId === job.id ? 'Applying...' : 'Apply Now'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
