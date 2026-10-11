// Placeholder post list, shown while the feed loads.
export default function FeedSkeleton({ count = 6 }) {
  return (
    <ul className="space-y-2 list-none p-0 m-0 animate-pulse" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="bg-white border border-gray-200 shadow rounded-2xl p-4">
          <div className="h-4 w-14 rounded bg-gray-200 mb-2" />
          <div className="h-4 w-3/4 rounded bg-gray-200 mb-2" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}
