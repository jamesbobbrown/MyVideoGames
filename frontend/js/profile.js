document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
});

async function loadProfile() {
    const container = document.getElementById("profileContainer");
    const user = getLoggedUser();

    if (!user) {
        container.innerHTML = `
            <section class="profile-hero">
                <div class="profile-card-large">
                    <h1>You are not logged in</h1>
                    <p>Please log in to see your profile, stats and achievements.</p>
                    <a href="login.html" class="btn btn-primary">Go to Login</a>
                </div>
            </section>
        `;
        return;
    }

    try {
        const items = await apiRequest(`/ListaUsuario/getByUser?usuarioId=${user.id}`);

        const stats = calculateStats(items);
        const achievements = calculateAchievements(items, stats);
        const ranking = calculateProfileRanking(items);
       renderProfile(user, stats, achievements, items, ranking);

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <p class="error-message">Could not load profile.</p>
        `;
    }
}

function calculateStats(items) {
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

function calculateAchievements(items, stats) {
    const achievements = [];

    achievements.push({
        icon: "🎮",
        title: "First Step",
        description: "Add your first game to your library.",
        unlocked: stats.totalGames >= 1
    });

    achievements.push({
        icon: "📚",
        title: "Collector",
        description: "Add 20 games to your library.",
        unlocked: stats.totalGames >= 20
    });

    achievements.push({
        icon: "⭐",
        title: "Critic",
        description: "Rate 10 games.",
        unlocked: stats.ratedGames >= 10
    });

    achievements.push({
        icon: "🕹️",
        title: "Backlog Master",
        description: "Add 10 games to your To Play list.",
        unlocked: stats.toPlay >= 10
    });

    achievements.push({
        icon: "💜",
        title: "Favourite Hunter",
        description: "Add 5 favourite games.",
        unlocked: stats.favorites >= 5
    });

    achievements.push({
        icon: "🔥",
        title: "Dedicated Player",
        description: "Mark 5 games as played.",
        unlocked: stats.played >= 5
    });

    const soulsLikeCount = items.filter(item => {
        const title = (item.titulo || "").toLowerCase();
        const genre = (item.genero || "").toLowerCase();

        return (
            title.includes("dark souls") ||
            title.includes("elden ring") ||
            title.includes("bloodborne") ||
            title.includes("sekiro") ||
            genre.includes("rpg") ||
            genre.includes("action")
        );
    }).length;

    achievements.push({
        icon: "⚔️",
        title: "Souls Player",
        description: "Add 5 action/RPG/soulslike games.",
        unlocked: soulsLikeCount >= 5
    });

    return achievements;
}

function renderProfile(user, stats, achievements, items, ranking) {
    const container = document.getElementById("profileContainer");
    const username = user.username || user.email || "User";
    const firstLetter = username.charAt(0).toUpperCase();

    container.innerHTML = `
        <section class="profile-hero">
            <div class="profile-card-large">
                <div class="profile-top">
                    <div class="profile-avatar">${firstLetter}</div>

                    <div>
                        <p class="hero-kicker">Player profile</p>
                        <h1>${username}</h1>
                        <p>${user.email || ""}</p>
                    </div>
                </div>

                <div class="profile-actions">
                    <a href="library.html" class="btn btn-primary">Go to Library</a>
                    <a href="settings.html" class="btn btn-secondary">Settings</a>
                </div>
            </div>
        </section>

        <section class="profile-section">
            <div class="section-title">
                <h2>Your stats</h2>
                <p>Calculated from the games in your personal lists.</p>
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
                <p>Simple automatic achievements based on your activity.</p>
            </div>

            <div class="achievement-grid-profile">
                ${achievements.map(createAchievementCard).join("")}
            </div>
        </section>
        <section class="profile-section">
            <div class="section-title">
                <h2>Your ranked games</h2>
                <p>Your scored games ordered from highest to lowest.</p>
            </div>

            <div class="ranking-list">
                ${renderProfileRanking(ranking)}
            </div>
        </section>

        <section class="profile-section">
            <div class="section-title">
                <h2>Recent library activity</h2>
                <p>Your latest added games.</p>
            </div>

            <div class="profile-recent-list">
                ${renderRecentGames(items)}
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

function renderRecentGames(items) {
    if (!items || items.length === 0) {
        return `<div class="empty-box">No games in your library yet.</div>`;
    }

    return items
        .slice(-5)
        .reverse()
        .map(item => `
            <div class="profile-recent-item">
                <div>
                    <h3>${item.titulo}</h3>
                    <p>${formatStatus(item.estado)} ${item.puntuacion ? `· ⭐ ${item.puntuacion}/10` : ""}</p>
                </div>
            </div>
        `)
        .join("");
}

function formatStatus(status) {
    if (status === "played") return "Played";
    if (status === "toplay") return "To Play";
    if (status === "favorite") return "Favorite";
    return status;
}
function calculateProfileRanking(items) {
    return items
        .filter(item =>
            item.puntuacion !== null &&
            item.puntuacion !== undefined
        )
        .sort((a, b) => Number(b.puntuacion) - Number(a.puntuacion));
}
function renderProfileRanking(ranking) {
    if (!ranking || ranking.length === 0) {
        return `<div class="empty-box">You have not rated any games yet.</div>`;
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