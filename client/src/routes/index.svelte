<script context="module" lang="ts">
	export async function load({ fetch }) {
		const url = `${import.meta.env.VITE_API_URL}/userinfo`
		const res = await fetch(url);

		return {
			props: {
				userInfo: await res.json()
			}
		};
	}
</script>

<script lang="ts">
	import MessageComponent from "$lib/TextMessage.svelte"
	import { onMount, onDestroy, afterUpdate } from "svelte"
	import { socket } from "$lib/js/socket"
	
	type TextMessage = {
		text: string
		username: string
	}
	
	type User = {
		username: string,
		isTyping: boolean
	}

	export let userInfo : {[key:string]:User} = {}
	let inputText = ""
	let messages : TextMessage[] = []
	let messagesElem : Element
	let isTyping = false
	let typingTimeout : ReturnType<typeof setTimeout>

	onMount(()=>{
		socket.connect()
		Notification.requestPermission();
				
		window.addEventListener("keypress", (e)=>{
			if (e.key == "Enter") sendMessage()
		})
	})

	afterUpdate(()=>{
		messagesElem.lastElementChild?.scrollIntoView(
			{ behavior: "smooth" }
		);
	})

	onDestroy(()=>{
		socket.disconnect()
	})

	$: if (inputText.trim() !== "") updateTypingStatus()

	socket.on("typing status changed", (id, isTyping)=>{
		userInfo[id].isTyping = isTyping
	})

	socket.on("text message", (msg : TextMessage)=>{
		addMessage(msg.text, msg.username)
		if (document.visibilityState == "hidden") {
			new Notification(msg.username, {body:msg.text} );
		}
	})

	socket.on("user connected", (id, user: User)=>{
		addMessage(`${user.username} connected`)
		userInfo[id] = user
	})

	socket.on("user info changed", (id, info)=>{
		userInfo[id] = info
	})

	socket.on("user disconnected", (id)=>{
		addMessage(`${userInfo[id].username} disconnected`)
		delete userInfo[id]; userInfo = userInfo
	})

	function updateTypingStatus() {
		clearTimeout(typingTimeout)
		if (!isTyping) {
			isTyping = true
			socket.emit("typing status changed", isTyping)
		}
		typingTimeout = setTimeout(()=>{
			isTyping = false
			socket.emit("typing status changed", isTyping)
		}, 1000)
	}

	function addMessage(text: string, username = "server") {
		messages = [...messages, {text, username}]
	}

	function sendMessage() {
		if (inputText.trim() != "") {
			socket.emit("text message", inputText)
			addMessage(inputText, "you")
			inputText = ""
		}
	}
</script>

<div class="app">
	<div class="chat">
		<strong>Users connected: {Object.keys(userInfo).length+1}</strong>

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
	<div class="sidebar">
		<strong> Online users: </strong>
		{#each Object.keys(userInfo) as key (key)}
			<p>{userInfo[key].username}{userInfo[key].isTyping ? ", typing" : ""}</p>
		{/each}
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
		display: grid;
		grid-template-areas: "chat sidebar";
		grid-template-rows: 1fr;
		grid-template-columns: 3fr 1fr;
		gap: 2vmin;
	}

	.chat {
		grid-area: chat;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		overflow-x: auto;
	}

	.sidebar {
		grid-area: sidebar;
	}

	.messages {
		height: 100%;
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
</style>