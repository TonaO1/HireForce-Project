import { Plus, MapPin, Users } from 'lucide-react';
import { mockJobs } from '../../data/mockData';

export function JobsPage() {
  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Job Openings</h1>
          <p className="mt-1 text-white/50">Create and track open roles</p>
        </div>
        <button type="button" className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm">
          <Plus className="h-4 w-4" />
          New Role
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockJobs.map((job) => (
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
