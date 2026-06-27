import { MapPin } from 'lucide-react';
import { mockJobs } from '../../data/mockData';

export function ApplyPage() {
  const openJobs = mockJobs.filter((j) => j.status === 'open');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Open Positions</h1>
        <p className="mt-1 text-slate-500">Find your next role at HireForce</p>
      </div>

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
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Apply Now
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
