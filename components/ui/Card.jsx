import cx from './cx';

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-6 sm:p-8',
  lg: 'p-6 sm:p-12',
};

export function cardClasses({ padding = 'none', className } = {}) {
  return cx('bg-white border border-gray-200 shadow rounded-2xl', PADDING[padding] ?? '', className);
}

export default function Card({ as: Tag = 'div', padding = 'md', className, children, ...props }) {
  return (
    <Tag className={cardClasses({ padding, className })} {...props}>
      {children}
    </Tag>
  );
}
