import HagwonCard from '@/components/HagwonCard';
import hagwons from '@/data/hagwons';
import Image from 'next/image';


export default function HagwonsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">SAT 학원 29곳 추천 및 비교 [2025년 최신]</h1>
      <div className="space-y-8 flex flex-col gap-[1em]">
        {hagwons.map((hagwon, i) => (
          <HagwonCard key={i} {...hagwon} />
        ))}
      </div>
    </main>
  );
}
