import FeedSkeleton from './FeedSkeleton';

// Shown on first navigation into /community. Board, tab, search and page
// changes use FeedResults' skeleton instead (query-only changes skip this).
function Bar({ className }) {
  return <div className={`rounded bg-gray-200 ${className}`} />;
}

export default function CommunityLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-16" aria-busy="true" aria-label="불러오는 중">
      <div className="animate-pulse">
        <Bar className="h-5 w-40 mb-4" />
        <div className="h-12 rounded-full bg-gray-100 mb-3" />
        <div className="h-12 rounded-xl bg-gray-100 mb-3" />
        <div className="flex gap-2 mb-4">
          {[12, 20, 16, 10, 12].map((w, i) => (
            <div key={i} className="h-9 rounded-full bg-gray-100" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        <FeedSkeleton />
      </div>
    </main>
  );
}
