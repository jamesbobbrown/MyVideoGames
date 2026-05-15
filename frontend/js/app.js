let homeCategories = [];
let carouselIndexes = {};

document.addEventListener("DOMContentLoaded", function () {
    renderHomeHeroActions();
    loadHomeCategories();
});

function renderHomeHeroActions() {
    const container = document.getElementById("homeHeroActions");

    if (!container) {
        return;
    }

    const user = getLoggedUser();

    if (user) {
        container.innerHTML = `
            <a href="library.html" class="btn btn-primary">Go to My List</a>
            <a href="profile.html" class="btn btn-secondary">View profile</a>
        `;
    } else {
        container.innerHTML = `
            <a href="library.html" class="btn btn-primary">Go to My List</a>
            <a href="login.html" class="btn btn-secondary">Create account</a>
        `;
    }
}

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

        homeCategories = categories.map((category, index) => {
            const games = category.juegos || category.Juegos || [];
            const title = category.titulo || category.Titulo || "Games";

            return {
                id: `category-${index}`,
                titulo: title,
                type: getCategoryTypeFromTitle(title),
                juegos: games.filter((game) => {
                    const image = game.imagenUrl || game.ImagenUrl;
                    return image && image.trim() !== "";
                })
            };
        });

        carouselIndexes = {};

        homeCategories.forEach((category) => {
            carouselIndexes[category.id] = 0;
        });

        renderAllCategories();

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <p class="error-message">
                Could not load games. Make sure the backend is running and RAWG API key is configured.
            </p>
        `;
    }
}

function renderAllCategories() {
    const container = document.getElementById("home-categories-container");

    if (!container) {
        return;
    }

    container.innerHTML = homeCategories
        .map((category) => createCategorySection(category))
        .join("");
}

function createCategorySection(category) {
    const currentIndex = carouselIndexes[category.id] || 0;
    const visibleGames = category.juegos.slice(currentIndex, currentIndex + 5);

    const canGoBack = currentIndex > 0;
    const canGoNext = currentIndex + 5 < category.juegos.length;

    return `
        <section class="games-category">
            <div class="category-header">
                <div class="category-title-row">
                    <div class="section-title">
                        <h2>${category.titulo}</h2>
                        <p>Selected from RAWG API · ${category.juegos.length} games loaded</p>
                    </div>

                    <a href="${getCategoryUrl(category)}" class="view-all-link">
                        View all
                    </a>
                </div>

                <div class="carousel-controls">
                    <button 
                        type="button" 
                        class="carousel-btn" 
                        onclick="moveCarousel('${category.id}', -5)"
                        ${canGoBack ? "" : "disabled"}
                    >
                        ‹
                    </button>

                    <button 
                        type="button" 
                        class="carousel-btn" 
                        onclick="moveCarousel('${category.id}', 5)"
                        ${canGoNext ? "" : "disabled"}
                    >
                        ›
                    </button>
                </div>
            </div>

            <div class="games-grid">
                ${visibleGames.map(game => createRawgGameCard(game)).join("")}
            </div>
        </section>
    `;
}

function moveCarousel(categoryId, amount) {
    const category = homeCategories.find((c) => c.id === categoryId);

    if (!category) {
        return;
    }

    const currentIndex = carouselIndexes[categoryId] || 0;
    let nextIndex = currentIndex + amount;

    if (nextIndex < 0) {
        nextIndex = 0;
    }

    if (nextIndex >= category.juegos.length) {
        nextIndex = Math.max(0, category.juegos.length - 5);
    }

    carouselIndexes[categoryId] = nextIndex;

    renderAllCategories();
}

function getCategoryTypeFromTitle(title) {
    const normalized = title.toLowerCase();

    if (normalized.includes("top rated")) {
        return "top-rated";
    }

    if (normalized.includes("new releases")) {
        return "new-releases";
    }

    if (normalized.includes("popular")) {
        return "popular";
    }

    if (normalized.includes("action")) {
        return "action";
    }

    if (normalized.includes("rpg")) {
        return "rpg";
    }

    if (normalized.includes("indie")) {
        return "indie";
    }

    if (normalized.includes("shooter")) {
        return "shooter";
    }

    return "popular";
}

function getCategoryUrl(category) {
    const type = category.type || getCategoryTypeFromTitle(category.titulo);
    return `category.html?type=${encodeURIComponent(type)}`;
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
            <button class="game-button login-required" onclick="event.stopPropagation(); goToLogin();">
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
                data-rawg-id="${rawgId}"
                onclick="event.stopPropagation(); handleAddRawgGame('${safeGame}', ${rawgId})"
            >
                Add to my list
            </button>
        `;
    }

    return `
        <article class="game-card clickable-card" onclick="goToGameDetail(${rawgId})">
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

function markGameAsAdded(rawgId) {
    homeCategories.forEach((category) => {
        category.juegos.forEach((game) => {
            const gameRawgId = game.rawgId || game.RawgId;

            if (Number(gameRawgId) === Number(rawgId)) {
                game.yaAnadido = true;
                game.YaAnadido = true;
            }
        });
    });

    const buttons = document.querySelectorAll(`[data-rawg-id="${rawgId}"]`);

    buttons.forEach((button) => {
        button.textContent = "✓ In your list";
        button.disabled = true;
        button.classList.add("added");
        button.removeAttribute("onclick");
    });
}

function goToGameDetail(rawgId) {
    window.location.href = `game.html?rawgId=${rawgId}`;
}

function goToLogin() {
    window.location.href = "login.html";
}

async function handleAddRawgGame(encodedGame, rawgId) {
    try {
        const game = JSON.parse(decodeURIComponent(encodedGame));

        const buttons = document.querySelectorAll(`[data-rawg-id="${rawgId}"]`);

        buttons.forEach((button) => {
            button.textContent = "Adding...";
            button.disabled = true;
        });

        await addRawgGameToMyList(game);

        markGameAsAdded(rawgId);
        
        if (typeof checkAndShowNewAchievements === "function") {
            await checkAndShowNewAchievements();
        }

    } catch (error) {
        console.error(error);
        alert("Could not add the game to your list.");

        const buttons = document.querySelectorAll(`[data-rawg-id="${rawgId}"]`);

        buttons.forEach((button) => {
            button.textContent = "Add to my list";
            button.disabled = false;
        });
    }
}