import cx from './cx';

const COLORS = {
  blue: 'bg-blue-50 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
  green: 'bg-green-50 text-green-700',
  yellow: 'bg-yellow-50 text-yellow-800',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-700',
  orange: 'bg-orange-50 text-orange-700',
  pink: 'bg-pink-50 text-pink-700',
};

export default function Badge({ color = 'blue', className, children, ...props }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        COLORS[color] || COLORS.blue,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
