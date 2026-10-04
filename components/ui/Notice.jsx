import cx from './cx';

const COLORS = {
  yellow: 'bg-yellow-50 text-yellow-800 border-yellow-100',
  blue: 'bg-blue-50 text-blue-800 border-blue-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  green: 'bg-green-50 text-green-800 border-green-100',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
};

// Soft tinted status box. `compact` is for inline form messages.
export default function Notice({ color = 'blue', compact = false, className, children, ...props }) {
  return (
    <div
      className={cx(
        'rounded-xl border text-sm',
        compact ? 'px-3 py-2' : 'p-4',
        COLORS[color] || COLORS.blue,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
