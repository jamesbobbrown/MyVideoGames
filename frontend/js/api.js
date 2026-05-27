const API_BASE_URL = "http://localhost:5062";

async function apiRequest(endpoint, method = "GET", body = null) {
    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    let data = null;
    const text = await response.text();

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        throw new Error(typeof data === "string" ? data : "Request failed");
    }

    return data;
}

async function getHomeCategories() {
    const user = getLoggedUser();
    const userId = user ? user.id : null;

    let endpoint = "/Videojuego/homeRawg";

    if (userId) {
        endpoint += `?usuarioId=${userId}`;
    }

    return await apiRequest(endpoint, "GET");
}

async function getRawgGameDetail(rawgId) {
    return await apiRequest(`/Videojuego/getExternalById?rawgId=${rawgId}`, "GET");
}

async function addRawgGameToMyList(game) {
    const user = getLoggedUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const releaseDate =
        game.fechaLanzamiento ||
        game.FechaLanzamiento ||
        game.released ||
        null;

    const savedGame = await apiRequest("/Videojuego/add", "POST", {
        data: {
            titulo: game.titulo || game.Titulo || game.name,
            genero: game.genero || game.Genero || getFirstGenreFromRawg(game) || "Unknown genre",
            plataforma: game.plataforma || game.Plataforma || getPlatformsFromRawg(game) || "Unknown platform",
            fechaLanzamiento: formatDateForBackend(releaseDate),
            imagenUrl: game.imagenUrl || game.ImagenUrl || game.background_image || "",
            rawgId: game.rawgId || game.RawgId || game.id
        },
        pagination: null,
        filters: []
    });

    const videojuegoId = savedGame.id || savedGame.Id;

    const listResult = await apiRequest("/ListaUsuario/add", "POST", {
        data: {
            usuarioId: user.id,
            videojuegoId: videojuegoId,
            estado: "toplay",
            puntuacion: null
        },
        pagination: null,
        filters: []
    });

    if (typeof checkAndShowNewAchievements === "function") {
        await checkAndShowNewAchievements();
    }

    return listResult;
}

function formatDateForBackend(dateValue) {
    if (!dateValue) {
        return null;
    }

    if (dateValue.includes("T")) {
        return dateValue;
    }

    return `${dateValue}T00:00:00`;
}

function getFirstGenreFromRawg(game) {
    if (game.genres && game.genres.length > 0) {
        return game.genres[0].name;
    }

    return null;
}

function getPlatformsFromRawg(game) {
    if (!game.platforms || game.platforms.length === 0) {
        return null;
    }

    return game.platforms
        .slice(0, 3)
        .map((p) => p.platform?.name)
        .filter(Boolean)
        .join(", ");
}

async function getRecommendationsForUser() {
    const user = getLoggedUser();

    if (!user) {
        return [];
    }

    return await apiRequest(`/Videojuego/recommendations?usuarioId=${user.id}`, "GET");
}