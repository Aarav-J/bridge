require("dotenv").config(); 

const express = require("express"); 
const cors = require("cors"); 
const app = express(); 

app.use(cors());
const server = require("http").createServer(app);
const io = require("socket.io"(server, { 
    cors: {origin: "*"}
})); 

const port = 3000; 
io.on("connection", (socket) => { 
    console.log("Connected")

    socket.on("message", (message) => { 
        socket.broadcast.emit("message", message); 
    })

    socket.on("disconnect", () => { 
        console.log("Disconnected")
    })

    function error(err, req, res, next) { 
        if(!test) console.error(err.stack); 
        res.status(500).send("Interal Server Error");
    }
    app.use(error)
    server.listen(3000, () => { 
        console.log("Listening on Port 3000")
    })
})