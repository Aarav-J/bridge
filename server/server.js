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

io.on("connection", (socket) => { 
    console.log("Connected")

    socket.on("message", (message) => { 
        socket.broadcast.emit("message", message); 
    })

    socket.on("disconnect", () => { 
        console.log("Disconnected")
    })
});

server.listen(port, '0.0.0.0', () => { 
    console.log(`Listening on Port ${port} on all interfaces`)
});