import { forwardRef } from "react";

interface VideoProps {
  name: string;
  label: string;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  highlight?: boolean;
}

const Video = forwardRef<HTMLVideoElement, VideoProps>(
  ({ name, label, autoPlay = true, muted = false, playsInline = true, highlight = false }, ref) => {
    const borderClasses = highlight
      ? "border-green-400 shadow-[0_0_0_4px_rgba(34,197,94,0.35)]"
      : "border-gray-800";

    return (
      <div className={`relative w-full h-full rounded-xl transition-shadow duration-200 ${highlight ? 'ring-2 ring-green-500/60' : ''}`}>
        <video 
          ref={ref}
          autoPlay={autoPlay}
          muted={muted}
          playsInline={playsInline}
          className={`w-full h-full bg-white border-2 object-cover transition-colors duration-200 ${borderClasses}`}
        />
        <div className="absolute bottom-4 left-4 bg-gray-900/80 text-white p-2 rounded-lg backdrop-blur-sm">
          <div className="font-bold text-sm">{name}</div>
          <div className="text-xs text-gray-300">{label}</div>
        </div>
      </div>
    );
  }
);

Video.displayName = "Video";

export default Video;
