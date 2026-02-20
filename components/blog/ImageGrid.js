export default function ImageGrid({ images = [], columns = 2 }) {
  if (!images.length) return null

  const cols = Math.min(Math.max(columns, 2), 4)

  return (
    <div
      className="my-6 grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {images.map((img, i) => (
        <figure key={i} className="m-0">
          <img
            src={img.src}
            alt={img.alt || ''}
            loading="lazy"
            decoding="async"
            className="rounded-xl shadow-lg w-full h-auto"
          />
          {img.caption && (
            <figcaption className="text-sm text-gray-500 text-center mt-2">
              {img.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
