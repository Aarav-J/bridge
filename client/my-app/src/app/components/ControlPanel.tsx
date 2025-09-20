import React from "react";

interface ControlPanelProps {
  onHangup: () => void;
  onToggleVideo: () => void;
  onAddTime: () => void;
  isCallActive: boolean;
  isVideoOn: boolean;
  hangupButtonRef: React.RefObject<HTMLButtonElement | null>;
  videoButtonRef: React.RefObject<HTMLButtonElement | null>;
  timeButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onHangup,
  onToggleVideo,
  onAddTime,
  isCallActive,
  isVideoOn,
  hangupButtonRef,
  videoButtonRef,
  timeButtonRef
}) => {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-full px-6 py-3">
      {/* Hang up call button */}
      <button 
        ref={hangupButtonRef}
        onClick={onHangup}
        disabled={!isCallActive}
        className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold transition-colors duration-200"
        title="Hang Up Call"
      >
        📞
      </button>
      
      {/* Stop/Start video button */}
      <button 
        ref={videoButtonRef}
        onClick={onToggleVideo}
        disabled={!isCallActive}
        className={`w-12 h-12 rounded-full ${isVideoOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold transition-colors duration-200`}
        title={isVideoOn ? "Stop Video" : "Start Video"}
      >
        �
      </button>
      
      {/* +5 minute button */}
      <button 
        ref={timeButtonRef}
        onClick={onAddTime}
        disabled={!isCallActive}
        className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold transition-colors duration-200"
        title="Add 5 Minutes"
      >
        ⏰
      </button>
    </div>
  );
};

export default ControlPanel;