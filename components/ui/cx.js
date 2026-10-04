// Joins class names, skipping falsy values.
export default function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}
