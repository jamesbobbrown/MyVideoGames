document.addEventListener("DOMContentLoaded", function () {
    loadGameDetail();
});

async function loadGameDetail() {
    const container = document.getElementById("game-detail-container");
    const params = new URLSearchParams(window.location.search);
    const rawgId = params.get("rawgId");

    if (!rawgId) {
        container.innerHTML = `
            <p class="error-message">No game selected.</p>
        `;
        return;
    }

    try {
        const game = await getRawgGameDetail(rawgId);

        renderGameDetail(game);

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <p class="error-message">Could not load game detail.</p>
        `;
    }
}

function renderGameDetail(game) {
    const container = document.getElementById("game-detail-container");
    const user = getLoggedUser();

    const title = game.name || "Unknown game";
    const image = game.background_image || "https://placehold.co/1200x600/1f2937/ffffff?text=No+Image";
    const rating = game.rating ?? "N/A";
    const released = game.released || "Unknown date";
    const description = game.description_raw || "No description available.";
    const genres = getGenres(game);
    const platforms = getPlatforms(game);

    const safeGame = encodeURIComponent(JSON.stringify({
        id: game.id,
        name: game.name,
        background_image: game.background_image,
        released: game.released,
        genres: game.genres,
        platforms: game.platforms
    }));

    let addButton = "";

    if (!user) {
        addButton = `
            <button class="btn btn-primary" onclick="window.location.href='login.html'">
                Login to add
            </button>
        `;
    } else {
        addButton = `
            <button class="btn btn-primary" id="detailAddButton" onclick="handleAddGameFromDetail('${safeGame}')">
                Add to my list
            </button>
        `;
    }

    container.innerHTML = `
        <section class="game-detail-hero" style="background-image: linear-gradient(90deg, rgba(8,12,20,0.96), rgba(8,12,20,0.72)), url('${image}')">
            <div class="game-detail-content">
                <a href="index.html" class="back-link">← Back to home</a>

                <h1>${title}</h1>

                <div class="detail-badges">
                    <span>⭐ ${rating}</span>
                    <span>${released}</span>
                    <span>${genres}</span>
                </div>

                <p>${description}</p>

                <div class="detail-actions">
                    ${addButton}
                    <a href="library.html" class="btn btn-secondary">Go to Library</a>
                </div>
            </div>
        </section>

        <section class="game-detail-info">
            <div class="detail-info-card">
                <h2>Game information</h2>

                <div class="detail-info-grid">
                    <div>
                        <strong>Genres</strong>
                        <p>${genres}</p>
                    </div>

                    <div>
                        <strong>Platforms</strong>
                        <p>${platforms}</p>
                    </div>

                    <div>
                        <strong>Release date</strong>
                        <p>${released}</p>
                    </div>

                    <div>
                        <strong>RAWG rating</strong>
                        <p>${rating}</p>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function getGenres(game) {
    if (!game.genres || game.genres.length === 0) {
        return "Unknown genre";
    }

    return game.genres.map(g => g.name).join(", ");
}

function getPlatforms(game) {
    if (!game.platforms || game.platforms.length === 0) {
        return "Unknown platform";
    }

    return game.platforms
        .slice(0, 6)
        .map(p => p.platform?.name)
        .filter(Boolean)
        .join(", ");
}

async function handleAddGameFromDetail(encodedGame) {
    const button = document.getElementById("detailAddButton");

    try {
        const game = JSON.parse(decodeURIComponent(encodedGame));

        if (button) {
            button.textContent = "Adding...";
            button.disabled = true;
        }

        await addRawgGameToMyList(game);

        if (button) {
            button.textContent = "✓ In your list";
            button.disabled = true;
            button.classList.add("added");
        }

        // No reload here.

    } catch (error) {
        console.error(error);
        alert("Could not add game to your list.");

        if (button) {
            button.textContent = "Add to my list";
            button.disabled = false;
        }
    }
}