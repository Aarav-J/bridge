 "use client";

import { io, Socket } from "socket.io-client";
import { useRef, useEffect, useState } from "react";

const configuration: RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
    },
  ],
  iceCandidatePoolSize: 10,
};

interface SocketMessage {
  type: string;
  sdp?: string;
  candidate?: string | undefined;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

const socket: Socket = io("http://localhost:3000", { transports: ["websocket"] });

export default function VideoCall() {
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const hangupButtonRef = useRef<HTMLButtonElement>(null);
  const muteAudButtonRef = useRef<HTMLButtonElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null); 

  useEffect(() => {
    socket.on("message", (e: SocketMessage) => {
      if (!localStream) {
        console.log("not ready yet");
        return;
      }
      switch (e.type) {
        case "offer":
          handleOffer(e);
          break;
        case "answer":
          handleAnswer(e);
          break;
        case "candidate":
          handleCandidate(e);
          break;
        case "ready":
          if (pc) {
            console.log("peer connection already exists");
            return;
          }
          makeCall();
          break;
        case "bye":
          if (pc) {
            hangup();
          }
          break;
        default:
          console.log("unknown message type:", e.type);
          break;
      }
    });

    return () => {
      socket.off("message");
    };
  }, [localStream, pc]);

  const startLocalStream = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      if (startButtonRef.current) {
        startButtonRef.current.disabled = true;
      }
      if (hangupButtonRef.current) {
        hangupButtonRef.current.disabled = false;
      }
      if (muteAudButtonRef.current) {
        muteAudButtonRef.current.disabled = false;
      }
      
      // Signal that we're ready for a call
      socket.emit("message", { type: "ready" });
      
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

  const toggleMute = (): void => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        if (muteAudButtonRef.current) {
          muteAudButtonRef.current.textContent = audioTrack.enabled ? "Mute Audio" : "Unmute Audio";
        }
      }
    }
  };

  const makeCall = async (): Promise<void> => {
    try {
      const newPc = new RTCPeerConnection(configuration);
      setPc(newPc);
      
      newPc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
        const message: SocketMessage = {
          type: "candidate",
          candidate: e.candidate?.candidate,
          sdpMid: e.candidate?.sdpMid || null,
          sdpMLineIndex: e.candidate?.sdpMLineIndex || null,
        };
        socket.emit("message", message);
      };
      
      newPc.ontrack = (e: RTCTrackEvent) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
      
      if (localStream) {
        localStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (localStream) {
            newPc.addTrack(track, localStream);
          }
        });
        
        const offer = await newPc.createOffer();
        socket.emit("message", { type: "offer", sdp: offer.sdp });
        await newPc.setLocalDescription(offer);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleOffer = async (offer: SocketMessage): Promise<void> => {
    if (pc) {
      console.error("existing peerconnection");
      return;
    }
    try {
      const newPc = new RTCPeerConnection(configuration);
      setPc(newPc);
      
      newPc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
        const message: SocketMessage = {
          type: "candidate",
          candidate: e.candidate?.candidate,
          sdpMid: e.candidate?.sdpMid || null,
          sdpMLineIndex: e.candidate?.sdpMLineIndex || null,
        };
        socket.emit("message", message);
      };
      
      newPc.ontrack = (e: RTCTrackEvent) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
      
      if (localStream) {
        localStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (localStream) {
            newPc.addTrack(track, localStream);
          }
        });
      }
      
      await newPc.setRemoteDescription({ type: "offer", sdp: offer.sdp || "" });
      const answer = await newPc.createAnswer();
      socket.emit("message", { type: "answer", sdp: answer.sdp });
      await newPc.setLocalDescription(answer);
    } catch (e) {
      console.log(e);
    }
  };

  const handleAnswer = async (answer: SocketMessage): Promise<void> => {
    if (!pc) {
      console.error("no peerconnection");
      return;
    }
    try {
      await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp || "" });
    } catch (e) {
      console.log(e);
    }
  };

  const handleCandidate = async (candidate: SocketMessage): Promise<void> => {
    try {
      if (!pc) {
        console.error("no peerconnection");
        return;
      }
      if (!candidate.candidate) {
        await pc.addIceCandidate(null);
      } else {
        const iceCandidate = new RTCIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        });
        await pc.addIceCandidate(iceCandidate);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const hangup = async (): Promise<void> => {
    if (pc) {
      pc.close();
      setPc(null);
    }
    if (localStream) {
      localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setLocalStream(null);
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Reset button states
    if (startButtonRef.current) {
      startButtonRef.current.disabled = false;
    }
    if (hangupButtonRef.current) {
      hangupButtonRef.current.disabled = true;
    }
    if (muteAudButtonRef.current) {
      muteAudButtonRef.current.disabled = true;
      muteAudButtonRef.current.textContent = "Mute Audio";
    }
    
    // Signal hangup to other peer
    socket.emit("message", { type: "bye" });
  };

  return (
    <div className="flex flex-col items-center p-5 max-w-6xl mx-auto">
      <div className="flex gap-5 mb-5 flex-wrap justify-center">
        <video 
          ref={localVideoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-96 h-72 bg-black border-2 border-gray-700 rounded-lg object-cover"
        />
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-96 h-72 bg-black border-2 border-gray-700 rounded-lg object-cover"
        />
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <button 
          ref={startButtonRef} 
          onClick={startLocalStream}
          className="px-6 py-3 text-base border-none rounded-md cursor-pointer bg-blue-600 text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Start Call
        </button>
        <button 
          ref={hangupButtonRef} 
          disabled 
          onClick={hangup}
          className="px-6 py-3 text-base border-none rounded-md cursor-pointer bg-blue-600 text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Hang Up
        </button>
        <button 
          ref={muteAudButtonRef} 
          disabled 
          onClick={toggleMute}
          className="px-6 py-3 text-base border-none rounded-md cursor-pointer bg-blue-600 text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Mute Audio
        </button>
      </div>
    </div>
  );
}