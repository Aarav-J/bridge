require("dotenv").config(); 

const express = require("express"); 
const cors = require("cors"); 
const app = express(); 

app.use(cors());
const server = require("http").createServer(app);
const io = require("socket.io")(server, { 
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
}); 

const port = 3000; 

// Error handling middleware
function errorHandler(err, req, res, next) { 
    console.error(err.stack); 
    res.status(500).send("Internal Server Error");
}
app.use(errorHandler);

// Debate timer configuration
const DEBATE_PHASES = [
    { phase: 1, duration: 30, speaker: "user1", description: "Opening statement - User 1" },
    { phase: 2, duration: 30, speaker: "user2", description: "Opening statement - User 2" },
    { phase: 3, duration: 120, speaker: "user1", description: "Main argument - User 1" },
    { phase: 4, duration: 120, speaker: "user2", description: "Main argument - User 2" },
    { phase: 5, duration: 60, speaker: "user1", description: "Closing statement - User 1" },
    { phase: 6, duration: 60, speaker: "user2", description: "Closing statement - User 2" }
];

// Global debate state
let debateState = {
    active: false,
    currentPhase: 0,
    timeRemaining: 0,
    currentSpeaker: null,
    participants: {},
    timer: null
};

function startDebateTimer() {
    if (debateState.currentPhase >= DEBATE_PHASES.length) {
        // Debate finished
        io.emit("message", {
            type: "debateFinished"
        });
        resetDebateState();
        return;
    }

    const currentPhaseData = DEBATE_PHASES[debateState.currentPhase];
    debateState.timeRemaining = currentPhaseData.duration;
    debateState.currentSpeaker = currentPhaseData.speaker;

    console.log(`Starting phase ${currentPhaseData.phase}: ${currentPhaseData.description}`);

    // Broadcast phase start
    io.emit("phaseStart", {
        phase: currentPhaseData.phase,
        duration: currentPhaseData.duration,
        speaker: currentPhaseData.speaker,
        description: currentPhaseData.description
    });

    // Start countdown timer
    debateState.timer = setInterval(() => {
        debateState.timeRemaining--;

        // Broadcast time update every second
        io.emit("timeUpdate", {
            timeRemaining: debateState.timeRemaining
        });

        if (debateState.timeRemaining <= 0) {
            clearInterval(debateState.timer);
            debateState.currentPhase++;
            
            if (debateState.currentPhase >= DEBATE_PHASES.length) {
                // Debate finished
                io.emit("debateFinished");
                resetDebateState();
                return;
            }
            
            // Start next phase after a brief pause
            setTimeout(() => {
                startDebateTimer();
            }, 1000);
        }
    }, 1000);
}

function resetDebateState() {
    if (debateState.timer) {
        clearInterval(debateState.timer);
    }
    debateState = {
        active: false,
        currentPhase: 0,
        timeRemaining: 0,
        currentSpeaker: null,
        participants: {},
        timer: null
    };
}

io.on("connection", (socket) => { 
    console.log("User connected:", socket.id);
    
    // Store user info when provided
    socket.userInfo = null;

    socket.on("message", (message) => {
        console.log("Message received:", message.type, socket.id);
        
        // Handle user join messages
        if (message.type === "userJoin") {
            if (message.userName && message.userAffiliation) {
                socket.userInfo = {
                    name: message.userName,
                    affiliation: message.userAffiliation,
                    socketId: socket.id,
                    joinedAt: new Date().toISOString()
                };
                
                // Assign user position (user1 or user2)
                const participantCount = Object.keys(debateState.participants).length;
                const userPosition = participantCount === 0 ? "user1" : "user2";
                
                debateState.participants[userPosition] = {
                    socketId: socket.id,
                    name: message.userName,
                    affiliation: message.userAffiliation
                };
                
                console.log(`User joined as ${userPosition}:`, {
                    name: socket.userInfo.name,
                    affiliation: socket.userInfo.affiliation,
                    socketId: socket.id
                });
                
                console.log('Current participants:', debateState.participants);
                
                // Send information about existing users to the new user
                Object.keys(debateState.participants).forEach(pos => {
                    const participant = debateState.participants[pos];
                    if (participant.socketId !== socket.id) {
                        // Tell the new user about existing participants
                        console.log(`Telling new user ${socket.id} about existing user ${participant.socketId} in position ${pos}`);
                        socket.emit("userJoined", {
                            user: {
                                name: participant.name,
                                affiliation: participant.affiliation
                            },
                            position: pos
                        });
                    }
                });
                
                // Tell other users about the new user joining
                console.log(`Broadcasting new user ${userPosition} to other clients`);
                socket.broadcast.emit("userJoined", {
                    user: {
                        name: message.userName,
                        affiliation: message.userAffiliation
                    },
                    position: userPosition
                });
                
                // Tell this user their own position
                socket.emit("yourPosition", {
                    position: userPosition,
                    totalParticipants: Object.keys(debateState.participants).length
                });
                
                // Also broadcast the legacy format for backward compatibility
                io.emit("message", {
                    type: "userJoin",
                    userName: message.userName,
                    userAffiliation: message.userAffiliation,
                    socketId: socket.id,
                    userPosition: userPosition
                });

                // Start debate if we have 2 participants
                if (Object.keys(debateState.participants).length === 2 && !debateState.active) {
                    debateState.active = true;
                    setTimeout(() => {
                        startDebateTimer();
                    }, 3000); // 3 second delay before starting
                }
            }
        }
        // Handle start debate manually
        else if (message.type === "startDebate") {
            if (Object.keys(debateState.participants).length >= 2 && !debateState.active) {
                debateState.active = true;
                debateState.currentPhase = 0;
                startDebateTimer();
            }
        }
        // Handle reset debate
        else if (message.type === "resetDebate") {
            resetDebateState();
            io.emit("message", {
                type: "debateReset"
            });
        }
        // Handle other WebRTC and user messages
        else {
            // For WebRTC and other messages, include user info if available
            const messageWithUserInfo = {
                ...message,
                senderInfo: socket.userInfo ? {
                    name: socket.userInfo.name,
                    affiliation: socket.userInfo.affiliation,
                    socketId: socket.id
                } : null
            };
            
            // Broadcast message to all other clients
            socket.broadcast.emit("message", messageWithUserInfo); 
        }
    });

    socket.on("disconnect", () => { 
        if (socket.userInfo) {
            console.log("User disconnected:", {
                name: socket.userInfo.name,
                affiliation: socket.userInfo.affiliation,
                socketId: socket.id
            });
            
            // Remove user from debate participants
            for (const [position, participant] of Object.entries(debateState.participants)) {
                if (participant.socketId === socket.id) {
                    delete debateState.participants[position];
                    console.log(`Removed ${position} from debate`);
                    break;
                }
            }
            
            // Reset debate if no participants left
            if (Object.keys(debateState.participants).length === 0) {
                resetDebateState();
            }
            
            // Notify other users that someone left
            socket.broadcast.emit("message", {
                type: "userLeft",
                userName: socket.userInfo.name,
                userAffiliation: socket.userInfo.affiliation
            });
        } else {
            console.log("Anonymous user disconnected:", socket.id);
        }
    });
});

server.listen(port, '0.0.0.0', () => { 
    console.log(`Listening on Port ${port} on all interfaces`)
});