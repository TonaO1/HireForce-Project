export function BookInterviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Book Your Interview</h1>
        <p className="mt-1 text-slate-500">
          Pick a time that works for you — no back-and-forth emails
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-6 py-4">
          <p className="text-sm text-slate-400">
            Calendly / Salesforce Scheduler embed placeholder
          </p>
        </div>
        <div className="flex h-[500px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-2xl border border-dashed border-slate-700 p-12">
            <p className="text-lg font-medium text-slate-300">Scheduling Widget</p>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Replace this area with your Calendly iframe or Salesforce Scheduler embed.
              Candidates will see available slots and book directly into the recruiter&apos;s calendar.
            </p>
            <code className="mt-4 block rounded-lg bg-slate-950 px-4 py-2 text-xs text-indigo-300">
              https://calendly.com/your-recruiter/30min
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
