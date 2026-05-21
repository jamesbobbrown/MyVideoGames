# MyVideoGames

MyVideoGames is a web application for tracking videogames. Users can search real games using the RAWG API, add games to personal lists, rate them, view game details, see profile stats and achievements, and create community posts such as blogs, reviews and LFG posts.

## Project idea

The idea is similar to MyAnimeList, but focused on videogames.

Users can:

- Create an account and log in.
- Search videogames from RAWG.
- Add games to personal lists.
- Mark games as Played, To Play or Favourite.
- Rate games.
- View game details.
- Browse homepage categories such as popular, top rated and new releases.
- Use category pages with pagination and filters.
- See their profile stats and achievements.
- Create community posts, blogs, reviews and LFG posts.

## Technologies used

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- ASP.NET Core Web API
- C#
- Entity Framework Core
- SQLite

### External API

- RAWG Video Games Database API

## Architecture

The frontend does not connect directly to the database or to RAWG.

The structure is:

```txt
Frontend HTML/CSS/JS
        ↓
My ASP.NET Core Web API
        ↓
SQLite database
        ↓
RAWG external API
The project uses my own API to manage users, lists, posts, videogames, profile stats and recommendations. RAWG is used as an external API to get real videogame information such as names, images, ratings, genres and platforms.

Main features
User system
Register user
Login user
User dropdown menu
Settings page
Update username, email and password
Videogames
Search games from RAWG
View game details
Homepage categories from RAWG
Category pages with pagination
Filter by genre, rating and search text
Add games to user lists
Lists
Played games
To Play games
Favourite games
Rating system
Delete games from list
Profile
User profile page
Total games
Played games
To Play games
Favourite games
Average rating
Main genre
Achievements
Community
News posts
Blog posts
Reviews
LFG posts
Posts can be linked to games from the user library
Users can delete their own posts
Backend API endpoints
UsuarioController
POST /Usuario/register
POST /Usuario/login
PUT  /Usuario/update
GET  /Usuario/getList
VideojuegoController
GET    /Videojuego/homeRawg
GET    /Videojuego/categoryRawg
GET    /Videojuego/searchExternal
GET    /Videojuego/getExternalById
GET    /Videojuego/recommendations
GET    /Videojuego/getList
POST   /Videojuego/add
DELETE /Videojuego/delete
ListaUsuarioController
POST   /ListaUsuario/add
GET    /ListaUsuario/getByUser
DELETE /ListaUsuario/delete
PostController
GET    /Post/getList
GET    /Post/getByUser
POST   /Post/add
DELETE /Post/delete
Database entities

The main database tables are:

TA_USUARIO
TA_VIDEOJUEGO
TA_LISTA_USUARIO
TA_POST
TA_USUARIO

Stores registered users.

ID
USERNAME
EMAIL
PASSWORD
FECHA_REGISTRO
TA_VIDEOJUEGO

Stores videogames saved locally from RAWG.

ID
TITULO
GENERO
PLATAFORMA
FECHA_LANZAMIENTO
IMAGEN_URL
RAWG_ID
TA_LISTA_USUARIO

Stores games added to each user's personal list.

ID
USUARIO_ID
VIDEOJUEGO_ID
ESTADO
PUNTUACION
FECHA_AGREGADO
TA_POST

Stores community posts.

ID
USUARIO_ID
VIDEOJUEGO_ID
TIPO
TITULO
CONTENIDO
FECHA_PUBLICACION
How to run the project
1. Clone the repository
git clone https://github.com/jamesbobbrown/MyVideoGames.git
cd MyVideoGames
2. Configure RAWG API key

Create this local file:

backend/WebApi/appsettings.Development.json

Add your RAWG API key:

{
  "Rawg": {
    "ApiKey": "YOUR_RAWG_API_KEY_HERE"
  }
}

This file is ignored by Git and should not be uploaded.

The public appsettings.json keeps the API key empty:

{
  "Rawg": {
    "ApiKey": ""
  }
}
3. Install EF Core tools if needed
dotnet tool install --global dotnet-ef
4. Create/update database
cd backend/WebApi
dotnet ef database update
5. Run backend
dotnet run

The backend normally runs on:

http://localhost:5062
6. Run frontend

Open the frontend/index.html file with Live Server in Visual Studio Code.

The frontend expects the backend URL to be:

const API_BASE_URL = "http://localhost:5062";

This is configured in:

frontend/js/api.js
Security notes

The RAWG API key is not uploaded to GitHub.

Ignored local files include:

backend/WebApi/appsettings.Development.json
*.db
*.db-shm
*.db-wal
bin/
obj/
node_modules/
dist/
.env

If the RAWG key is ever accidentally uploaded, it should be regenerated.

Future improvements

Possible future features:

Public user profiles
Written reviews for every rated game
Ranking of user-rated games from best to worst
Private messages between users
More advanced LFG system
Comments on posts
Admin panel
Better authentication using JWT
Uploadable profile pictures
More advanced recommendations
Deployment with Docker or a cloud service
Demo flow

A good way to demonstrate the app:

1. Open homepage.
2. Show RAWG game categories.
3. Log in.
4. Show the user dropdown.
5. Browse a category using View All.
6. Filter games by genre/rating.
7. Open a game detail page.
8. Add a game to the list.
9. Go to Library.
10. Search and add another game.
11. Show Profile stats and achievements.
12. Create a Blog or LFG post.
13. Show the backend controllers and endpoints.
Project status

The project is functional and includes frontend, backend, database and external API integration.


Then save it and run:

```bash
git status
git add README.md
git commit -m "Update README with project details"
git push