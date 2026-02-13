export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-10 w-48 bg-brand-primary/10 rounded-lg animate-pulse mb-8" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
