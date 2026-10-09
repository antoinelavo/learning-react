// Server layout so the client-side /apply page can declare metadata.
export const metadata = {
  alternates: {
    canonical: '/apply',
  },
};

export default function ApplyLayout({ children }) {
  return children;
}
