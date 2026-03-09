interface PageProps {
  params: { code: string }
}
export default function Page({ params }: PageProps) {
  return (
    <div className="mx-auto mt-12 max-w-xl rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Join organization</h1>
      <p className="mt-2 text-sm text-slate-600">Join code: {params.code}</p>
    </div>
  )
}
