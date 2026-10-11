// Shown instantly while the feed re-renders on the server (tab, board,
// search or page change).
function Bar({ className }) {
  return <div className={`rounded bg-gray-200 ${className}`} />;
}

export default function CommunityLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-16" aria-busy="true" aria-label="불러오는 중">
      <div className="animate-pulse">
        <Bar className="h-6 w-48 mb-2" />
        <Bar className="h-4 w-64 mb-5" />
        <div className="h-12 rounded-full bg-gray-100 mb-3" />
        <div className="h-12 rounded-xl bg-gray-100 mb-3" />
        <div className="flex gap-2 mb-4">
          {[12, 20, 16, 10, 12].map((w, i) => (
            <div key={i} className="h-9 rounded-full bg-gray-100" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        <ul className="space-y-2 list-none p-0 m-0">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="bg-white border border-gray-200 shadow rounded-2xl p-4">
              <Bar className="h-4 w-14 mb-2" />
              <Bar className="h-4 w-3/4 mb-2" />
              <Bar className="h-3 w-1/2" />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
