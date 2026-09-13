import MarketplaceClient from './MarketplaceClient';

export const metadata = {
  title: 'IB 자료 마켓플레이스',
  description: '선생님들이 올린 IB 기출 답안, EE, IA 등 자료를 둘러보고 구매하세요.',
  icons: {
    icon: '/images/favicon.ico',
  },
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
