import React from 'react';

export default function VideoPlayer({ videoLink, title }) {
  // Convert YouTube URL to embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^?&"'>]+)/);
    if (videoId && videoId[1]) {
      return `https://www.youtube.com/embed/${videoId[1]}`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(videoLink);

  if (!embedUrl) {
    return (
      <div className="bg-slate-100 rounded-xl p-8 text-center">
        <p className="text-slate-500">Video not available</p>
        <a 
          href={videoLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-emerald-600 hover:underline mt-2 inline-block"
        >
          Open video in new tab
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}