// ===============================
// ACHIEVEMENT SYSTEM
// ===============================

const ACHIEVEMENT_STORAGE_PREFIX = "unlockedAchievements_";

document.addEventListener("DOMContentLoaded", function () {
    createAchievementToastContainer();
    initializeAchievementMemory();
});

function createAchievementToastContainer() {
    if (document.getElementById("achievementToastContainer")) {
        return;
    }

    const container = document.createElement("div");
    container.id = "achievementToastContainer";
    container.className = "achievement-toast-container";

    document.body.appendChild(container);
}

async function initializeAchievementMemory() {
    const user = getLoggedUser();

    if (!user) {
        return;
    }

    const storageKey = getAchievementStorageKey(user.id);
    const existing = localStorage.getItem(storageKey);

    if (existing) {
        return;
    }

    try {
        const items = await apiRequest(`/ListaUsuario/getByUser?usuarioId=${user.id}`);
        const achievements = calculateAchievementsFromItems(items);
        const unlockedIds = achievements
            .filter(a => a.unlocked)
            .map(a => a.id);

        localStorage.setItem(storageKey, JSON.stringify(unlockedIds));
    } catch (error) {
        console.error("Could not initialize achievements", error);
    }
}

async function checkAndShowNewAchievements() {
    const user = getLoggedUser();

    if (!user) {
        return;
    }

    try {
        const items = await apiRequest(`/ListaUsuario/getByUser?usuarioId=${user.id}`);
        const achievements = calculateAchievementsFromItems(items);

        const storageKey = getAchievementStorageKey(user.id);
        const oldUnlockedIds = JSON.parse(localStorage.getItem(storageKey) || "[]");

        const newUnlocked = achievements.filter(a =>
            a.unlocked && !oldUnlockedIds.includes(a.id)
        );

        const updatedUnlockedIds = achievements
            .filter(a => a.unlocked)
            .map(a => a.id);

        localStorage.setItem(storageKey, JSON.stringify(updatedUnlockedIds));

        newUnlocked.forEach((achievement, index) => {
            setTimeout(() => {
                showAchievementToast(achievement);
            }, index * 900);
        });

    } catch (error) {
        console.error("Could not check achievements", error);
    }
}

function getAchievementStorageKey(userId) {
    return `${ACHIEVEMENT_STORAGE_PREFIX}${userId}`;
}

function calculateAchievementsFromItems(items) {
    const stats = calculateAchievementStats(items);

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
            id: "first-step",
            icon: "🎮",
            title: "First Step",
            description: "You added your first game.",
            unlocked: stats.totalGames >= 1
        },
        {
            id: "collector",
            icon: "📚",
            title: "Collector",
            description: "You added 20 games to your library.",
            unlocked: stats.totalGames >= 20
        },
        {
            id: "critic",
            icon: "⭐",
            title: "Critic",
            description: "You rated 10 games.",
            unlocked: stats.ratedGames >= 10
        },
        {
            id: "backlog-master",
            icon: "🕹️",
            title: "Backlog Master",
            description: "You added 10 games to your To Play list.",
            unlocked: stats.toPlay >= 10
        },
        {
            id: "favourite-hunter",
            icon: "💜",
            title: "Favourite Hunter",
            description: "You added 5 favourite games.",
            unlocked: stats.favorites >= 5
        },
        {
            id: "dedicated-player",
            icon: "🔥",
            title: "Dedicated Player",
            description: "You marked 5 games as played.",
            unlocked: stats.played >= 5
        },
        {
            id: "souls-player",
            icon: "⚔️",
            title: "Souls Player",
            description: "You added 5 action/RPG/soulslike games.",
            unlocked: soulsLikeCount >= 5
        }
    ];
}

function calculateAchievementStats(items) {
    const totalGames = items.length;
    const played = items.filter(x => x.estado === "played").length;
    const toPlay = items.filter(x => x.estado === "toplay").length;
    const favorites = items.filter(x => x.estado === "favorite").length;

    const ratedGames = items.filter(x =>
        x.puntuacion !== null &&
        x.puntuacion !== undefined
    ).length;

    return {
        totalGames,
        played,
        toPlay,
        favorites,
        ratedGames
    };
}

function showAchievementToast(achievement) {
    createAchievementToastContainer();

    const container = document.getElementById("achievementToastContainer");

    const toast = document.createElement("div");
    toast.className = "achievement-toast";

    toast.innerHTML = `
        <div class="achievement-toast-icon">${achievement.icon}</div>

        <div class="achievement-toast-content">
            <p>Achievement unlocked!</p>
            <h3>${achievement.title}</h3>
            <span>${achievement.description}</span>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4200);
}