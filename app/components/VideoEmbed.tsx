import type React from "react"
import type { Locale } from "../types"

interface Video {
  id: number
  title: { en: string; ru: string }
  embedUrl: string
}

interface VideoEmbedProps {
  video: Video
  lang: Locale
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({ video, lang }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">{video.title[lang]}</h3>
      <div className="aspect-w-16 aspect-h-9">
        <iframe
          src={video.embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      </div>
    </div>
  )
}

export default VideoEmbed

