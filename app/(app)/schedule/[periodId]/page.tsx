interface PageProps {
  params: { periodId: string }
}
export default function Page({ params }: PageProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Schedule Period</h1>
      <p className="mt-2 text-sm text-slate-600">Period ID: {params.periodId}</p>
    </div>
  )
}
