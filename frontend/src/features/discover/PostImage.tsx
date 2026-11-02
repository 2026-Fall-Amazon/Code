// Shows one post image from S3. The bucket is private, so each image needs a
// short-lived signed URL, fetched (and cached) by imageUrl().
import { ImageOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { imageUrl } from './postApi'

type PostImageProps = {
  path: string
  alt: string
  className?: string
}

export function PostImage({ path, alt, className = '' }: PostImageProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    imageUrl(path)
      .then((signed) => {
        if (!cancelled) setUrl(signed)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [path])

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-page text-gray-400 ${className}`}>
        <ImageOff size={24} aria-label="Image unavailable" />
      </div>
    )
  }

  if (!url) return <div aria-hidden="true" className={`animate-pulse bg-page ${className}`} />

  return <img src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`bg-page object-cover ${className}`} />
}
