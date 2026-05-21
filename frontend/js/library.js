const quickAddForm = document.getElementById("quickAddForm");
const playedList = document.getElementById("playedList");
const toPlayList = document.getElementById("toPlayList");
const favoriteList = document.getElementById("favoriteList");
const welcomeUser = document.getElementById("welcomeUser");

const gameStatusSelect = document.getElementById("gameStatus");
const gameRatingInput = document.getElementById("gameRating");

const gameSearchInput = document.getElementById("gameSearchInput");
const searchResults = document.getElementById("searchResults");
const selectedGamePreview = document.getElementById("selectedGamePreview");
const selectedGameIdInput = document.getElementById("selectedGameId");
const selectedGameTitleInput = document.getElementById("selectedGameTitle");
const recommendationsContainer = document.getElementById("recommendationsContainer");
const gameReviewInput = document.getElementById("gameReview");
const currentUser = getLoggedUser();

let searchTimeout = null;
let selectedExternalGame = null;

if (currentUser) {
    welcomeUser.textContent = `Logged in as ${currentUser.username || currentUser.email}`;
} else {
    welcomeUser.textContent = "You must log in to add games to your library.";
}

function updateRatingVisibility() {
    const status = gameStatusSelect.value;

    if (status === "toplay") {
        gameRatingInput.value = "";
        gameRatingInput.disabled = true;
        gameRatingInput.placeholder = "No rating for To Play";
    } else {
        gameRatingInput.disabled = false;
        gameRatingInput.placeholder = "1-10";
    }
}

gameStatusSelect.addEventListener("change", updateRatingVisibility);

function getGameImage(game) {
    return game.background_image || "https://placehold.co/180x110/1f2937/ffffff?text=No+Image";
}

function getGameGenre(game) {
    if (game.genres && game.genres.length > 0) {
        return game.genres[0].name;
    }

    return "Unknown genre";
}

function getGamePlatforms(game) {
    if (!game.platforms || game.platforms.length === 0) {
        return "Unknown platform";
    }

    return game.platforms
        .slice(0, 3)
        .map((p) => p.platform?.name)
        .filter(Boolean)
        .join(", ");
}

function renderList(container, items, emptyText) {
    if (!items || !items.length) {
        container.innerHTML = `<div class="empty-box">${emptyText}</div>`;
        return;
    }

    container.innerHTML = items
        .map((item) => {
            const safeItem = encodeURIComponent(JSON.stringify(item));

            return `
                <div class="list-item list-item-expanded">
                    ${item.imagenUrl ? `
                        <img 
                            src="${item.imagenUrl}" 
                            alt="${item.titulo}"
                            class="list-item-image"
                            onerror="this.style.display='none';"
                        >
                    ` : ""}

                    <div class="list-item-left">
                        <h3>${item.titulo}</h3>
                        <p>Status: ${formatStatus(item.estado)}</p>

                        ${
                            item.review
                                ? `<p class="list-review">"${item.review}"</p>`
                                : `<p class="list-review muted-review">No review yet.</p>`
                        }
                    </div>

                    <div class="list-item-right">
                        ${
                            item.puntuacion !== null && item.puntuacion !== undefined
                                ? `<span class="rating-pill">⭐ ${item.puntuacion}/10</span>`
                                : ""
                        }

                        <button 
                            type="button"
                            class="btn btn-secondary small-edit-btn" 
                            onclick="openEditListItem('${safeItem}')"
                        >
                            Edit
                        </button>

                        <button 
                            type="button"
                            class="delete-btn" 
                            onclick="deleteListItem(${item.id})"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            `;
        })
        .join("");
}

function formatStatus(status) {
    if (status === "played") return "Played";
    if (status === "toplay") return "To Play";
    if (status === "favorite") return "Favorite";
    return status;
}

async function loadUserList() {
    if (!currentUser?.id) {
        playedList.innerHTML = `<div class="empty-box">Log in to see your played games.</div>`;
        toPlayList.innerHTML = `<div class="empty-box">Log in to see your backlog.</div>`;
        favoriteList.innerHTML = `<div class="empty-box">Log in to see your favourites.</div>`;
        return;
    }

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
    if (!results || !results.length) {
        searchResults.innerHTML = `
            <div class="search-empty">
                No games found.
            </div>
        `;
        searchResults.style.display = "block";
        return;
    }

    searchResults.innerHTML = results
        .map((game) => {
            const image = getGameImage(game);
            const genre = getGameGenre(game);
            const platforms = getGamePlatforms(game);

            return `
                <button class="search-result-item" type="button" data-id="${game.id}">
                    <img 
                        src="${image}" 
                        alt="${game.name}" 
                        onerror="this.src='https://placehold.co/180x110/1f2937/ffffff?text=No+Image';"
                    >

                    <div class="search-result-text">
                        <h4>${game.name}</h4>

                        <div class="search-result-meta">
                            <span>${genre}</span>
                            <span>⭐ ${game.rating ?? "N/A"}</span>
                            <span>${game.released || "Unknown date"}</span>
                        </div>

                        <p>${platforms}</p>
                    </div>
                </button>
            `;
        })
        .join("");

    searchResults.style.display = "block";

    document.querySelectorAll(".search-result-item").forEach((item) => {
        item.addEventListener("click", async function () {
            const rawgId = this.dataset.id;

            try {
                searchResults.innerHTML = `<div class="search-empty">Loading selected game...</div>`;

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

    const image = getGameImage(game);
    const genre = getGameGenre(game);
    const platforms = getGamePlatforms(game);
    const description = game.description_raw
        ? game.description_raw.slice(0, 220) + "..."
        : "No description available.";

    selectedGamePreview.innerHTML = `
        <img 
            src="${image}" 
            alt="${game.name}"
            onerror="this.src='https://placehold.co/260x150/1f2937/ffffff?text=No+Image';"
        >

        <div class="selected-game-info">
            <div class="selected-game-title-row">
                <h3>${game.name}</h3>
                <span class="rating-pill">⭐ ${game.rating ?? "N/A"}</span>
            </div>

            <p class="selected-game-meta">
                ${genre} • ${game.released || "Unknown date"} • ${platforms}
            </p>

            <p>${description}</p>
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

    searchResults.innerHTML = `<div class="search-empty">Searching...</div>`;
    searchResults.style.display = "block";

    searchTimeout = setTimeout(async () => {
        try {
            const results = await apiRequest(`/Videojuego/searchExternal?query=${encodeURIComponent(query)}`);
            renderSearchResults(results);
        } catch (error) {
            searchResults.innerHTML = `
                <div class="search-empty">
                    Could not search games. Try again.
                </div>
            `;
            searchResults.style.display = "block";
        }
    }, 300);
});

async function ensureGameExistsInDatabase(rawgGame) {
    const allGames = await apiRequest("/Videojuego/getList");

    const existing = allGames.find((g) =>
        g.rawgId === rawgGame.id ||
        g.RawgId === rawgGame.id
    );

    if (existing) {
        return existing;
    }

    const created = await apiRequest("/Videojuego/add", "POST", {
        data: {
            titulo: rawgGame.name,
            genero: getGameGenre(rawgGame),
            plataforma: getGamePlatforms(rawgGame),
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
                    videojuegoId: dbGame.id || dbGame.Id,
                    estado: status,
                    puntuacion: rating ? Number(rating) : null,
                    review: gameReviewInput.value.trim() || null
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

        if (typeof checkAndShowNewAchievements === "function") {
            await checkAndShowNewAchievements();
        }
        
        await loadUserList();
        await loadRecommendations();

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
async function loadRecommendations() {
    if (!currentUser?.id || !recommendationsContainer) {
        return;
    }

    try {
        const recommendations = await getRecommendationsForUser();

        if (!recommendations || recommendations.length === 0) {
            recommendationsContainer.innerHTML = `
                <div class="empty-box">
                    Add more games to your lists to improve recommendations.
                </div>
            `;
            return;
        }

        recommendationsContainer.innerHTML = recommendations
            .map(game => createRecommendationCard(game))
            .join("");

        attachRecommendationButtons();

    } catch (error) {
        console.error(error);

        recommendationsContainer.innerHTML = `
            <div class="empty-box">
                Could not load recommendations.
            </div>
        `;
    }
}

function createRecommendationCard(game) {
    const rawgId = game.rawgId || game.RawgId;
    const title = game.titulo || game.Titulo || "Unknown game";
    const genre = game.genero || game.Genero || "Unknown genre";
    const rating = game.rating || game.Rating || "N/A";
    const image = game.imagenUrl || game.ImagenUrl || "";

    const safeGame = encodeURIComponent(JSON.stringify({
        rawgId: rawgId,
        titulo: title,
        genero: genre,
        rating: rating,
        imagenUrl: image,
        fechaLanzamiento: game.fechaLanzamiento || game.FechaLanzamiento || null
    }));

    return `
        <article class="recommendation-card">
            <img 
                src="${image}" 
                alt="${title}"
                onerror="this.closest('.recommendation-card').remove();"
            >

            <div class="recommendation-content">
                <h3>${title}</h3>
                <p>${genre}</p>
                <span>⭐ ${rating}</span>

                <div class="recommendation-actions">
                    <button 
                        type="button" 
                        class="game-button js-recommendation-add"
                        data-rawg-id="${rawgId}"
                        data-game="${safeGame}"
                    >
                        Add to my list
                    </button>

                    <a href="game.html?rawgId=${rawgId}" class="game-detail-link">
                        View details
                    </a>
                </div>
            </div>
        </article>
    `;
}

function attachRecommendationButtons() {
    document.querySelectorAll(".js-recommendation-add").forEach(button => {
        button.addEventListener("click", async function () {
            const rawgId = button.dataset.rawgId;
            const encodedGame = button.dataset.game;

            try {
                const game = JSON.parse(decodeURIComponent(encodedGame));

                button.textContent = "Adding...";
                button.disabled = true;

                await addRawgGameToMyList(game);

                button.textContent = "✓ In your list";
                button.classList.add("added");
                button.disabled = true;

                await loadUserList();

                if (typeof checkAndShowNewAchievements === "function") {
                    await checkAndShowNewAchievements();
                }

            } catch (error) {
                console.error(error);
                alert("Could not add recommended game.");

                button.textContent = "Add to my list";
                button.disabled = false;
            }
        });
    });
}
function openEditListItem(encodedItem) {
    const item = JSON.parse(decodeURIComponent(encodedItem));

    document.getElementById("editListItemId").value = item.id;
    document.getElementById("editGameTitle").textContent = item.titulo;
    document.getElementById("editGameStatus").value = item.estado;
    document.getElementById("editGameRating").value = item.puntuacion ?? "";
    document.getElementById("editGameReview").value = item.review || "";

    document.getElementById("editListModalOverlay").classList.remove("hidden");
    document.body.classList.add("modal-open");
}

function closeEditListItemModal() {
    document.getElementById("editListModalOverlay").classList.add("hidden");
    document.body.classList.remove("modal-open");
}

const editListForm = document.getElementById("editListForm");

if (editListForm) {
    editListForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const id = Number(document.getElementById("editListItemId").value);
        const estado = document.getElementById("editGameStatus").value;
        const rating = document.getElementById("editGameRating").value;
        const review = document.getElementById("editGameReview").value.trim();

        try {
            await apiRequest("/ListaUsuario/update", "PUT", {
                id: id,
                estado: estado,
                puntuacion: rating ? Number(rating) : null,
                review: review || null
            });

            closeEditListItemModal();
            await loadUserList();

            if (typeof loadRecommendations === "function") {
                await loadRecommendations();
            }

        } catch (error) {
            alert(error.message);
        }
    });
}

function closeEditListItemModal() {
    document.getElementById("editListModalOverlay").classList.add("hidden");
    document.body.classList.remove("modal-open");
}

document.getElementById("editListForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = Number(document.getElementById("editListItemId").value);
    const estado = document.getElementById("editGameStatus").value;
    const rating = document.getElementById("editGameRating").value;
    const review = document.getElementById("editGameReview").value.trim();

    try {
        await apiRequest("/ListaUsuario/update", "PUT", {
            id: id,
            estado: estado,
            puntuacion: rating ? Number(rating) : null,
            review: review || null
        });

        closeEditListItemModal();
        await loadUserList();

    } catch (error) {
        alert(error.message);
    }
});

updateRatingVisibility();
loadUserList();
loadRecommendations();