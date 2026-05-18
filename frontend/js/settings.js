document.addEventListener("DOMContentLoaded", function () {
    loadSettingsPage();
});

function loadSettingsPage() {
    const user = getLoggedUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const usernameInput = document.getElementById("settingsUsername");
    const emailInput = document.getElementById("settingsEmail");
    const passwordInput = document.getElementById("settingsPassword");
    const settingsForm = document.getElementById("settingsForm");

    usernameInput.value = user.username || "";
    emailInput.value = user.email || "";

    updateSettingsPreview();

    usernameInput.addEventListener("input", updateSettingsPreview);
    emailInput.addEventListener("input", updateSettingsPreview);

    settingsForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        await saveSettings();
    });
}

function updateSettingsPreview() {
    const username = document.getElementById("settingsUsername").value.trim() || "User";
    const email = document.getElementById("settingsEmail").value.trim() || "email@example.com";

    document.getElementById("settingsPreviewUsername").textContent = username;
    document.getElementById("settingsPreviewEmail").textContent = email;
    document.getElementById("settingsAvatar").textContent = username.charAt(0).toUpperCase();
}

async function saveSettings() {
    const user = getLoggedUser();
    const message = document.getElementById("settingsMessage");

    const username = document.getElementById("settingsUsername").value.trim();
    const email = document.getElementById("settingsEmail").value.trim();
    const password = document.getElementById("settingsPassword").value.trim();

    if (!username || !email) {
        message.textContent = "Username and email are required.";
        message.style.color = "#ff5d73";
        return;
    }

    try {
        const body = {
            id: user.id,
            username: username,
            email: email,
            password: password || null
        };

        const updatedUser = await apiRequest("/Usuario/update", "PUT", body);

        saveLoggedUser(updatedUser);

        message.textContent = "Settings updated successfully.";
        message.style.color = "#2dd4bf";

        document.getElementById("settingsPassword").value = "";

        renderUserMenu();
        updateSettingsPreview();

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "#ff5d73";
    }
}