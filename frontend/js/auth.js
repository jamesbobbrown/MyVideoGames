const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("registerUsername").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  try {
    const result = await apiRequest("/Usuario/register", "POST", {
      data: {
        username,
        email,
        password
      },
      pagination: null,
      filters: []
    });

    localStorage.setItem("currentUser", JSON.stringify(result));

    registerMessage.textContent = "Account created successfully. Redirecting...";
    registerMessage.style.color = "#2dd4bf";

    setTimeout(() => {
      window.location.href = "library.html";
    }, 1000);
  } catch (error) {
    registerMessage.textContent = error.message;
    registerMessage.style.color = "#ff5d73";
  }
});

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const result = await apiRequest("/Usuario/login", "POST", {
      data: {
        username,
        password
      },
      pagination: null,
      filters: []
    });

    localStorage.setItem("currentUser", JSON.stringify(result));

    loginMessage.textContent = "Login successful. Redirecting...";
    loginMessage.style.color = "#2dd4bf";

    setTimeout(() => {
      window.location.href = "library.html";
    }, 1000);
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.style.color = "#ff5d73";
  }
});