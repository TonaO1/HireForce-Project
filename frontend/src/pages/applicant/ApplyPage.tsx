import { MapPin, Check, Briefcase } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

export function ApplyPage() {
  const { user } = useAuth();
  const { jobs, applyToJob, hasAppliedTo } = useData();
  const openJobs = jobs.filter((j) => j.status === 'open');

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Open Positions</h1>
        <p className="mt-1 text-white/50">Find your next role at HireForce</p>
      </div>

      {openJobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No open positions right now"
          description="There are no roles open at the moment. Check back soon — new openings will be listed here."
        />
      ) : (
        <div className="space-y-4">
          {openJobs.map((job) => {
            const applied = user ? hasAppliedTo(job.id, user.email) : false;
            return (
              <article key={job.id} className="panel p-6">
                <h2 className="text-lg font-semibold text-white">{job.title}</h2>
                <p className="text-sm text-white/50">{job.department || 'No department'}</p>
                {job.description && <p className="mt-2 text-sm text-white/60">{job.description}</p>}
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1 text-sm text-white/50">
                    <MapPin className="h-4 w-4" />
                    {job.location || 'Location TBD'}
                  </span>
                  <button
                    type="button"
                    disabled={applied || !user}
                    onClick={() => user && applyToJob(job.id, { name: user.name, email: user.email })}
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
    </div>
  );
}
