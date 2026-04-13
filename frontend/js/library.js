const quickAddForm = document.getElementById("quickAddForm");
const playedList = document.getElementById("playedList");
const toPlayList = document.getElementById("toPlayList");
const favoriteList = document.getElementById("favoriteList");
const welcomeUser = document.getElementById("welcomeUser");
const navAuthLink = document.getElementById("navAuthLink");

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (currentUser) {
  welcomeUser.textContent = `Logged in as ${currentUser.username}`;
  if (navAuthLink) {
    navAuthLink.textContent = currentUser.username;
    navAuthLink.href = "library.html";
  }
} else {
  welcomeUser.textContent = "You are using demo mode. Login to simulate a real user.";
}

function getStoredGames() {
  return JSON.parse(localStorage.getItem("userGames")) || [];
}

function saveStoredGames(games) {
  localStorage.setItem("userGames", JSON.stringify(games));
}

function renderList(container, items, emptyText) {
  if (!items.length) {
    container.innerHTML = `<div class="empty-box">${emptyText}</div>`;
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
      <div class="list-item">
        <div class="list-item-left">
          <h3>${item.title}</h3>
          <p>Status: ${item.status}</p>
        </div>
        <div class="list-item-right">
          ${
            item.rating
              ? `<span class="rating-pill">⭐ ${item.rating}/10</span>`
              : ""
          }
          <button class="delete-btn" onclick="deleteGame(${item.id})">Delete</button>
        </div>
      </div>
    `
    )
    .join("");
}

function renderAllLists() {
  const storedGames = getStoredGames();

  renderList(
    playedList,
    storedGames.filter((g) => g.status === "played"),
    "No played games yet."
  );

  renderList(
    toPlayList,
    storedGames.filter((g) => g.status === "toplay"),
    "No games in your backlog yet."
  );

  renderList(
    favoriteList,
    storedGames.filter((g) => g.status === "favorite"),
    "No favorite games yet."
  );
}

quickAddForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("gameTitle").value.trim();
  const status = document.getElementById("gameStatus").value;
  const rating = document.getElementById("gameRating").value;

  const storedGames = getStoredGames();

  const newGame = {
    id: Date.now(),
    title,
    status,
    rating: rating ? Number(rating) : null
  };

  storedGames.push(newGame);
  saveStoredGames(storedGames);
  renderAllLists();
  quickAddForm.reset();
});

function deleteGame(id) {
  const storedGames = getStoredGames().filter((game) => game.id !== id);
  saveStoredGames(storedGames);
  renderAllLists();
}

renderAllLists();