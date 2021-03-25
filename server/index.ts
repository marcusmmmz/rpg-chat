import {createServer} from "http"
import {Server} from "socket.io";

const server = createServer();
const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
});
const PORT = 5050

let usersConnected = 0
let userInfo = {}

io.on('connection', (socket) => {
    usersConnected++
    console.log(`${usersConnected} users connected!`);
    io.emit("usersConnectedChanged", usersConnected)

    userInfo[socket.id] = {
        username:"guest"
    }

    socket.on("text message", (text: string)=>{
        console.log(text)
        if (text[0] == "/") {
            let args = text
            .substring(1, text.length)
            .split(" ");

            if (args[0] == "nick") {
                args.shift()
                userInfo[socket.id].username = args.join(" ")
            }
            
        } else {
            socket.broadcast.emit("text message", {
                text, username:userInfo[socket.id].username
            })
        }
    })

    socket.on('disconnect', (e) => {
        usersConnected--
        console.log(`${usersConnected} users connected!`);
        io.emit("usersConnectedChanged", usersConnected)
        delete userInfo[socket.id]
    });
});

server.listen(PORT, () => {
    console.log(`server listening on port: ${PORT}`)
})
