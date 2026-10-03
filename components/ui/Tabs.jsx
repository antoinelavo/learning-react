import cx from './cx';

// Segmented control. `tabs` is [{ value, label }]; controlled via `value`/`onChange`.
export default function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cx('flex p-1 gap-1 rounded-full bg-gray-100', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cx(
              'flex-1 min-h-[40px] px-3 py-2 text-sm sm:text-base font-semibold text-center rounded-full transition',
              active ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
