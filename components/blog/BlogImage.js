export default function BlogImage({ src, alt, width, height, ...props }) {
  if (!src) return null

  return (
    <span className="block my-6">
      <img
        src={src}
        alt={alt || ''}
        width={width || undefined}
        height={height || undefined}
        loading="lazy"
        decoding="async"
        className={`rounded-xl shadow-lg border-solid mx-auto h-auto ${width ? '' : 'w-full'}`}
        {...props}
      />
    </span>
  )
}
