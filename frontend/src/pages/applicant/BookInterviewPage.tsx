import { CalendarClock } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

export function BookInterviewPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Book Your Interview</h1>
        <p className="mt-1 text-white/50">
          Pick a time that works for you — no back-and-forth emails
        </p>
      </div>

      <EmptyState
        icon={CalendarClock}
        title="Interview booking is coming soon"
        description="Once a recruiter invites you to interview, you'll be able to choose an available slot and confirm it here."
        action={{ label: 'Browse Jobs', to: '/apply' }}
      />
    </div>
  );
}
