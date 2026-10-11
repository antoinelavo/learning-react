import BackButton from '@/components/community/BackButton.client';

// Post-page skeleton (overrides the feed skeleton in app/community/loading.jsx).
export default function CommunityPostLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-4 min-h-screen mb-16" aria-busy="true" aria-label="불러오는 중">
      <BackButton href="/community" />
      <div className="animate-pulse bg-white border border-gray-200 shadow rounded-2xl p-6 sm:p-8">
        <div className="h-5 w-16 rounded bg-gray-200 mb-4" />
        <div className="h-6 w-3/4 rounded bg-gray-200 mb-3" />
        <div className="h-3 w-40 rounded bg-gray-200 mb-8" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="h-4 w-11/12 rounded bg-gray-100" />
          <div className="h-4 w-2/3 rounded bg-gray-100" />
        </div>
      </div>
    </main>
  );
}
