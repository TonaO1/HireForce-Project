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
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Open Positions</h1>
        <p className="mt-1 text-white/50">
          Find your next role at HireForce ({source === 'salesforce' ? 'Salesforce' : 'mock fallback'})
        </p>
      </div>

      <section className="panel grid gap-3 p-5 md:grid-cols-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email"
          type="email"
          className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone optional"
          className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
        />
        {message && <p className="text-sm text-white/70 md:col-span-3">{message}</p>}
      </section>

      <div className="space-y-4">
        {openJobs.map((job) => (
          <article key={job.id} className="panel p-6">
            <h2 className="text-lg font-semibold text-white">{job.title}</h2>
            <p className="text-sm text-white/50">{job.department}</p>
            <p className="mt-2 text-sm text-white/60">{job.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-white/50">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <button
                type="button"
                disabled={applyingId === job.id || !name || !email || source !== 'salesforce'}
                onClick={() => void handleApply(job.id)}
                className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm disabled:cursor-not-allowed disabled:opacity-40"
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
