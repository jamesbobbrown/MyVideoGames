document.addEventListener("DOMContentLoaded", function () {
  loadHomeCategories();
});

async function loadHomeCategories() {
  const container = document.getElementById("home-categories-container");

  if (!container) {
      return;
  }

  container.innerHTML = `
      <p class="loading-message">Loading games...</p>
  `;

  try {
      const categories = await getHomeCategories();

      if (!categories || categories.length === 0) {
          container.innerHTML = `
              <p class="empty-message">No games found.</p>
          `;
          return;
      }

      container.innerHTML = categories
          .map(category => createCategorySection(category))
          .join("");

  } catch (error) {
      console.error(error);

      container.innerHTML = `
          <p class="error-message">
              Could not load games. Make sure the backend is running and RAWG API key is configured.
          </p>
      `;
  }
}

function createCategorySection(category) {
  const title = category.titulo || category.Titulo || "Games";
  const games = category.juegos || category.Juegos || [];

  return `
      <section class="games-category">
          <div class="section-title">
              <h2>${title}</h2>
              <p>Selected from RAWG API</p>
          </div>

          <div class="games-grid">
              ${games.map(game => createRawgGameCard(game)).join("")}
          </div>
      </section>
  `;
}

function createRawgGameCard(game) {
  const user = getLoggedUser();

  const rawgId = game.rawgId || game.RawgId;
  const title = game.titulo || game.Titulo || "Unknown game";
  const genre = game.genero || game.Genero || "Unknown genre";
  const rating = game.rating || game.Rating || "N/A";
  const image = game.imagenUrl || game.ImagenUrl || "";
  const alreadyAdded = game.yaAnadido || game.YaAnadido || false;

  const safeGame = encodeURIComponent(JSON.stringify({
      rawgId: rawgId,
      titulo: title,
      genero: genre,
      rating: rating,
      imagenUrl: image,
      fechaLanzamiento: game.fechaLanzamiento || game.FechaLanzamiento || null
  }));

  let buttonHtml = "";

  if (!user) {
      buttonHtml = `
          <button class="game-button login-required" onclick="goToLogin()">
              Login to add
          </button>
      `;
  } else if (alreadyAdded) {
      buttonHtml = `
          <button class="game-button added" disabled>
              Added
          </button>
      `;
  } else {
      buttonHtml = `
          <button class="game-button" onclick="handleAddRawgGame('${safeGame}')">
              Add to my list
          </button>
      `;
  }

  return `
      <article class="game-card">
          <div class="game-image-wrapper">
              <img 
                  src="${image}" 
                  alt="${title}" 
                  class="game-image"
                  onerror="this.src='https://placehold.co/400x550/1f2937/ffffff?text=No+Image';"
              >
          </div>

          <div class="game-info">
              <h3>${title}</h3>
              <p class="game-genre">${genre}</p>
              <p class="game-rating">⭐ ${rating}</p>

              ${buttonHtml}
          </div>
      </article>
  `;
}

function goToLogin() {
  window.location.href = "login.html";
}

async function handleAddRawgGame(encodedGame) {
  try {
      const game = JSON.parse(decodeURIComponent(encodedGame));

      await addRawgGameToMyList(game);

      await loadHomeCategories();

  } catch (error) {
      console.error(error);
      alert("Could not add the game to your list.");
  }
}