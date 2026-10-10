import Link from 'next/link';
import { ThumbsUp, MessageCircle, Eye } from 'lucide-react';
import { Badge, cardClasses } from '@/components/ui';
import { timeAgo } from '@/lib/timeAgo';
import { stripMarkdown } from '@/lib/community';
import CategoryBadge from './CategoryBadge';
import AuthorLine from './AuthorLine';

export default function PostListItem({ post, rank }) {
  return (
    <Link
      href={`/community/post/${post.slug}`}
      className={cardClasses({
        className: `flex items-start gap-3 p-4 hover:border-blue-300 transition-colors ${post.is_pinned ? 'bg-blue-50/40' : ''}`,
      })}
    >
      {rank != null && (
        <span className="shrink-0 w-6 text-center text-base font-bold text-blue-600">{rank}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          {post.is_pinned && <Badge color="red">공지</Badge>}
          <CategoryBadge category={post.category} />
        </div>
        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 m-0">{post.title}</p>
        <p className="text-xs text-gray-500 mt-1 mb-0 line-clamp-1">{stripMarkdown(post.content)}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-gray-400">
          <AuthorLine
            name={post.author_display_name}
            isTeacher={post.is_teacher}
            profilePicture={post.author_profile_picture}
            linkable={false}
          />
          <span aria-hidden="true">·</span>
          <time dateTime={post.created_at}>{timeAgo(post.created_at)}</time>
          <span className="flex items-center gap-1 ml-auto"><ThumbsUp size={12} aria-label="좋아요" /> {post.like_count}</span>
          <span className="flex items-center gap-1"><MessageCircle size={12} aria-label="댓글" /> {post.comment_count}</span>
          <span className="flex items-center gap-1"><Eye size={12} aria-label="조회" /> {post.view_count}</span>
        </div>
      </div>
      {post.image_urls?.[0] && (
        <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
    </Link>
  );
}
