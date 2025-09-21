import { forwardRef } from "react";

interface VideoProps {
  name: string;
  label: string;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
}

const Video = forwardRef<HTMLVideoElement, VideoProps>(
  ({ name, label, autoPlay = true, muted = false, playsInline = true }, ref) => {
    return (
      <div className="relative w-full h-full rounded-xl">
        <video 
          ref={ref}
          autoPlay={autoPlay}
          muted={muted}
          playsInline={playsInline}
          className="w-full h-full bg-white border-2 border-gray-800 object-cover"
        />
        <div className="absolute bottom-4 left-4 bg-opacity-80 text-white p-2 rounded-lg backdrop-blur-sm">
          <div className="font-bold text-sm">{name}</div>
          <div className="text-xs text-gray-300">{label}</div>
        </div>
      </div>
    );
  }
);

Video.displayName = "Video";

export default Video;
