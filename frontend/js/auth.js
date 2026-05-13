// ===============================
// AUTH HELPERS
// ===============================

function getLoggedUser() {
  const userJson = localStorage.getItem("user");

  if (!userJson) {
      return null;
  }

  try {
      return JSON.parse(userJson);
  } catch (error) {
      console.error("Error reading user from localStorage", error);
      localStorage.removeItem("user");
      return null;
  }
}

function saveLoggedUser(user) {
  const normalizedUser = {
      id: user.id || user.Id,
      username: user.username || user.Username,
      email: user.email || user.Email
  };

  localStorage.setItem("user", JSON.stringify(normalizedUser));
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

function isLoggedIn() {
  return getLoggedUser() !== null;
}

// ===============================
// LOGIN / REGISTER FORMS
// ===============================

document.addEventListener("DOMContentLoaded", function () {
  renderUserMenu();

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
      loginForm.addEventListener("submit", handleLogin);
  }

  if (registerForm) {
      registerForm.addEventListener("submit", handleRegister);
  }
});

async function handleRegister(e) {
  e.preventDefault();

  const registerMessage = document.getElementById("registerMessage");

  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  try {
      const result = await apiRequest("/Usuario/register", "POST", {
          username: username,
          email: email,
          password: password
      });

      saveLoggedUser(result);

      registerMessage.textContent = "Account created successfully. Redirecting...";
      registerMessage.style.color = "#2dd4bf";
      
      setTimeout(() => {
          window.location.href = "index.html";
      }, 800);

  } catch (error) {
      registerMessage.textContent = error.message;
      registerMessage.style.color = "#ff5d73";
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const loginMessage = document.getElementById("loginMessage");

  const loginValue = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
      const result = await apiRequest("/Usuario/login", "POST", {
          username: loginValue,
          email: loginValue,
          password: password
      });

      saveLoggedUser(result);

      loginMessage.textContent = "Login successful. Redirecting...";
      loginMessage.style.color = "#2dd4bf";
      
      setTimeout(() => {
          window.location.href = "index.html";
      }, 800);

  } catch (error) {
      loginMessage.textContent = error.message;
      loginMessage.style.color = "#ff5d73";
  }
}

// ===============================
// USER MENU
// ===============================

function renderUserMenu() {
  const container = document.getElementById("user-menu-container");

  if (!container) {
      return;
  }

  const user = getLoggedUser();

  if (!user) {
      container.innerHTML = `
          <a href="login.html" class="btn-login">Login</a>
      `;
      return;
  }

  const username = user.username || user.email || "User";
  const email = user.email || "";
  const firstLetter = username.charAt(0).toUpperCase();

  container.innerHTML = `
      <div class="user-menu">
          <button class="user-menu-button" id="userMenuButton" type="button">
              <div class="avatar">${firstLetter}</div>

              <div class="user-menu-text">
                  <span class="user-name">${username}</span>
                  <span class="user-email">${email}</span>
              </div>

              <span class="arrow">▾</span>
          </button>

          <div class="user-dropdown hidden" id="userDropdown">
              <div class="dropdown-header">
                  <div class="avatar large">${firstLetter}</div>
                  <div>
                      <strong>${username}</strong>
                      <p>${email || "Signed in"}</p>
                  </div>
              </div>

              <hr>

              <a href="library.html" class="dropdown-item">My list</a>
              <a href="#" class="dropdown-item">Profile</a>
              <a href="#" class="dropdown-item">Settings</a>

              <hr>

              <button class="dropdown-item logout-button" type="button" onclick="logout()">
                  Sign out
              </button>
          </div>
      </div>
  `;

  const button = document.getElementById("userMenuButton");
  const dropdown = document.getElementById("userDropdown");

  button.addEventListener("click", function (event) {
      event.stopPropagation();
      dropdown.classList.toggle("hidden");
  });

  dropdown.addEventListener("click", function (event) {
      event.stopPropagation();
  });

  document.addEventListener("click", function () {
      dropdown.classList.add("hidden");
  });
}