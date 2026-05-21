document.addEventListener("DOMContentLoaded", function () {
    const applyButton = document.getElementById("rankingApplyButton");

    applyButton.addEventListener("click", loadGlobalRanking);

    document.getElementById("rankingGenre").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            loadGlobalRanking();
        }
    });

    loadGlobalRanking();
});

async function loadGlobalRanking() {
    const container = document.getElementById("globalRankingContainer");

    const genre = document.getElementById("rankingGenre").value.trim();
    const minRatings = document.getElementById("rankingMinRatings").value;

    container.innerHTML = `
        <p class="loading-message">Loading rankings...</p>
    `;

    let endpoint = `/ListaUsuario/globalRanking?minRatings=${encodeURIComponent(minRatings)}`;

    if (genre) {
        endpoint += `&genre=${encodeURIComponent(genre)}`;
    }

    try {
        const ranking = await apiRequest(endpoint, "GET");

        if (!ranking || ranking.length === 0) {
            container.innerHTML = `
                <div class="empty-box">
                    No ranked games found. Add ratings in your library to build the ranking.
                </div>
            `;
            return;
        }

        container.innerHTML = ranking
            .map((game, index) => createGlobalRankingItem(game, index))
            .join("");

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <div class="empty-box">
                Could not load global rankings.
            </div>
        `;
    }
}

function createGlobalRankingItem(game, index) {
    const rawgId = game.rawgId || game.RawgId;
    const title = game.titulo || game.Titulo || "Unknown game";
    const genre = game.genero || game.Genero || "Unknown genre";
    const platform = game.plataforma || game.Plataforma || "Unknown platform";
    const image = game.imagenUrl || game.ImagenUrl || "";
    const averageRating = game.averageRating || game.AverageRating || "N/A";
    const ratingCount = game.ratingCount || game.RatingCount || 0;
    const reviewCount = game.reviewCount || game.ReviewCount || 0;

    const detailsLink = rawgId
        ? `game.html?rawgId=${rawgId}`
        : "#";

    return `
        <article class="global-ranking-item">
            <div class="global-ranking-position">
                #${index + 1}
            </div>

            <a href="${detailsLink}" class="global-ranking-image-link">
                ${image ? `
                    <img 
                        src="${image}" 
                        alt="${title}"
                        onerror="this.style.display='none';"
                    >
                ` : `
                    <div class="ranking-image-placeholder">No image</div>
                `}
            </a>

            <div class="global-ranking-info">
                <a href="${detailsLink}">
                    <h3>${title}</h3>
                </a>

                <p>${genre}</p>
                <p>${platform}</p>

                <div class="global-ranking-meta">
                    <span>⭐ Average: ${averageRating}/10</span>
                    <span>${ratingCount} rating${ratingCount === 1 ? "" : "s"}</span>
                    <span>${reviewCount} review${reviewCount === 1 ? "" : "s"}</span>
                </div>
            </div>
        </article>
    `;
}