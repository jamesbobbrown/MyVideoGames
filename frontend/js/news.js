const postForm = document.getElementById("postForm");
const postType = document.getElementById("postType");
const postGame = document.getElementById("postGame");
const postTitle = document.getElementById("postTitle");
const postContent = document.getElementById("postContent");
const postMessage = document.getElementById("postMessage");
const postsContainer = document.getElementById("postsContainer");
const postFilter = document.getElementById("postFilter");

const currentUser = getLoggedUser();

document.addEventListener("DOMContentLoaded", function () {
    setupCommunityPage();
});

async function setupCommunityPage() {
    if (!currentUser) {
        postForm.innerHTML = `
            <div class="empty-box">
                You must log in to create posts.
                <br><br>
                <a href="login.html" class="btn btn-primary">Go to Login</a>
            </div>
        `;
    } else {
        await loadUserGamesForPostForm();
    }

    await loadPosts();

    postFilter.addEventListener("change", async function () {
        await loadPosts();
    });

    if (currentUser) {
        postForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            await createPost();
        });
    }
}

async function loadUserGamesForPostForm() {
    try {
        const games = await apiRequest(`/ListaUsuario/getByUser?usuarioId=${currentUser.id}`, "GET");

        if (!games || games.length === 0) {
            postGame.innerHTML = `
                <option value="">No linked game</option>
            `;
            return;
        }

        postGame.innerHTML = `
            <option value="">No linked game</option>
            ${games.map(game => `
                <option value="${game.videojuegoId}">
                    ${game.titulo}
                </option>
            `).join("")}
        `;

    } catch (error) {
        console.error(error);
        postGame.innerHTML = `
            <option value="">No linked game</option>
        `;
    }
}

async function loadPosts() {
    const selectedType = postFilter.value;

    postsContainer.innerHTML = `
        <div class="empty-box">Loading posts...</div>
    `;

    let endpoint = "/Post/getList";

    if (selectedType) {
        endpoint += `?tipo=${encodeURIComponent(selectedType)}`;
    }

    try {
        const posts = await apiRequest(endpoint, "GET");

        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-box">No posts yet.</div>
            `;
            return;
        }

        postsContainer.innerHTML = posts
            .map(post => createPostCard(post))
            .join("");

        attachPostDeleteButtons();

    } catch (error) {
        console.error(error);

        postsContainer.innerHTML = `
            <div class="empty-box">Could not load posts.</div>
        `;
    }
}

function createPostCard(post) {
    const id = post.id || post.Id;
    const usuarioId = post.usuarioId || post.UsuarioId;
    const username = post.username || post.Username || "Unknown user";
    const type = post.tipo || post.Tipo || "post";
    const title = post.titulo || post.Titulo || "Untitled";
    const content = post.contenido || post.Contenido || "";
    const gameTitle = post.videojuegoTitulo || post.VideojuegoTitulo || "";
    const image = post.imagenUrl || post.ImagenUrl || "";
    const date = post.fechaPublicacion || post.FechaPublicacion || "";

    const canDelete = currentUser && Number(currentUser.id) === Number(usuarioId);
const profileLink = `public-profile.html?userId=${usuarioId}`;
    return `
        <article class="post-card">
            ${image ? `
                <img 
                    src="${image}" 
                    alt="${gameTitle || title}"
                    onerror="this.style.display='none';"
                >
            ` : ""}

            <div class="post-card-content">
                <div class="post-card-top">
                    <span class="post-type ${type}">${formatPostType(type)}</span>
                    <span class="post-date">${formatPostDate(date)}</span>
                </div>

                <h3>${title}</h3>

                <p class="post-author">
                    By <a href="${profileLink}" class="user-profile-link"><strong>${username}</strong></a>
                    ${gameTitle ? ` · Linked game: <strong>${gameTitle}</strong>` : ""}
                </p>

                <p class="post-content">${content}</p>

                ${canDelete ? `
                    <button 
                        type="button" 
                        class="delete-btn js-delete-post" 
                        data-post-id="${id}"
                    >
                        Delete
                    </button>
                ` : ""}
            </div>
        </article>
    `;
}

async function createPost() {
    const type = postType.value;
    const title = postTitle.value.trim();
    const content = postContent.value.trim();
    const videojuegoId = postGame.value ? Number(postGame.value) : null;

    if (!type || !title || !content) {
        postMessage.textContent = "Type, title and content are required.";
        postMessage.style.color = "#ff5d73";
        return;
    }

    try {
        await apiRequest("/Post/add", "POST", {
            data: {
                usuarioId: currentUser.id,
                videojuegoId: videojuegoId,
                tipo: type,
                titulo: title,
                contenido: content
            },
            pagination: null,
            filters: []
        });

        postMessage.textContent = "Post published successfully.";
        postMessage.style.color = "#2dd4bf";

        postForm.reset();

        await loadPosts();

    } catch (error) {
        postMessage.textContent = error.message;
        postMessage.style.color = "#ff5d73";
    }
}

function attachPostDeleteButtons() {
    document.querySelectorAll(".js-delete-post").forEach(button => {
        button.addEventListener("click", async function () {
            const postId = button.dataset.postId;

            if (!confirm("Delete this post?")) {
                return;
            }

            try {
                await apiRequest(`/Post/delete?id=${postId}&usuarioId=${currentUser.id}`, "DELETE");
                await loadPosts();
            } catch (error) {
                alert(error.message);
            }
        });
    });
}

function formatPostType(type) {
    if (type === "lfg") return "LFG";
    if (type === "blog") return "Blog";
    if (type === "review") return "Review";
    if (type === "news") return "News";
    return "Post";
}

function formatPostDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString();
}