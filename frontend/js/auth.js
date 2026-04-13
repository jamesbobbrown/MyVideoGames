const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

registerForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  const users = getUsers();

  const existingUser = users.find(
    (user) => user.username === username || user.email === email
  );

  if (existingUser) {
    registerMessage.textContent = "User or email already exists.";
    registerMessage.style.color = "#ff5d73";
    return;
  }

  const newUser = {
    username,
    email,
    password
  };

  users.push(newUser);
  saveUsers(users);

  localStorage.setItem("currentUser", JSON.stringify(newUser));

  registerMessage.textContent = "Account created successfully. Redirecting...";
  registerMessage.style.color = "#2dd4bf";

  setTimeout(() => {
    window.location.href = "library.html";
  }, 1000);

  registerForm.reset();
});

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  const users = getUsers();

  const foundUser = users.find(
    (user) => user.username === username && user.password === password
  );

  if (!foundUser) {
    loginMessage.textContent = "Incorrect username or password.";
    loginMessage.style.color = "#ff5d73";
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(foundUser));

  loginMessage.textContent = "Login successful. Redirecting...";
  loginMessage.style.color = "#2dd4bf";

  setTimeout(() => {
    window.location.href = "library.html";
  }, 1000);

  loginForm.reset();
});