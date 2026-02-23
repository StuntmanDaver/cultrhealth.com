export default function PortalLoading() {
  return (
    <div className="min-h-screen grad-page">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-10 w-64 bg-brand-primary/10 rounded-lg animate-pulse mb-8" />
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}
