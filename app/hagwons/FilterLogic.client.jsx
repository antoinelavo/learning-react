'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function FilterLogic() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll('[data-hagwon]'));
    const region = searchParams.getAll('region');
    const lessonType = searchParams.getAll('lessonType');
    const format = searchParams.getAll('format');
    const service = searchParams.getAll('service');

    cards.forEach(card => {
      const cardRegionRaw = card.dataset.region || '';
      const cardLessonType = card.dataset.lessontype?.split(',') || [];
      const cardFormat = card.dataset.format?.split(',') || [];
      const cardService = card.dataset.service?.split(',') || [];

      const regionMatch =
        region.length === 0 || region.some(r => cardRegionRaw.includes(r));
      const lessonTypeMatch =
        lessonType.length === 0 || lessonType.some(l => cardLessonType.includes(l));
      const formatMatch =
        format.length === 0 || format.some(f => cardFormat.includes(f));
      const serviceMatch =
        service.length === 0 || service.every(s => cardService.includes(s));

      const visible = regionMatch && lessonTypeMatch && formatMatch && serviceMatch;
      card.style.display = visible ? 'block' : 'none';
    });
  }, [searchParams]);

  return null;
}
