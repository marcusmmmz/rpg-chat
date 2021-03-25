import {io} from "socket.io-client"

export let socket = io(import.meta.env.VITE_API_URL.toString(), {
    autoConnect:false
});