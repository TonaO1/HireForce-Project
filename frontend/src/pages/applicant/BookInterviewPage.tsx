export function BookInterviewPage() {
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Book Your Interview</h1>
        <p className="mt-1 text-white/50">
          Pick a time that works for you — no back-and-forth emails
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/15 bg-black">
        <div className="border-b border-white/15 px-6 py-4">
          <p className="text-sm text-white/60">
            Calendly / Salesforce Scheduler embed placeholder
          </p>
        </div>
        <div className="flex h-[500px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-2xl border border-dashed border-white/20 p-12">
            <p className="text-lg font-medium text-white">Scheduling Widget</p>
            <p className="mt-2 max-w-md text-sm text-white/50">
              Replace this area with your Calendly iframe or Salesforce Scheduler embed.
              Candidates will see available slots and book directly into the recruiter&apos;s calendar.
            </p>
            <code className="mt-4 block rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/70">
              https://calendly.com/your-recruiter/30min
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
