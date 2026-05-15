let categoryType = "popular";
let currentPage = 1;
let hasNextPage = false;
let searchTimeout = null;

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);

    categoryType = params.get("type") || "popular";

    document.getElementById("applyCategoryFilters").addEventListener("click", function () {
        currentPage = 1;
        loadCategoryGames();
    });

    document.getElementById("categorySearchInput").addEventListener("input", function () {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(function () {
            currentPage = 1;
            loadCategoryGames();
        }, 450);
    });

    document.getElementById("categoryGenreSelect").addEventListener("change", function () {
        currentPage = 1;
        loadCategoryGames();
    });

    document.getElementById("categoryRatingSelect").addEventListener("change", function () {
        currentPage = 1;
        loadCategoryGames();
    });

    document.getElementById("prevPageButton").addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            loadCategoryGames();
        }
    });

    document.getElementById("nextPageButton").addEventListener("click", function () {
        if (hasNextPage) {
            currentPage++;
            loadCategoryGames();
        }
    });

    loadCategoryGames();
});

async function loadCategoryGames() {
    const container = document.getElementById("categoryGamesContainer");
    const titleElement = document.getElementById("categoryTitle");

    const user = getLoggedUser();
    const userId = user ? user.id : null;

    const search = document.getElementById("categorySearchInput").value.trim();
    const genre = document.getElementById("categoryGenreSelect").value;
    const minRating = document.getElementById("categoryRatingSelect").value;

    container.innerHTML = `
        <p class="loading-message">Loading games...</p>
    `;

    let endpoint =
        `/Videojuego/categoryRawg?type=${encodeURIComponent(categoryType)}` +
        `&page=${currentPage}`;

    if (genre) {
        endpoint += `&genre=${encodeURIComponent(genre)}`;
    }

    if (minRating) {
        endpoint += `&minRating=${encodeURIComponent(minRating)}`;
    }

    if (search) {
        endpoint += `&search=${encodeURIComponent(search)}`;
    }

    if (userId) {
        endpoint += `&usuarioId=${userId}`;
    }

    try {
        const result = await apiRequest(endpoint, "GET");

        const title = result.titulo || result.Titulo || "Games";
        const games = result.juegos || result.Juegos || [];

        hasNextPage = result.hasNextPage || result.HasNextPage || false;

        titleElement.textContent = title;

        document.title = `${title} - MyVideoGames`;

        renderCategoryGames(games);
        updatePagination();

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <p class="error-message">Could not load games.</p>
        `;
    }
}

function renderCategoryGames(games) {
    const container = document.getElementById("categoryGamesContainer");

    if (!games || games.length === 0) {
        container.innerHTML = `
            <div class="empty-box">No games found with these filters.</div>
        `;
        return;
    }

    container.innerHTML = games
        .map(game => createCategoryGameCard(game))
        .join("");
}

function createCategoryGameCard(game) {
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
            <button class="game-button login-required" onclick="event.stopPropagation(); window.location.href='login.html';">
                Login to add
            </button>
        `;
    } else if (alreadyAdded) {
        buttonHtml = `
            <button class="game-button added" disabled onclick="event.stopPropagation();">
                ✓ In your list
            </button>
        `;
    } else {
        buttonHtml = `
            <button 
                class="game-button" 
                data-category-rawg-id="${rawgId}"
                onclick="event.stopPropagation(); handleAddCategoryGame('${safeGame}', ${rawgId})"
            >
                Add to my list
            </button>
        `;
    }

    return `
        <article class="game-card clickable-card" onclick="window.location.href='game.html?rawgId=${rawgId}'">
            <div class="game-image-wrapper">
                <img 
                    src="${image}" 
                    alt="${title}" 
                    class="game-image"
                    onerror="this.closest('.game-card').remove();"
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

async function handleAddCategoryGame(encodedGame, rawgId) {
    try {
        const game = JSON.parse(decodeURIComponent(encodedGame));

        const buttons = document.querySelectorAll(`[data-category-rawg-id="${rawgId}"]`);

        buttons.forEach(button => {
            button.textContent = "Adding...";
            button.disabled = true;
        });

        await addRawgGameToMyList(game);

        buttons.forEach(button => {
            button.textContent = "✓ In your list";
            button.disabled = true;
            button.classList.add("added");
            button.removeAttribute("onclick");
        });
        
        if (typeof checkAndShowNewAchievements === "function") {
            await checkAndShowNewAchievements();
        }

    } catch (error) {
        console.error(error);
        alert("Could not add the game to your list.");

        const buttons = document.querySelectorAll(`[data-category-rawg-id="${rawgId}"]`);

        buttons.forEach(button => {
            button.textContent = "Add to my list";
            button.disabled = false;
        });
    }
}

function updatePagination() {
    const pageIndicator = document.getElementById("pageIndicator");
    const prevButton = document.getElementById("prevPageButton");
    const nextButton = document.getElementById("nextPageButton");

    pageIndicator.textContent = `Page ${currentPage}`;

    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = !hasNextPage;
}