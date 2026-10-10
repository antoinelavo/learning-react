import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui';

// "선생님" pill next to an approved teacher's name on posts and comments.
export default function VerifiedBadge() {
  return (
    <Badge color="blue" title="IB Master 인증 선생님" className="px-1.5 shrink-0">
      <ShieldCheck size={10} strokeWidth={2.5} aria-hidden="true" />
      선생님
    </Badge>
  );
}
