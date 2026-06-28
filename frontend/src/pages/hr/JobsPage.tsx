import { useEffect, useState } from 'react';
import { Plus, MapPin, Users } from 'lucide-react';
import { mockJobs } from '../../data/mockData';
import { getJobs } from '../../lib/api';
import type { JobOpening } from '../../types';

export function JobsPage() {
  const [jobs, setJobs] = useState<JobOpening[]>(mockJobs);
  const [source, setSource] = useState<'salesforce' | 'mock'>('mock');

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Job Openings</h1>
          <p className="mt-1 text-slate-500">
            Create and track open roles ({source === 'salesforce' ? 'Salesforce' : 'mock fallback'})
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          New Role
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{job.title}</h2>
                <p className="text-sm text-indigo-300">{job.department}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  job.status === 'open'
                    ? 'bg-green-500/20 text-green-300'
                    : job.status === 'closed'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-slate-700 text-slate-400'
                }`}
              >
                {job.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">{job.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
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
