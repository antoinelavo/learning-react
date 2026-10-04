import cx from './cx';

// Selectable pill for filters and categories. `soft` shows the selected state
// as a tinted outline (used for dropdown triggers); the default is solid blue.
// `compact` trims the side padding on phones so a row of chips fits.
export function chipClasses({ selected = false, soft = false, compact = false, className } = {}) {
  return cx(
    'inline-flex items-center gap-1 rounded-full border py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
    compact ? 'px-2.5 sm:px-3' : 'px-3',
    selected
      ? soft
        ? 'border-blue-500 bg-blue-50 text-blue-700'
        : 'border-blue-600 bg-blue-600 text-white'
      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600',
    className
  );
}

export default function Chip({ selected, soft, type = 'button', className, children, ...props }) {
  return (
    <button type={type} aria-pressed={selected} className={chipClasses({ selected, soft, className })} {...props}>
      {children}
    </button>
  );
}

// Selectable tile for single/multi-choice form options.
export function choiceClasses({ selected = false, disabled = false, className } = {}) {
  return cx(
    'rounded-xl border px-3 py-2 text-left transition-colors',
    selected
      ? 'border-blue-500 bg-blue-50'
      : disabled
        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
        : 'border-gray-200 bg-white hover:border-blue-300',
    className
  );
}
