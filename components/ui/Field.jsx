import { forwardRef } from 'react';
import cx from './cx';

export const fieldClasses = cx(
  'w-full rounded-xl border border-gray-300 bg-white p-3 text-base text-gray-900',
  'placeholder:text-gray-400 transition-colors',
  'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
  'disabled:bg-gray-50 disabled:text-gray-500'
);

// Optional label above and error/hint text below a form control.
function FieldWrapper({ label, error, hint, id, required, className, children }) {
  if (!label && !error && !hint) return children;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block font-medium mb-2">
          {label}
          {required && ' *'}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-500 mt-1 mb-0">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1 mb-0">{error}</p>}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, error, hint, wrapperClassName, className, ...props },
  ref
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} id={props.id} className={wrapperClassName}>
      <input ref={ref} className={cx(fieldClasses, error && 'border-red-400', className)} {...props} />
    </FieldWrapper>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, wrapperClassName, className, children, ...props },
  ref
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} id={props.id} className={wrapperClassName}>
      <select ref={ref} className={cx(fieldClasses, error && 'border-red-400', className)} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, wrapperClassName, className, ...props },
  ref
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} id={props.id} className={wrapperClassName}>
      <textarea ref={ref} className={cx(fieldClasses, error && 'border-red-400', className)} {...props} />
    </FieldWrapper>
  );
});
