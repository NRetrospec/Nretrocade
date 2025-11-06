export function AdPanel() {
  const ads = [
    {
      id: 1,
      title: "Retro Gaming Gear",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&controls=0",
    },
    {
      id: 2,
      title: "Classic Arcade",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&controls=0",
    },
    {
      id: 3,
      title: "Gaming Accessories",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&controls=0",
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-cyan-500/30">
        <h2 className="text-lg font-bold text-cyan-300 pixel-font">SPONSORED</h2>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 p-4">
        {ads.map((ad, index) => (
          <div key={ad.id} className="flex-1 bg-black/40 border border-cyan-500/30 rounded-lg overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="p-2 border-b border-cyan-500/30">
                <h3 className="text-sm text-cyan-300 font-semibold">{ad.title}</h3>
              </div>
              <div className="h-24 relative">
                {index <= 2 ? (
                  <a
                    href="https://nretrospec.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <video
                      src={`/NRETRO-AD${index + 1}.mp4`}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  </a>
                ) : (
                  /* Placeholder for video ads */
                  <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-cyan-600/20 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="text-2xl mb-2">📺</div>
                      <p className="text-xs">Video Ad #{index + 1}</p>
                      <p className="text-xs opacity-60">Muted Autoplay</p>
                    </div>
                  </div>
                )}
                {/* In production, replace with actual video embed */}
                {/*
                <iframe
                  src={ad.videoUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
                */}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-cyan-500/30">
        <p className="text-xs text-gray-500 text-center">
          Ads help keep N Retrospec free to play
        </p>
      </div>
    </div>
  );
}
