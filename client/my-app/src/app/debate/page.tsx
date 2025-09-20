"use client";

import { io, Socket } from "socket.io-client";
import { useRef, useEffect, useState } from "react";
import Video from "../components/Video";
import ControlPanel from "../components/ControlPanel";
import { useRouter } from "next/navigation";

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
  userName?: string;
  userAffiliation?: string;
}

interface UserInfo {
  name: string;
  affiliation: string;
}

const socket: Socket = io("http://localhost:3001", { transports: ["websocket"] });

export default function DebatePage() {
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [remoteUser, setRemoteUser] = useState<UserInfo | null>(null);
  const [localUser, setLocalUser] = useState<UserInfo>({ name: "Anonymous", affiliation: "Unknown" });
  const [userPosition, setUserPosition] = useState<string | null>(null); // "user1" or "user2"
  
  // Debate timer states
  const [debateActive, setDebateActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [phaseDescription, setPhaseDescription] = useState("");
  const [canSpeak, setCanSpeak] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  
  // Audio volume states
  const [localVolume, setLocalVolume] = useState(0);
  const [remoteVolume, setRemoteVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const router = useRouter();
  
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const hangupButtonRef = useRef<HTMLButtonElement>(null);
  const videoButtonRef = useRef<HTMLButtonElement>(null);
  const timeButtonRef = useRef<HTMLButtonElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null); 
  useEffect(() => {
    // Auto-start the call when component mounts
    startLocalStream();

    // Get user data from localStorage (set from main page)
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      console.log('Setting local user from localStorage:', userData);
      setLocalUser(userData);
      
      // Join the debate room
      console.log('Joining debate with user data:', userData);
      socket.emit("join-debate", {
        name: userData.name,
        affiliation: userData.affiliation
      });
    } else {
      console.log('No user data found in localStorage');
    }

    // Set up socket event listeners
    socket.on("joined-debate", (data) => {
      console.log("Successfully joined debate:", data);
      setUserPosition(data.position);
      
      // Set remote user if there's another participant
      Object.keys(data.participants).forEach(pos => {
        if (pos !== data.position) {
          const participant = data.participants[pos];
          setRemoteUser({
            name: participant.name,
            affiliation: participant.affiliation
          });
        }
      });
    });

    socket.on("user-joined", (data) => {
      console.log("Another user joined:", data);
      setRemoteUser(data.user);
    });

    socket.on("user-left", (data) => {
      console.log("User left:", data);
      setRemoteUser(null);
      setDebateActive(false);
    });

    socket.on("room-full", () => {
      console.log("Room is full");
      alert("Debate room is full. Only 2 participants allowed at a time.");
      router.push('/');
    });

    socket.on("phase-start", (data) => {
      console.log("Phase started:", data);
      setDebateActive(true);
      setCurrentPhase(data.phase);
      setCurrentSpeaker(data.speaker);
      setPhaseDescription(data.description);
      setTimeRemaining(data.duration);
    });

    socket.on("time-update", (data) => {
      setTimeRemaining(data.timeRemaining);
    });

    socket.on("debate-finished", () => {
      console.log("Debate finished");
      setDebateActive(false);
      setCurrentPhase(0);
      setTimeRemaining(0);
      setCurrentSpeaker(null);
      setPhaseDescription("");
      setCanSpeak(true);
    });

    // Handle WebRTC signaling
    socket.on("webrtc-signal", (data) => {
      console.log("Received WebRTC signal:", data.type);
      if (!localStream) {
        console.log("Local stream not ready yet");
        return;
      }
      
      switch (data.type) {
        case "offer":
          handleOffer(data);
          break;
        case "answer":
          handleAnswer(data);
          break;
        case "candidate":
          handleCandidate(data);
          break;
        case "ready":
          if (remoteUser && localStream) {
            console.log("Both users ready, initiating call");
            makeCall();
          }
          break;
        case "bye":
          if (pc) {
            hangup();
          }
          break;
      }
    });

    // Cleanup function
    return () => {
      socket.off("joined-debate");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-full");
      socket.off("phase-start");
      socket.off("time-update");
      socket.off("debate-finished");
      socket.off("webrtc-signal");
      
      // Cleanup audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update canSpeak state when userPosition or currentSpeaker changes
  useEffect(() => {
    if (userPosition && currentSpeaker && debateActive) {
      const canUserSpeak = currentSpeaker === userPosition;
      console.log('Updating canSpeak:', canUserSpeak, 'because currentSpeaker:', currentSpeaker, 'userPosition:', userPosition);
      setCanSpeak(canUserSpeak);
    } else if (!debateActive) {
      // Outside of debate, everyone can speak
      setCanSpeak(true);
    }
  }, [userPosition, currentSpeaker, debateActive]);

  // Handle audio muting based on speaking turns
  useEffect(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      
      if (debateActive) {
        // During debate: follow the canSpeak rules
        console.log(`Setting audio tracks enabled to: ${canSpeak} (found ${audioTracks.length} tracks)`);
        audioTracks.forEach(track => {
          track.enabled = canSpeak;
          console.log(`Audio track ${track.id} enabled: ${track.enabled}`);
        });
        console.log(`Audio ${canSpeak ? 'enabled' : 'muted'} for debate`);
      } else {
        // Before/after debate: audio should be enabled for everyone
        console.log(`Debate not active - enabling audio for all users`);
        audioTracks.forEach(track => {
          track.enabled = true;
        });
      }
    }
  }, [canSpeak, localStream, debateActive]);

  // Debug logging for UI state
  useEffect(() => {
    console.log('UI State changed:', {
      localUser: localUser.name,
      remoteUser: remoteUser?.name || 'None',
      userPosition,
      debateActive
    });
  }, [localUser, remoteUser, userPosition, debateActive]);

  // Audio volume analysis functions
  const analyzeAudio = (analyser: AnalyserNode, setVolume: (volume: number) => void) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const getVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      
      const average = sum / bufferLength;
      const volume = Math.round((average / 255) * 100); // Convert to percentage
      setVolume(volume);
    };
    
    return getVolume;
  };

  const startVolumeAnalysis = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const analyzeLoop = () => {
      if (localAnalyserRef.current) {
        analyzeAudio(localAnalyserRef.current, setLocalVolume)();
      }
      if (remoteAnalyserRef.current) {
        analyzeAudio(remoteAnalyserRef.current, setRemoteVolume)();
      }
      animationFrameRef.current = requestAnimationFrame(analyzeLoop);
    };

    analyzeLoop();
  };

  const setupAudioAnalysis = (stream: MediaStream, isLocal: boolean) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    if (isLocal) {
      localAnalyserRef.current = analyser;
    } else {
      remoteAnalyserRef.current = analyser;
    }
  };

  // Set up audio analysis when streams are available
  useEffect(() => {
    if (localStream) {
      setupAudioAnalysis(localStream, true);
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current?.srcObject) {
      const remoteStream = remoteVideoRef.current.srcObject as MediaStream;
      if (remoteStream.getAudioTracks().length > 0) {
        setupAudioAnalysis(remoteStream, false);
      }
    }
  }, [remoteVideoRef.current?.srcObject]);

  // Start volume analysis when both analysers are ready
  useEffect(() => {
    if (localAnalyserRef.current || remoteAnalyserRef.current) {
      startVolumeAnalysis();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [localAnalyserRef.current, remoteAnalyserRef.current]);

  // Send ready signal when both local stream and remote user are available
  useEffect(() => {
    if (localStream && remoteUser && !pc) {
      console.log("Both users detected, sending WebRTC ready signal");
      setTimeout(() => {
        socket.emit("webrtc-signal", { 
          type: "ready"
        });
      }, 1000);
    }
  }, [localStream, remoteUser, pc]);

  const startLocalStream = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      setIsCallActive(true);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      if (startButtonRef.current) {
        startButtonRef.current.disabled = true;
      }
      if (hangupButtonRef.current) {
        hangupButtonRef.current.disabled = false;
      }
      if (videoButtonRef.current) {
        videoButtonRef.current.disabled = false;
      }
      if (timeButtonRef.current) {
        timeButtonRef.current.disabled = false;
      }
      
      // Ensure audio is enabled by default
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = true;
      });
      
      console.log("Local stream started successfully with audio enabled");
      
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

  const toggleVideo = (): void => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        
        // Don't touch audio when toggling video - audio is controlled by debate muting logic
        console.log(`Video toggled to: ${videoTrack.enabled}`);
      }
    }
  };

  const toggleAudio = (): void => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      const newAudioState = !isAudioOn;
      setIsAudioOn(newAudioState);
      audioTracks.forEach(track => {
        track.enabled = newAudioState;
        console.log(`Audio manually toggled to: ${track.enabled}`);
      });
    }
  };

  const addFiveMinutes = (): void => {
    // Placeholder for adding 5 minutes functionality
    console.log("Adding 5 minutes to call time");
    // You can implement actual timer logic here
  };

  const makeCall = async (): Promise<void> => {
    try {
      console.log("Making call - creating peer connection");
      const newPc = new RTCPeerConnection(configuration);
      setPc(newPc);
      
      newPc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
        const data = {
          type: "candidate",
          candidate: e.candidate?.candidate,
          sdpMid: e.candidate?.sdpMid || null,
          sdpMLineIndex: e.candidate?.sdpMLineIndex || null,
        };
        console.log("Sending ICE candidate");
        socket.emit("webrtc-signal", data);
      };
      
      newPc.ontrack = (e: RTCTrackEvent) => {
        console.log("Received remote track", e.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
      
      if (localStream) {
        console.log("Adding local tracks to peer connection");
        localStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (localStream) {
            newPc.addTrack(track, localStream);
          }
        });
        
        console.log("Creating and sending offer");
        const offer = await newPc.createOffer();
        socket.emit("webrtc-signal", { type: "offer", sdp: offer.sdp });
        await newPc.setLocalDescription(offer);
      }
    } catch (e) {
      console.error("Error in makeCall:", e);
    }
  };

  const handleOffer = async (offer: SocketMessage): Promise<void> => {
    if (pc) {
      console.error("existing peerconnection");
      return;
    }
    try {
      console.log("Received offer, creating peer connection");
      const newPc = new RTCPeerConnection(configuration);
      setPc(newPc);
      
      newPc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
        const data = {
          type: "candidate",
          candidate: e.candidate?.candidate,
          sdpMid: e.candidate?.sdpMid || null,
          sdpMLineIndex: e.candidate?.sdpMLineIndex || null,
        };
        console.log("Sending ICE candidate from answer side");
        socket.emit("webrtc-signal", data);
      };
      
      newPc.ontrack = (e: RTCTrackEvent) => {
        console.log("Received remote track on answer side", e.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
      
      if (localStream) {
        console.log("Adding local tracks on answer side");
        localStream.getTracks().forEach((track: MediaStreamTrack) => {
          if (localStream) {
            newPc.addTrack(track, localStream);
          }
        });
      }
      
      console.log("Setting remote description and creating answer");
      await newPc.setRemoteDescription({ type: "offer", sdp: offer.sdp || "" });
      const answer = await newPc.createAnswer();
      socket.emit("webrtc-signal", { type: "answer", sdp: answer.sdp });
      await newPc.setLocalDescription(answer);
    } catch (e) {
      console.error("Error in handleOffer:", e);
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
    
    setIsCallActive(false);
    
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
    if (videoButtonRef.current) {
      videoButtonRef.current.disabled = true;
    }
    if (timeButtonRef.current) {
      timeButtonRef.current.disabled = true;
    }
    
    // Signal hangup to other peer
    socket.emit("webrtc-signal", { type: "bye" });
    router.push('/'); // Redirect to landing page after hangup
  };

  return (
    <div className="h-screen bg-gray-900 relative flex overflow-hidden">
      {/* Video panel - 50% of horizontal space */}
      <div className="w-1/2 h-full flex flex-col">
        {/* Top video - Local user - 50% of vertical space */}
        <div className="h-1/2 relative overflow-hidden">
          <Video 
            ref={localVideoRef}
            name={localUser.name === "Anonymous" ? "You" : localUser.name}
            label={localUser.affiliation === "Unknown" ? "Setting up..." : localUser.affiliation}
            muted={true}
          />
          {/* Local volume indicator */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 rounded-lg p-2 min-w-20">
            <div className="text-white text-xs mb-1">Volume</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-8 bg-gray-600 rounded-sm relative overflow-hidden">
                <div 
                  className={`absolute bottom-0 w-full transition-all duration-100 rounded-sm ${
                    localVolume > 70 ? 'bg-red-500' : 
                    localVolume > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ height: `${Math.min(localVolume, 100)}%` }}
                />
              </div>
              <div className="text-white text-xs font-mono">
                {localVolume}dB
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom video - Remote user - 50% of vertical space */}
        <div className="h-1/2 relative overflow-hidden">
          <Video 
            ref={remoteVideoRef}
            name={remoteUser?.name || "Waiting for participant..."}
            label={remoteUser?.affiliation || ""}
          />
          {/* Remote volume indicator */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 rounded-lg p-2 min-w-20">
            <div className="text-white text-xs mb-1">Volume</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-8 bg-gray-600 rounded-sm relative overflow-hidden">
                <div 
                  className={`absolute bottom-0 w-full transition-all duration-100 rounded-sm ${
                    remoteVolume > 70 ? 'bg-red-500' : 
                    remoteVolume > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ height: `${Math.min(remoteVolume, 100)}%` }}
                />
              </div>
              <div className="text-white text-xs font-mono">
                {remoteVolume}dB
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right panel - 50% of horizontal space for debate timer */}
      <div className="w-1/2 h-full bg-gray-800 flex flex-col">
        
        {/* Topic and Facts Section */}
        <div className="bg-gray-900 p-4 m-4 rounded-lg">
          <div className="text-white">
            <h2 className="text-xl font-bold mb-3 text-center">Debate Topic</h2>
            <div className="bg-blue-900 bg-opacity-50 p-3 rounded-lg mb-4">
              <p className="text-blue-100 text-center text-sm leading-relaxed">
                "Should artificial intelligence be regulated by government agencies?"
              </p>
            </div>
            
            <h3 className="text-md font-semibold mb-2 text-center">Key Facts</h3>
            <div className="bg-gray-800 p-3 rounded-lg space-y-2">
              <div className="text-xs text-gray-300">
                • AI market projected to reach $1.8 trillion by 2030
              </div>
              <div className="text-xs text-gray-300">
                • 85% of businesses plan to implement AI by 2025
              </div>
              <div className="text-xs text-gray-300">
                • Current AI regulations vary significantly between countries
              </div>
              <div className="text-xs text-gray-300">
                • 67% of consumers express concerns about AI privacy
              </div>
            </div>
          </div>
        </div>

        {/* Compact Timer Section */}
        {debateActive && (
          <div className="bg-gray-900 p-3 m-4 rounded-lg">
            <div className="text-center text-white">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-blue-300">
                  Phase {currentPhase + 1}/6
                </div>
                <div className="text-lg font-mono text-green-400">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              </div>
              
              <div className="text-xs text-gray-300 mb-2">
                {phaseDescription}
              </div>
              
              <div className={`text-sm font-semibold mb-1 ${canSpeak ? 'text-green-400' : 'text-red-400'}`}>
                {canSpeak ? '🎤 YOUR TURN' : '🔇 LISTENING'}
              </div>
              
              <div className={`text-xs p-2 rounded ${canSpeak ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                {currentSpeaker === userPosition ? 'You are speaking' : `${remoteUser?.name || 'Opponent'} is speaking`}
              </div>
            </div>
          </div>
        )}
        
        {/* User Information Section */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            {localUser.name === "Anonymous" ? (
              <div className="text-white">
                <div className="text-xl mb-4">Setting up your session...</div>
                <div className="text-gray-400 mb-6">
                  Make sure you joined from the main page or wait for connection.
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  Go to Main Page
                </button>
              </div>
            ) : !remoteUser ? (
              <div className="text-white">
                <div className="text-xl mb-4">Welcome, {localUser.name}!</div>
                <div className="text-gray-400 mb-4">
                  Waiting for another participant to join the debate...
                </div>
                <div className="text-sm text-blue-300 mb-4">
                  The debate will start automatically when both participants are ready.
                </div>
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              </div>
            ) : !debateActive ? (
              <div className="text-white">
                <div className="text-xl mb-4">Ready to Debate!</div>
                <div className="text-gray-400 mb-4">
                  You are connected with {remoteUser.name}
                </div>
                <div className="text-sm text-green-300 mb-4">
                  The debate will begin shortly...
                </div>
                <button
                  onClick={() => socket.emit('start-debate')}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                >
                  Start Debate
                </button>
              </div>
            ) : (
              <div className="text-white">
                <div className="text-xl mb-4">Debate in Progress</div>
                <div className="text-gray-400 mb-4">
                  Debating with {remoteUser.name}
                </div>
                <div className="text-sm text-blue-300">
                  Your position: {userPosition === 'user1' ? 'Opening' : 'Responding'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Control panel overlay */}
      <ControlPanel
        onHangup={hangup}
        onToggleVideo={toggleVideo}
        onAddTime={addFiveMinutes}
        isCallActive={isCallActive}
        isVideoOn={isVideoOn}
        hangupButtonRef={hangupButtonRef}
        videoButtonRef={videoButtonRef}
        timeButtonRef={timeButtonRef}
      />
    </div>
  );
}