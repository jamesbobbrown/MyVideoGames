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

async function addRawgGameToMyList(game) {
    const user = getLoggedUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    /*
        Primero guardamos el videojuego en nuestra base de datos.
        Después lo añadimos a la lista del usuario.
    */

    const savedGame = await apiRequest("/Videojuego/add", "POST", {
        data: {
            titulo: game.titulo || game.Titulo,
            genero: game.genero || game.Genero || "Unknown genre",
            plataforma: "PC",
            fechaLanzamiento: game.fechaLanzamiento || game.FechaLanzamiento || null,
            imagenUrl: game.imagenUrl || game.ImagenUrl || "",
            rawgId: game.rawgId || game.RawgId
        },
        pagination: null,
        filters: []
    });

    const videojuegoId = savedGame.id || savedGame.Id;

    return await apiRequest("/ListaUsuario/add", "POST", {
        data: {
            usuarioId: user.id,
            videojuegoId: videojuegoId,
            estado: "Plan to play",
            puntuacion: null
        },
        pagination: null,
        filters: []
    });
}