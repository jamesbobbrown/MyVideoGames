function renderGames(containerId, gameList) {
    const container = document.getElementById(containerId);
    if (!container) return;
  
    container.innerHTML = gameList
      .map(
        (game) => `
        <article class="game-card">
          <img src="${game.image}" alt="${game.title}">
          <div class="game-card-content">
            <h3>${game.title}</h3>
            <p class="game-meta">${game.genre}</p>
            <div class="badge-row">
              <span class="badge">⭐ ${game.rating}</span>
              <span class="badge">${game.players}</span>
            </div>
          </div>
        </article>
      `
      )
      .join("");
  }
  
  function updateNavUser() {
    const navAuthLink = document.getElementById("navAuthLink");
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  
    if (navAuthLink && currentUser) {
      navAuthLink.textContent = currentUser.username;
      navAuthLink.href = "library.html";
    }
  }
  
  renderGames("trendingGames", games.slice(0, 4));
  renderGames("topRatedGames", [...games].sort((a, b) => b.rating - a.rating).slice(0, 4));
  updateNavUser();