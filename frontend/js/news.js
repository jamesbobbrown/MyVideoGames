const newsData = [
    {
      title: "New DLC announced for a popular RPG",
      description: "A new expansion is coming with fresh areas, bosses and weapons for players to explore.",
      tag: "DLC",
      image: "https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Big gaming event confirmed for summer",
      description: "Several studios will present new trailers, gameplay previews and release dates during the event.",
      tag: "Event",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Indie game surprises players with excellent reviews",
      description: "A small studio is getting a lot of attention after launching a very polished and creative title.",
      tag: "Release",
      image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Patch improves performance and balance",
      description: "The latest update fixes several bugs, improves optimisation and adjusts some overpowered builds.",
      tag: "Update",
      image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=900&q=80"
    }
  ];
  
  const newsContainer = document.getElementById("newsContainer");
  
  newsContainer.innerHTML = newsData
    .map(
      (news) => `
      <article class="news-card">
        <img src="${news.image}" alt="${news.title}">
        <div class="news-content">
          <h3>${news.title}</h3>
          <p>${news.description}</p>
          <span class="news-tag">${news.tag}</span>
        </div>
      </article>
    `
    )
    .join("");
  
  const navAuthLink = document.getElementById("navAuthLink");
  const currentUserNews = JSON.parse(localStorage.getItem("currentUser"));
  
  if (navAuthLink && currentUserNews) {
    navAuthLink.textContent = currentUserNews.username;
    navAuthLink.href = "library.html";
  }