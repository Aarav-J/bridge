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

const socket: Socket = io("http://10.186.63.83:3000", { transports: ["websocket"] });

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
      
      // Announce this user's presence to the server
      console.log('Sending userJoin message to server');
      socket.emit("message", {
        type: "userJoin",
        userName: userData.name,
        userAffiliation: userData.affiliation
      });
    } else {
      console.log('No user data found in localStorage');
    }

    // Set up a global listener for user information
    const handleSocketMessage = (message: any) => {
      console.log("Received socket message:", message);
      
      if (message.type === "userJoin") {
        console.log("User joined:", message);
        
        // Check if this is our own message (same socket) or from another user
        if (message.socketId !== socket.id) {
          // This is a different user joining, set them as remote user (only if we don't already have one)
          if (!remoteUser) {
            console.log('Setting remote user from message:', message);
            setRemoteUser({
              name: message.userName,
              affiliation: message.userAffiliation
            });
          }
        } else {
          // This is our own join message, confirm local user
          console.log('Confirming local user from our own message:', message);
          setLocalUser({
            name: message.userName,
            affiliation: message.userAffiliation
          });
        }
      }
    };

    // Set up listener for user information
    socket.on("message", handleSocketMessage);

    // Set up debate timer listeners (this should take priority for setting remote users)
    socket.on('userJoined', (data: { user: UserInfo; position: string }) => {
      console.log('User joined via userJoined event:', data);
      console.log('Current local user:', localUser);
      console.log('Current remote user:', remoteUser);
      
      // Always set this as the remote user
      setRemoteUser(data.user);
      
      // Set our position - this is telling us about THEIR position, so we need the opposite
      const myPosition = data.position === 'user1' ? 'user2' : 'user1';
      console.log(`They are ${data.position}, so I am ${myPosition}`);
      setUserPosition(myPosition);
    });

    socket.on('yourPosition', (data: { position: string; totalParticipants: number }) => {
      console.log('Received my position:', data);
      setUserPosition(data.position);
    });

    socket.on('phaseStart', (data: { phase: number; speaker: string; description: string; duration: number }) => {
      console.log('Phase started:', data);
      setDebateActive(true);
      setCurrentPhase(data.phase);
      setCurrentSpeaker(data.speaker);
      setPhaseDescription(data.description);
      setTimeRemaining(data.duration);
      
      // Determine if this user can speak
      const canUserSpeak = data.speaker === userPosition;
      setCanSpeak(canUserSpeak);
      
      // Mute/unmute audio based on speaking turn
      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = canUserSpeak;
        });
      }
    });

    socket.on('timeUpdate', (data: { timeRemaining: number }) => {
      setTimeRemaining(data.timeRemaining);
    });

    socket.on('debateFinished', () => {
      console.log('Debate finished');
      setDebateActive(false);
      setCurrentPhase(0);
      setTimeRemaining(0);
      setCurrentSpeaker(null);
      setPhaseDescription("");
      setCanSpeak(true);
      
      // Unmute audio when debate ends
      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = true;
        });
      }
    });

    return () => {
      socket.off("message", handleSocketMessage);
      socket.off('userJoined');
      socket.off('yourPosition');
      socket.off('phaseStart');
      socket.off('timeUpdate');
      socket.off('debateFinished');
    };
  }, []);

  // Handle audio muting based on speaking turns
  useEffect(() => {
    if (localStream && debateActive) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = canSpeak;
      });
      console.log(`Audio ${canSpeak ? 'enabled' : 'muted'} for debate`);
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

  // Send ready message when both local stream and remote user are available
  useEffect(() => {
    if (localStream && remoteUser && !pc) {
      console.log("Both users detected, sending ready signal");
      socket.emit("message", { 
        type: "ready", 
        userName: localUser.name, 
        userAffiliation: localUser.affiliation 
      });
    }
  }, [localStream, remoteUser, pc, localUser, socket]);

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
          console.log("Received ready message from remote user", e);
          if (pc) {
            console.log("peer connection already exists");
            return;
          }
          // Only make call if we have a remote user and local stream
          if (remoteUser && localStream) {
            console.log("Both users ready, initiating call");
            makeCall();
          } else {
            console.log("Not ready yet - remoteUser:", !!remoteUser, "localStream:", !!localStream);
          }
          break;
        case "userInfo":
          if (e.userName && e.userAffiliation) {
            setRemoteUser({
              name: e.userName,
              affiliation: e.userAffiliation
            });
          }
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
  }, [localStream, pc, localUser]);

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
      
      console.log("Local stream started successfully");
      
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

  const toggleVideo = (): void => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];
      
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        
        // When video is off, audio should also be off
        if (audioTrack) {
          audioTrack.enabled = videoTrack.enabled;
        }
      }
    }
  };

  const addFiveMinutes = (): void => {
    // Placeholder for adding 5 minutes functionality
    console.log("Adding 5 minutes to call time");
    // You can implement actual timer logic here
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
    socket.emit("message", { type: "bye" });
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
        </div>
        
        {/* Bottom video - Remote user - 50% of vertical space */}
        <div className="h-1/2 relative overflow-hidden">
          <Video 
            ref={remoteVideoRef}
            name={remoteUser?.name || "Waiting for participant..."}
            label={remoteUser?.affiliation || ""}
          />
        </div>
      </div>
      
      {/* Right panel - 50% of horizontal space for debate timer */}
      <div className="w-1/2 h-full bg-gray-800 flex flex-col">
        {/* Timer Section */}
        {debateActive && (
          <div className="bg-gray-900 p-6 m-4 rounded-lg">
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-4">Debate Timer</h2>
              
              {/* Phase Information */}
              <div className="mb-4">
                <div className="text-lg text-blue-300 mb-2">
                  Phase {currentPhase + 1} of 6
                </div>
                <div className="text-gray-300">
                  {phaseDescription}
                </div>
              </div>
              
              {/* Time Remaining */}
              <div className="mb-4">
                <div className="text-4xl font-mono text-green-400 mb-2">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-400">
                  Time Remaining
                </div>
              </div>
              
              {/* Current Speaker */}
              <div className="mb-4">
                <div className={`text-lg font-semibold ${canSpeak ? 'text-green-400' : 'text-red-400'}`}>
                  {canSpeak ? 'YOUR TURN TO SPEAK' : 'LISTENING'}
                </div>
                <div className="text-sm text-gray-400">
                  Current Speaker: {currentSpeaker === userPosition ? 'You' : 'Opponent'}
                </div>
              </div>
              
              {/* Audio Status */}
              <div className={`text-sm p-2 rounded ${canSpeak ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                {canSpeak ? '🎤 Microphone Active' : '🔇 Microphone Muted'}
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
                  onClick={() => socket.emit('startDebate')}
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