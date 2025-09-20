import React from "react";

interface ControlPanelProps {
  onStartCall: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
  isCallActive: boolean;
  startButtonRef: React.RefObject<HTMLButtonElement | null>;
  hangupButtonRef: React.RefObject<HTMLButtonElement | null>;
  muteButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onStartCall,
  onHangup,
  onToggleMute,
  isCallActive,
  startButtonRef,
  hangupButtonRef,
  muteButtonRef
}) => {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-full px-6 py-3">
      <button 
        ref={startButtonRef}
        onClick={onStartCall}
        disabled={isCallActive}
        className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold transition-colors duration-200"
        title="Start Call"
      >
        📞
      </button>
      
      <button 
        ref={hangupButtonRef}
        onClick={onHangup}
        disabled={!isCallActive}
        className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold transition-colors duration-200"
        title="Hang Up"
      >
        📞
      </button>
      
      <button 
        ref={muteButtonRef}
        onClick={onToggleMute}
        disabled={!isCallActive}
        className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold transition-colors duration-200"
        title="Toggle Mute"
      >
        🎤
      </button>
    </div>
  );
};

export default ControlPanel;