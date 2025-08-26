const socket = io();

const usernameInput = document.getElementById("username");
const createBtn = document.getElementById("create-room");
const joinBtn = document.getElementById("join-room");
const settingsBtn = document.getElementById("settings");
const lobbyPanel = document.getElementById("lobby-panel");
const joinPanel = document.getElementById("join-panel");
const settingsPanel = document.getElementById("settings-panel");
const leaveBtn = document.getElementById("leave-room");
const closeSettingsBtn = document.getElementById("close-settings");
const playerListEl = document.getElementById("player-list");
const roomCodeEl = document.getElementById("room-code");
const startGameBtn = document.getElementById("start-game");
const joinCodeInput = document.getElementById("join-code");
const confirmJoinBtn = document.getElementById("confirm-join");
const cancelJoinBtn = document.getElementById("cancel-join");
const overlay = document.getElementById("overlay");

let roomCreated = false;
let currentRoom = null;

// otevření nastavení
settingsBtn.addEventListener("click", () => {
    settingsPanel.classList.remove("hidden");
    overlay.classList.remove("hidden");
});
closeSettingsBtn.addEventListener("click", () => {
    settingsPanel.classList.add("hidden");
    overlay.classList.add("hidden");
});

// vytvořit místnost
createBtn.addEventListener("click", () => {
    if(roomCreated) return;
    const username = usernameInput.value.trim() || "Neznámý hráč";
    socket.emit("createRoom", {username});
    roomCreated = true;
    createBtn.disabled = true;
});

// připojit se k místnosti
joinBtn.addEventListener("click", () => {
    joinPanel.classList.remove("hidden");
    overlay.classList.remove("hidden");
});

// potvrzení připojení
confirmJoinBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim() || "Neznámý hráč";
    const roomID = joinCodeInput.value.trim().toUpperCase();
    if(roomID) {
        socket.emit("joinRoom", {roomID, username});
        joinPanel.classList.add("hidden");
        overlay.classList.add("hidden");
        currentRoom = roomID;
    }
});

// opustit připojovací panel
cancelJoinBtn.addEventListener("click", () => {
    joinPanel.classList.add("hidden");
    overlay.classList.add("hidden");
    joinCodeInput.value = "";
});

// opustit místnost
leaveBtn.addEventListener("click", () => {
    if(currentRoom) {
        socket.emit("leaveRoom", {roomID: currentRoom});
        lobbyPanel.classList.add("hidden");
        overlay.classList.add("hidden");
        roomCreated = false;
        createBtn.disabled = false;
        currentRoom = null;
    }
});

// kliknutí na kód místnosti pro kopírování
roomCodeEl.addEventListener("click", () => {
    const code = roomCodeEl.textContent.replace("Kód místnosti: ","");
    navigator.clipboard.writeText(code);
    alert("Kód místnosti zkopírován do schránky!");
});

// tlačítko Spustit hru
startGameBtn.addEventListener("click", () => {
    if(currentRoom) {
        socket.emit("startGame", { roomID: currentRoom });
        alert("Hra spuštěna!");
    }
});

// přijmout kód vytvořené místnosti (i pro připojeného hráče)
socket.on("roomCreated", data => {
    lobbyPanel.classList.remove("hidden");
    overlay.classList.remove("hidden");
    roomCodeEl.textContent = "Kód místnosti: " + data.roomID;
    currentRoom = data.roomID;
    const names = data.players.map(p => p.name).join(", ");
    playerListEl.textContent = "Hráči: " + names;
});

// přijmout seznam hráčů
socket.on("playerList", players => {
    const names = players.map(p => p.name).join(", ");
    playerListEl.textContent = "Hráči: " + names;
});

// chyba při připojení
socket.on("roomError", msg => {
    alert(msg);
});
