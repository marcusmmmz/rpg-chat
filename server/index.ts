import createApp from "express"
import {createServer} from "http"
import {Server} from "socket.io";

const app = createApp()
const http = createServer(app);
const io = new Server(http, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
});

const PORT = 5050

type User = {
    username: string,
    isTyping: boolean
}

let userInfo : {[key:string]:User} = {}

io.on('connection', (socket) => {
    userInfo[socket.id] = {
        username:"guest",
        isTyping:false
    }

    console.log(`${getUserCount()} users connected!`);
    socket.broadcast.emit("user connected", socket.id, userInfo[socket.id])

    socket.on("typing status changed", (isTyping)=>{
        userInfo[socket.id].isTyping = isTyping
        socket.broadcast.emit("typing status changed", socket.id, isTyping)
    })

    socket.on("text message", (text: string)=>{
        console.log(text)
        if (text[0] == "/") {
            let args = text
            .substring(1, text.length)
            .split(" ");

            if (args[0] == "nick") {
                args.shift()
                userInfo[socket.id].username = args.join(" ")
                socket.broadcast.emit("user info changed", socket.id, userInfo[socket.id])
            }
            
        } else {
            socket.broadcast.emit("text message", {
                text, username:userInfo[socket.id].username
            })
        }
    })

    socket.on('disconnect', (reason)=>{
        socket.broadcast.emit("user disconnected", socket.id)
        delete userInfo[socket.id]
        console.log(`${getUserCount()} users connected!`);
    });
});

function getUserCount() {
    return Object.keys(userInfo).length
}

app.get("/userinfo", (req, res)=>{
    return res.send(userInfo)
})

http.listen(PORT, () => {
    console.log(`server listening on port: ${PORT}`)
})
