import Link from 'next/link';
import cx from './cx';

const VARIANTS = {
  primary: 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:border-blue-700',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  danger: 'bg-red-50 text-red-600 border border-transparent hover:bg-red-100',
  tinted: 'bg-blue-50 text-blue-600 border border-transparent hover:bg-blue-100',
  ghost: 'bg-transparent text-gray-600 border border-transparent hover:bg-gray-100',
};

const SIZES = {
  sm: 'min-h-[36px] px-3 py-1.5 text-sm',
  md: 'min-h-[44px] px-5 py-2.5 text-sm sm:text-base',
  lg: 'min-h-[52px] px-6 py-3 text-base',
};

export function buttonClasses({ variant = 'primary', size = 'md', fullWidth = false, className } = {}) {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth && 'w-full',
    className
  );
}

// Renders a <Link> when `href` is given, otherwise a <button>. `type` is passed
// through untouched, so a Button inside a <form> submits by default like a
// native <button>.
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  href,
  external = false,
  type,
  className,
  children,
  ...props
}) {
  const classes = buttonClasses({ variant, size, fullWidth, className });

  if (href) {
    if (external) {
      return (
        <a href={href} className={classes} {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
