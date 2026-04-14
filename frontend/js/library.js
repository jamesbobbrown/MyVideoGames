const quickAddForm = document.getElementById("quickAddForm");
const playedList = document.getElementById("playedList");
const toPlayList = document.getElementById("toPlayList");
const favoriteList = document.getElementById("favoriteList");
const welcomeUser = document.getElementById("welcomeUser");
const navAuthLink = document.getElementById("navAuthLink");

const gameStatusSelect = document.getElementById("gameStatus");
const gameRatingInput = document.getElementById("gameRating");

const gameSearchInput = document.getElementById("gameSearchInput");
const searchResults = document.getElementById("searchResults");
const selectedGamePreview = document.getElementById("selectedGamePreview");
const selectedGameIdInput = document.getElementById("selectedGameId");
const selectedGameTitleInput = document.getElementById("selectedGameTitle");

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

let searchTimeout = null;
let selectedExternalGame = null;

if (currentUser) {
  welcomeUser.textContent = `Logged in as ${currentUser.username}`;
  if (navAuthLink) {
    navAuthLink.textContent = currentUser.username;
    navAuthLink.href = "library.html";
  }
} else {
  welcomeUser.textContent = "No logged in user found.";
}

function updateRatingVisibility() {
  const status = gameStatusSelect.value;

  if (status === "toplay") {
    gameRatingInput.value = "";
    gameRatingInput.disabled = true;
    gameRatingInput.placeholder = "No rating for To Play";
  } else {
    gameRatingInput.disabled = false;
    gameRatingInput.placeholder = "Rating 1-10";
  }
}

gameStatusSelect.addEventListener("change", updateRatingVisibility);

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
          <h3>${item.titulo}</h3>
          <p>Status: ${item.estado}</p>
        </div>
        <div class="list-item-right">
          ${
            item.puntuacion !== null && item.puntuacion !== undefined
              ? `<span class="rating-pill">⭐ ${item.puntuacion}/10</span>`
              : ""
          }
          <button class="delete-btn" onclick="deleteListItem(${item.id})">Delete</button>
        </div>
      </div>
    `
    )
    .join("");
}

async function loadUserList() {
  if (!currentUser?.id) return;

  try {
    const items = await apiRequest(`/ListaUsuario/getByUser?usuarioId=${currentUser.id}`);

    renderList(
      playedList,
      items.filter((x) => x.estado === "played"),
      "No played games yet."
    );

    renderList(
      toPlayList,
      items.filter((x) => x.estado === "toplay"),
      "No games in your backlog yet."
    );

    renderList(
      favoriteList,
      items.filter((x) => x.estado === "favorite"),
      "No favorite games yet."
    );
  } catch (error) {
    playedList.innerHTML = `<div class="empty-box">${error.message}</div>`;
    toPlayList.innerHTML = `<div class="empty-box">${error.message}</div>`;
    favoriteList.innerHTML = `<div class="empty-box">${error.message}</div>`;
  }
}

function renderSearchResults(results) {
  if (!results.length) {
    searchResults.style.display = "none";
    searchResults.innerHTML = "";
    return;
  }

  searchResults.innerHTML = results
    .map(
      (game) => `
      <div class="search-result-item" data-id="${game.id}">
        <img src="${game.background_image || ""}" alt="${game.name}">
        <div class="search-result-text">
          <h4>${game.name}</h4>
          <p>Released: ${game.released || "Unknown"}</p>
          <p>Rating: ${game.rating ?? "N/A"}</p>
        </div>
      </div>
    `
    )
    .join("");

  searchResults.style.display = "block";

  document.querySelectorAll(".search-result-item").forEach((item) => {
    item.addEventListener("click", async function () {
      const rawgId = this.dataset.id;

      try {
        const game = await apiRequest(`/Videojuego/getExternalById?rawgId=${rawgId}`);
        selectGame(game);
      } catch (error) {
        alert(error.message);
      }
    });
  });
}

function selectGame(game) {
  selectedExternalGame = game;
  selectedGameIdInput.value = game.id;
  selectedGameTitleInput.value = game.name;
  gameSearchInput.value = game.name;

  selectedGamePreview.innerHTML = `
    <img src="${game.background_image || ""}" alt="${game.name}">
    <div>
      <h3>${game.name}</h3>
      <p><strong>Released:</strong> ${game.released || "Unknown"}</p>
      <p><strong>Rating:</strong> ${game.rating ?? "N/A"}</p>
      <p>${game.description_raw ? game.description_raw.slice(0, 220) + "..." : "No description available."}</p>
    </div>
  `;

  selectedGamePreview.style.display = "flex";
  searchResults.style.display = "none";
}

gameSearchInput.addEventListener("input", function () {
  const query = this.value.trim();

  selectedExternalGame = null;
  selectedGameIdInput.value = "";
  selectedGameTitleInput.value = "";
  selectedGamePreview.style.display = "none";

  clearTimeout(searchTimeout);

  if (query.length < 2) {
    searchResults.style.display = "none";
    searchResults.innerHTML = "";
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const results = await apiRequest(`/Videojuego/searchExternal?query=${encodeURIComponent(query)}`);
      renderSearchResults(results);
    } catch (error) {
      searchResults.style.display = "none";
      searchResults.innerHTML = "";
    }
  }, 300);
});

async function ensureGameExistsInDatabase(rawgGame) {
  const allGames = await apiRequest("/Videojuego/getList");

  let existing = allGames.find((g) => g.rawgId === rawgGame.id);

  if (existing) return existing;

  const created = await apiRequest("/Videojuego/add", "POST", {
    data: {
      titulo: rawgGame.name,
      genero: "",
      plataforma: "",
      fechaLanzamiento: rawgGame.released ? `${rawgGame.released}T00:00:00` : null,
      imagenUrl: rawgGame.background_image || "",
      rawgId: rawgGame.id
    },
    pagination: null,
    filters: []
  });

  return created;
}

quickAddForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!currentUser?.id) {
    alert("You must be logged in.");
    return;
  }

  if (!selectedExternalGame) {
    alert("Please select a game from the search results.");
    return;
  }

  const status = gameStatusSelect.value;
  const rating = gameRatingInput.value;

  if (!status) {
    alert("Please select a status.");
    return;
  }

  try {
    const dbGame = await ensureGameExistsInDatabase(selectedExternalGame);

    await apiRequest("/ListaUsuario/add", "POST", {
      data: {
        usuarioId: currentUser.id,
        videojuegoId: dbGame.id,
        estado: status,
        puntuacion: rating ? Number(rating) : null
      },
      pagination: null,
      filters: []
    });

    quickAddForm.reset();
    selectedExternalGame = null;
    selectedGameIdInput.value = "";
    selectedGameTitleInput.value = "";
    selectedGamePreview.style.display = "none";
    gameSearchInput.value = "";
    searchResults.style.display = "none";

    updateRatingVisibility();
    await loadUserList();
  } catch (error) {
    alert(error.message);
  }
});

async function deleteListItem(id) {
  try {
    await apiRequest(`/ListaUsuario/delete?id=${id}`, "DELETE");
    await loadUserList();
  } catch (error) {
    alert(error.message);
  }
}

document.addEventListener("click", function (e) {
  if (!searchResults.contains(e.target) && e.target !== gameSearchInput) {
    searchResults.style.display = "none";
  }
});

updateRatingVisibility();
loadUserList();