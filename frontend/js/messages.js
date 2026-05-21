const currentUser = getLoggedUser();

const conversationList = document.getElementById("conversationList");
const messagesList = document.getElementById("messagesList");
const chatHeader = document.getElementById("chatHeader");
const messageForm = document.getElementById("messageForm");
const messageContent = document.getElementById("messageContent");

let selectedOtherUserId = null;
let selectedOtherUsername = "";

document.addEventListener("DOMContentLoaded", function () {
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    setupMessagesPage();
});

async function setupMessagesPage() {
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get("userId");
    const username = params.get("username");

    await loadInbox();

    if (targetUserId) {
        selectedOtherUserId = Number(targetUserId);
        selectedOtherUsername = username || "User";
        await loadConversation(selectedOtherUserId, selectedOtherUsername);
    }

    messageForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        await sendMessage();
    });
}

async function loadInbox() {
    try {
        const conversations = await apiRequest(`/Mensaje/inbox?usuarioId=${currentUser.id}`, "GET");

        if (!conversations || conversations.length === 0) {
            conversationList.innerHTML = `
                <div class="empty-box">No conversations yet.</div>
            `;
            return;
        }

        conversationList.innerHTML = conversations
            .map(conversation => createConversationItem(conversation))
            .join("");

        attachConversationEvents();

    } catch (error) {
        console.error(error);

        conversationList.innerHTML = `
            <div class="empty-box">Could not load inbox.</div>
        `;
    }
}

function createConversationItem(conversation) {
    const otherUserId = conversation.otherUserId || conversation.OtherUserId;
    const username = conversation.otherUsername || conversation.OtherUsername || "User";
    const lastMessage = conversation.lastMessage || conversation.LastMessage || "";
    const unreadCount = conversation.unreadCount || conversation.UnreadCount || 0;

    return `
        <button 
            type="button" 
            class="conversation-item" 
            data-user-id="${otherUserId}"
            data-username="${username}"
        >
            <div class="conversation-avatar">
                ${username.charAt(0).toUpperCase()}
            </div>

            <div class="conversation-info">
                <div class="conversation-top">
                    <strong>${username}</strong>
                    ${unreadCount > 0 ? `<span class="unread-pill">${unreadCount}</span>` : ""}
                </div>

                <p>${lastMessage}</p>
            </div>
        </button>
    `;
}

function attachConversationEvents() {
    document.querySelectorAll(".conversation-item").forEach(button => {
        button.addEventListener("click", async function () {
            selectedOtherUserId = Number(button.dataset.userId);
            selectedOtherUsername = button.dataset.username;

            await loadConversation(selectedOtherUserId, selectedOtherUsername);
        });
    });
}

async function loadConversation(otherUserId, username) {
    selectedOtherUserId = Number(otherUserId);
    selectedOtherUsername = username || "User";

    chatHeader.innerHTML = `
        <h2>${selectedOtherUsername}</h2>
        <p>Private conversation</p>
    `;

    messageForm.classList.remove("hidden");

    messagesList.innerHTML = `
        <div class="empty-box">Loading messages...</div>
    `;

    try {
        const messages = await apiRequest(
            `/Mensaje/conversation?userId=${currentUser.id}&otherUserId=${selectedOtherUserId}`,
            "GET"
        );

        renderMessages(messages);

        await loadInbox();

    } catch (error) {
        console.error(error);

        messagesList.innerHTML = `
            <div class="empty-box">Could not load conversation.</div>
        `;
    }
}

function renderMessages(messages) {
    if (!messages || messages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-box">No messages yet. Start the conversation.</div>
        `;
        return;
    }

    messagesList.innerHTML = messages
        .map(message => createMessageBubble(message))
        .join("");

    messagesList.scrollTop = messagesList.scrollHeight;
}

function createMessageBubble(message) {
    const senderId = message.senderId || message.SenderId;
    const content = message.contenido || message.Contenido || "";
    const date = message.fechaEnvio || message.FechaEnvio || "";

    const isMine = Number(senderId) === Number(currentUser.id);

    return `
        <div class="message-bubble ${isMine ? "mine" : "theirs"}">
            <p>${content}</p>
            <span>${formatMessageDate(date)}</span>
        </div>
    `;
}

async function sendMessage() {
    const content = messageContent.value.trim();

    if (!selectedOtherUserId) {
        alert("Select a conversation first.");
        return;
    }

    if (!content) {
        return;
    }

    try {
        await apiRequest("/Mensaje/send", "POST", {
            data: {
                senderId: currentUser.id,
                receiverId: selectedOtherUserId,
                contenido: content
            },
            pagination: null,
            filters: []
        });

        messageContent.value = "";

        await loadConversation(selectedOtherUserId, selectedOtherUsername);
        await loadInbox();

    } catch (error) {
        alert(error.message);
    }
}

function formatMessageDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString();
}