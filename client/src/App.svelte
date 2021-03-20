<script lang="typescript">
	import MessageComponent from "./components/TextMessage.svelte"
	import { onMount, onDestroy, afterUpdate } from "svelte"
	import {io} from "socket.io-client"

	type TextMessage = {
		text: string
		username: string
	}

	const socket = io(
		import.meta.env.SNOWPACK_PUBLIC_API_URL, {
		autoConnect:false
	})
	
	let userCount = 0
	let inputText = ""
	let messages : TextMessage[] = []
	let messagesElem : Element

	onMount(()=>{
		socket.connect()
		Notification.requestPermission();
	})

	afterUpdate(()=>{
		messagesElem.lastElementChild?.scrollIntoView(
			{ behavior: "smooth" }
		);
	})

	onDestroy(()=>{
		socket.disconnect()
	})

	function addMessage(text: string, username: string = "server") {
		messages = [...messages, {text, username}]
	}

	function sendMessage() {
		if (inputText.trim() != "") {
			socket.emit("text message", inputText)
			addMessage(inputText, "you")
			inputText = ""
		}
	}
	
	socket.on("text message", (msg : TextMessage)=>{
		addMessage(msg.text, msg.username)
		if (document.visibilityState == "hidden") {
			new Notification(msg.username, {body:msg.text} );
		}
	})

	socket.on("usersConnectedChanged", (connectedUsers)=>{
		if (userCount > connectedUsers) {
			addMessage("someone disconnected")
		} else if (userCount !== connectedUsers) {
			addMessage("someone connected")
		}
		
		userCount = connectedUsers
	})
						
	window.addEventListener("keypress", (e)=>{
		if (e.key == "Enter") sendMessage()
	})
</script>

<div class="app">
	<h1>Users connected: {userCount}</h1>

	<div bind:this={messagesElem} class="messages">
		{#each messages as msg}
			<MessageComponent text={msg.text} username={msg.username} />
		{/each}
	</div>

	<div class="inputArea">
		<input bind:value={inputText} type="text" placeholder="Digite aqui. . .">
		<button on:click|preventDefault={sendMessage}>»</button>
	</div>
</div>

<style>
	:global(body) {
		font-family: Arial, Helvetica, sans-serif;
		margin: 0;
		background: black;
		color: white;
	}

	.app {
		height: 100vh;
		width: 	100vw;
		background: black;
		color: rgb(221, 221, 221);
		display: flex;
		flex-direction: column;
	}

	.inputArea {
		height: 5vh;
		display: flex;
		margin: 8px;
	}
	.inputArea input {
		flex-grow: 1;
	}
	.inputArea button {
		flex-grow: 0.1;
	}

	.messages {
		flex-grow: 1;
		overflow-x: auto;
	}
</style>