import { MapPin } from 'lucide-react';
import { mockJobs } from '../../data/mockData';

export function ApplyPage() {
  const openJobs = mockJobs.filter((j) => j.status === 'open');

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Open Positions</h1>
        <p className="mt-1 text-white/50">Find your next role at HireForce</p>
      </div>

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
              <button type="button" className="btn-mono btn-mono-solid !px-4 !py-2 !text-sm">
                Apply Now
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
