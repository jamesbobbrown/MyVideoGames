document.addEventListener("DOMContentLoaded", function () {
    loadPublicProfile();
});

async function loadPublicProfile() {
    const container = document.getElementById("publicProfileContainer");
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");

    if (!userId) {
        container.innerHTML = `
            <section class="profile-hero">
                <div class="profile-card-large">
                    <h1>No user selected</h1>
                    <p>This profile cannot be loaded because no user ID was provided.</p>
                    <a href="news.html" class="btn btn-primary">Back to Community</a>
                </div>
            </section>
        `;
        return;
    }

    try {
        const user = await apiRequest(`/Usuario/getPublic?id=${userId}`, "GET");
        const items = await apiRequest(`/ListaUsuario/getByUser?usuarioId=${userId}`, "GET");
        const posts = await apiRequest(`/Post/getByUser?usuarioId=${userId}`, "GET");

        const stats = calculatePublicStats(items);
        const achievements = calculatePublicAchievements(items, stats);
        const ranking = calculateRanking(items);

        renderPublicProfile(user, stats, achievements, items, ranking, posts);

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <section class="profile-hero">
                <div class="profile-card-large">
                    <h1>Profile not found</h1>
                    <p>Could not load this user's profile.</p>
                    <a href="news.html" class="btn btn-primary">Back to Community</a>
                </div>
            </section>
        `;
    }
}

function calculatePublicStats(items) {
    const totalGames = items.length;
    const played = items.filter(x => x.estado === "played").length;
    const toPlay = items.filter(x => x.estado === "toplay").length;
    const favorites = items.filter(x => x.estado === "favorite").length;

    const ratedGames = items.filter(x =>
        x.puntuacion !== null &&
        x.puntuacion !== undefined
    );

    const averageRating = ratedGames.length > 0
        ? (ratedGames.reduce((sum, x) => sum + Number(x.puntuacion), 0) / ratedGames.length).toFixed(1)
        : "N/A";

    const mostCommonGenre = getMostCommonGenre(items);

    return {
        totalGames,
        played,
        toPlay,
        favorites,
        ratedGames: ratedGames.length,
        averageRating,
        mostCommonGenre
    };
}

function getMostCommonGenre(items) {
    const counts = {};

    items.forEach(item => {
        const genre = item.genero || item.Genero || "Unknown";

        if (!genre || genre === "Unknown") {
            return;
        }

        const firstGenre = genre.split(",")[0].trim();

        counts[firstGenre] = (counts[firstGenre] || 0) + 1;
    });

    const entries = Object.entries(counts);

    if (entries.length === 0) {
        return "Unknown";
    }

    entries.sort((a, b) => b[1] - a[1]);

    return entries[0][0];
}

function calculatePublicAchievements(items, stats) {
    const soulsLikeCount = items.filter(item => {
        const title = (item.titulo || "").toLowerCase();
        const genre = (item.genero || "").toLowerCase();

        return (
            title.includes("dark souls") ||
            title.includes("elden ring") ||
            title.includes("bloodborne") ||
            title.includes("sekiro") ||
            title.includes("lies of p") ||
            genre.includes("rpg") ||
            genre.includes("action")
        );
    }).length;

    return [
        {
            icon: "🎮",
            title: "First Step",
            description: "Added the first game.",
            unlocked: stats.totalGames >= 1
        },
        {
            icon: "📚",
            title: "Collector",
            description: "Added 20 games to the library.",
            unlocked: stats.totalGames >= 20
        },
        {
            icon: "⭐",
            title: "Critic",
            description: "Rated 10 games.",
            unlocked: stats.ratedGames >= 10
        },
        {
            icon: "🕹️",
            title: "Backlog Master",
            description: "Added 10 games to To Play.",
            unlocked: stats.toPlay >= 10
        },
        {
            icon: "💜",
            title: "Favourite Hunter",
            description: "Added 5 favourite games.",
            unlocked: stats.favorites >= 5
        },
        {
            icon: "🔥",
            title: "Dedicated Player",
            description: "Marked 5 games as played.",
            unlocked: stats.played >= 5
        },
        {
            icon: "⚔️",
            title: "Souls Player",
            description: "Added 5 action/RPG/soulslike games.",
            unlocked: soulsLikeCount >= 5
        }
    ];
}

function calculateRanking(items) {
    return items
        .filter(item =>
            item.puntuacion !== null &&
            item.puntuacion !== undefined
        )
        .sort((a, b) => Number(b.puntuacion) - Number(a.puntuacion));
}

function renderPublicProfile(user, stats, achievements, items, ranking, posts) {
    const container = document.getElementById("publicProfileContainer");

    const userId = user.id || user.Id;
    const username = user.username || user.Username || "User";
    const firstLetter = username.charAt(0).toUpperCase();

    container.innerHTML = `
        <section class="profile-hero">
            <div class="profile-card-large">
                <div class="profile-top">
                    <div class="profile-avatar">${firstLetter}</div>

                    <div>
                        <p class="hero-kicker">Public profile</p>
                        <h1>${username}</h1>
                        <p>Community member profile</p>
                    </div>
                </div>

                <div class="profile-actions">
                    <a href="news.html" class="btn btn-primary">Community</a>
                    <a href="library.html" class="btn btn-secondary">My Library</a>
                </div>
            </div>
        </section>

        <section class="profile-section">
            <div class="section-title">
                <h2>${username}'s stats</h2>
                <p>Public stats based on this user's game lists.</p>
            </div>

            <div class="stats-grid">
                ${createStatCard("🎮", "Total games", stats.totalGames)}
                ${createStatCard("✅", "Played", stats.played)}
                ${createStatCard("🕹️", "To Play", stats.toPlay)}
                ${createStatCard("💜", "Favorites", stats.favorites)}
                ${createStatCard("⭐", "Average rating", stats.averageRating)}
                ${createStatCard("🏷️", "Main genre", stats.mostCommonGenre)}
            </div>
        </section>

        <section class="profile-section">
            <div class="section-title">
                <h2>Achievements</h2>
                <p>Achievements unlocked by this user.</p>
            </div>

            <div class="achievement-grid-profile">
                ${achievements.map(createAchievementCard).join("")}
            </div>
        </section>

        <section class="profile-section">
            <div class="section-title">
                <h2>Ranked games</h2>
                <p>Games scored by ${username}, ordered from highest to lowest.</p>
            </div>

            <div class="ranking-list">
                ${renderRanking(ranking)}
            </div>
        </section>

        <section class="profile-section">
            <div class="section-title">
                <h2>Public lists</h2>
                <p>Games this user has added to their library.</p>
            </div>

            <div class="public-list-grid">
                ${renderPublicLists(items)}
            </div>
        </section>

        <section class="profile-section">
            <div class="section-title">
                <h2>Recent posts</h2>
                <p>Community posts by ${username}.</p>
            </div>

            <div class="profile-recent-list">
                ${renderUserPosts(posts)}
            </div>
        </section>
    `;
}

function createStatCard(icon, label, value) {
    return `
        <article class="stat-card">
            <span>${icon}</span>
            <h3>${value}</h3>
            <p>${label}</p>
        </article>
    `;
}

function createAchievementCard(achievement) {
    return `
        <article class="achievement-profile-card ${achievement.unlocked ? "unlocked" : "locked"}">
            <div class="achievement-icon">${achievement.icon}</div>
            <div>
                <h3>${achievement.title}</h3>
                <p>${achievement.description}</p>
                <strong>${achievement.unlocked ? "Unlocked" : "Locked"}</strong>
            </div>
        </article>
    `;
}

function renderRanking(ranking) {
    if (!ranking || ranking.length === 0) {
        return `<div class="empty-box">This user has not rated any games yet.</div>`;
    }

    return ranking
        .map((item, index) => `
            <div class="ranking-item">
                <div class="ranking-position">#${index + 1}</div>

                <div class="ranking-info">
                    <h3>${item.titulo}</h3>

                    <p>
                        ${formatStatus(item.estado)}
                        ${item.genero ? `· ${item.genero}` : ""}
                    </p>

                    ${item.review ? `<p class="list-review">"${item.review}"</p>` : ""}
                </div>

                <div class="ranking-score">
                    ⭐ ${item.puntuacion}/10
                </div>
            </div>
        `)
        .join("");
}

function renderPublicLists(items) {
    if (!items || items.length === 0) {
        return `<div class="empty-box">This user has no public games yet.</div>`;
    }

    return items
        .map(item => `
            <article class="public-list-card">
                ${item.imagenUrl ? `
                    <img 
                        src="${item.imagenUrl}" 
                        alt="${item.titulo}"
                        onerror="this.style.display='none';"
                    >
                ` : ""}

                <div>
                    <h3>${item.titulo}</h3>
                    <p>${formatStatus(item.estado)}</p>
                    ${item.puntuacion !== null && item.puntuacion !== undefined
                        ? `<span class="rating-pill">⭐ ${item.puntuacion}/10</span>`
                        : ""
                    }
                </div>
            </article>
        `)
        .join("");
}

function renderUserPosts(posts) {
    if (!posts || posts.length === 0) {
        return `<div class="empty-box">This user has not created posts yet.</div>`;
    }

    return posts
        .slice(0, 5)
        .map(post => {
            const type = post.tipo || post.Tipo || "post";
            const title = post.titulo || post.Titulo || "Untitled";
            const content = post.contenido || post.Contenido || "";

            return `
                <div class="profile-recent-item">
                    <h3>${title}</h3>
                    <p>${formatPostType(type)} · ${content.slice(0, 120)}${content.length > 120 ? "..." : ""}</p>
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

function formatPostType(type) {
    if (type === "lfg") return "LFG";
    if (type === "blog") return "Blog";
    if (type === "review") return "Review";
    if (type === "news") return "News";
    return "Post";
}