require("dotenv").config(); 

const express = require("express"); 
const cors = require("cors"); 
const AIService = require("./services/aiService");

const app = express(); 

app.use(cors());
app.use(express.json());

const server = require("http").createServer(app);
const io = require("socket.io")(server, { 
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
}); 

const port = process.env.PORT || 3000;
const aiService = new AIService(); 

// Error handling middleware
function errorHandler(err, req, res, next) { 
    console.error(err.stack); 
    res.status(500).send("Internal Server Error");
}
app.use(errorHandler);

// API Routes
app.post("/api/fact-check", async (req, res) => {
    try {
        const { claim, topic } = req.body;
        if (!claim) {
            return res.status(400).json({ error: "Claim is required" });
        }
        
        const result = await aiService.factCheckClaim(claim, topic);
        res.json(result);
    } catch (error) {
        console.error("Fact-check error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/api/generate-facts", async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ error: "Topic is required" });
        }
        
        const result = await aiService.generatePoliticalFacts(topic);
        res.json(result);
    } catch (error) {
        console.error("Generate facts error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/api/analyze-sentiment", async (req, res) => {
    try {
        const { transcript } = req.body;
        if (!transcript) {
            return res.status(400).json({ error: "Transcript is required" });
        }
        
        const result = await aiService.analyzeSentiment(transcript);
        res.json(result);
    } catch (error) {
        console.error("Sentiment analysis error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

io.on("connection", (socket) => { 
    console.log("User connected:", socket.id);

    // Handle WebRTC signaling
    socket.on("message", (message) => { 
        socket.broadcast.emit("message", message); 
    });

    // Handle transcription data
    socket.on("transcription", async (data) => {
        try {
            const { transcript, userId, timestamp } = data;
            console.log("Received transcription:", transcript);
            
            // Broadcast transcription to other participants
            socket.broadcast.emit("transcription", {
                transcript,
                userId,
                timestamp
            });
            
            // Analyze sentiment in real-time
            const sentiment = await aiService.analyzeSentiment(transcript);
            socket.emit("sentiment-analysis", sentiment);
            
        } catch (error) {
            console.error("Transcription processing error:", error);
        }
    });

    // Handle fact-check requests
    socket.on("fact-check-request", async (data) => {
        try {
            const { claim, topic } = data;
            const factCheck = await aiService.factCheckClaim(claim, topic);
            
            // Broadcast fact-check result to all participants
            io.emit("fact-check-result", {
                claim,
                factCheck,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error("Fact-check request error:", error);
            socket.emit("fact-check-error", { error: "Failed to fact-check claim" });
        }
    });

    // Handle topic-based fact generation
    socket.on("request-facts", async (data) => {
        try {
            const { topic } = data;
            const facts = await aiService.generatePoliticalFacts(topic);
            
            socket.emit("facts-generated", facts);
            
        } catch (error) {
            console.error("Facts generation error:", error);
            socket.emit("facts-error", { error: "Failed to generate facts" });
        }
    });

    socket.on("disconnect", () => { 
        console.log("User disconnected:", socket.id);
    });
});

server.listen(port, '0.0.0.0', () => { 
    console.log(`Listening on Port ${port} on all interfaces`)
});