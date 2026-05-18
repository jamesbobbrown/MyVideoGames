using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.DTOs;
using System.Text.Json;

namespace WebApi.Controllers;

[ApiController]
[Route("[controller]")]
public class VideojuegoController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public VideojuegoController(
        AppDbContext context,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] RequestDTO<VideojuegoDTO> req)
    {
        if (req.Data == null)
        {
            return BadRequest("No game data received.");
        }

        if (string.IsNullOrWhiteSpace(req.Data.Titulo))
        {
            return BadRequest("Title is required.");
        }

        if (req.Data.RawgId != null)
        {
            var existingGame = await _context.TA_VIDEOJUEGO
                .FirstOrDefaultAsync(v => v.RAWG_ID == req.Data.RawgId.Value);

            if (existingGame != null)
            {
                return Ok(new VideojuegoDTO
                {
                    Id = existingGame.ID,
                    Titulo = existingGame.TITULO,
                    Genero = existingGame.GENERO,
                    Plataforma = existingGame.PLATAFORMA,
                    FechaLanzamiento = existingGame.FECHA_LANZAMIENTO,
                    ImagenUrl = existingGame.IMAGEN_URL,
                    RawgId = existingGame.RAWG_ID
                });
            }
        }

        TA_VIDEOJUEGO nuevoJuego = new()
        {
            TITULO = req.Data.Titulo,
            GENERO = req.Data.Genero ?? string.Empty,
            PLATAFORMA = req.Data.Plataforma ?? string.Empty,
            FECHA_LANZAMIENTO = req.Data.FechaLanzamiento,
            IMAGEN_URL = req.Data.ImagenUrl ?? string.Empty,
            RAWG_ID = req.Data.RawgId
        };

        _context.TA_VIDEOJUEGO.Add(nuevoJuego);
        await _context.SaveChangesAsync();

        VideojuegoDTO result = new()
        {
            Id = nuevoJuego.ID,
            Titulo = nuevoJuego.TITULO,
            Genero = nuevoJuego.GENERO,
            Plataforma = nuevoJuego.PLATAFORMA,
            FechaLanzamiento = nuevoJuego.FECHA_LANZAMIENTO,
            ImagenUrl = nuevoJuego.IMAGEN_URL,
            RawgId = nuevoJuego.RAWG_ID
        };

        return Ok(result);
    }

    [HttpGet("getList")]
    public async Task<IActionResult> GetList()
    {
        var juegos = await _context.TA_VIDEOJUEGO
            .Select(v => new VideojuegoDTO
            {
                Id = v.ID,
                Titulo = v.TITULO,
                Genero = v.GENERO,
                Plataforma = v.PLATAFORMA,
                FechaLanzamiento = v.FECHA_LANZAMIENTO,
                ImagenUrl = v.IMAGEN_URL,
                RawgId = v.RAWG_ID
            })
            .ToListAsync();

        return Ok(juegos);
    }

    [HttpGet("home")]
    public async Task<ActionResult<List<HomeVideojuegoDTO>>> GetHome([FromQuery] int? usuarioId)
    {
        var videojuegos = await _context.TA_VIDEOJUEGO
            .Take(20)
            .Select(v => new HomeVideojuegoDTO
            {
                Id = v.ID,
                Titulo = v.TITULO,
                Genero = v.GENERO,
                Plataforma = v.PLATAFORMA,
                FechaLanzamiento = v.FECHA_LANZAMIENTO,
                ImagenUrl = v.IMAGEN_URL,
                RawgId = v.RAWG_ID,

                YaAnadido = usuarioId != null &&
                    _context.TA_LISTA_USUARIO.Any(l =>
                        l.USUARIO_ID == usuarioId.Value &&
                        l.VIDEOJUEGO_ID == v.ID
                    )
            })
            .ToListAsync();

        return Ok(videojuegos);
    }

    [HttpGet("homeRawg")]
    public async Task<IActionResult> GetHomeRawg([FromQuery] int? usuarioId)
    {
        string? apiKey = _configuration["Rawg:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return StatusCode(500, "RAWG API key is not configured.");
        }

        var categories = new List<HomeCategoryDTO>
        {
            new()
            {
                Titulo = "Top rated games",
                Juegos = await GetRawgGamesForHome(
                    $"https://api.rawg.io/api/games?key={apiKey}&ordering=-rating&page_size=40",
                    usuarioId
                )
            },
            new()
            {
                Titulo = "Popular games",
                Juegos = await GetRawgGamesForHome(
                    $"https://api.rawg.io/api/games?key={apiKey}&ordering=-added&page_size=40",
                    usuarioId
                )
            },
            new()
            {
                Titulo = "New releases",
                Juegos = await GetRawgGamesForHome(
                    $"https://api.rawg.io/api/games?key={apiKey}&ordering=-released&page_size=40",
                    usuarioId
                )
            }
        };

        return Ok(categories);
    }

    [HttpDelete("delete")]
    public async Task<IActionResult> Delete([FromQuery] int id)
    {
        var juego = await _context.TA_VIDEOJUEGO.FindAsync(id);

        if (juego == null)
        {
            return NotFound("Game not found.");
        }

        _context.TA_VIDEOJUEGO.Remove(juego);
        await _context.SaveChangesAsync();

        return Ok("Game deleted successfully.");
    }

    [HttpGet("searchExternal")]
    public async Task<IActionResult> SearchExternal([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest("Query is required.");
        }

        string? apiKey = _configuration["Rawg:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return StatusCode(500, "RAWG API key is not configured.");
        }

        var client = _httpClientFactory.CreateClient();

        string url =
            $"https://api.rawg.io/api/games?key={apiKey}" +
            $"&search={Uri.EscapeDataString(query)}" +
            $"&ordering=-added" +
            $"&page_size=10";

        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
        {
            return StatusCode((int)response.StatusCode, "RAWG request failed.");
        }

        var json = await response.Content.ReadAsStringAsync();

        using var document = JsonDocument.Parse(json);

        if (!document.RootElement.TryGetProperty("results", out var results))
        {
            return Ok(new List<object>());
        }

        var cleanResults = results
            .EnumerateArray()
            .Where(x =>
                x.TryGetProperty("background_image", out var img) &&
                !string.IsNullOrWhiteSpace(img.GetString())
            )
            .Select(x => x.Clone())
            .ToList();

        return Ok(cleanResults);
    }

    [HttpGet("getExternalById")]
    public async Task<IActionResult> GetExternalById([FromQuery] int rawgId)
    {
        string? apiKey = _configuration["Rawg:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return StatusCode(500, "RAWG API key is not configured.");
        }

        var client = _httpClientFactory.CreateClient();

        string url = $"https://api.rawg.io/api/games/{rawgId}?key={apiKey}";

        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
        {
            return StatusCode((int)response.StatusCode, "RAWG request failed.");
        }

        var json = await response.Content.ReadAsStringAsync();

        return Content(json, "application/json");
    }

    private async Task<List<RawgHomeGameDTO>> GetRawgGamesForHome(string url, int? usuarioId)
    {
        var client = _httpClientFactory.CreateClient();

        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
        {
            return new List<RawgHomeGameDTO>();
        }

        var json = await response.Content.ReadAsStringAsync();

        using var document = JsonDocument.Parse(json);

        var results = document.RootElement.GetProperty("results");

        var games = new List<RawgHomeGameDTO>();
        var usedTitles = new HashSet<string>();

        foreach (var item in results.EnumerateArray())
        {
            int rawgId = item.GetProperty("id").GetInt32();

            string titulo = item.TryGetProperty("name", out var nameProp)
                ? nameProp.GetString() ?? string.Empty
                : string.Empty;

            string imagenUrl = item.TryGetProperty("background_image", out var imageProp)
                ? imageProp.GetString() ?? string.Empty
                : string.Empty;

            if (string.IsNullOrWhiteSpace(titulo) || string.IsNullOrWhiteSpace(imagenUrl))
            {
                continue;
            }

            string normalizedTitle = NormalizeGameTitle(titulo);

            if (usedTitles.Contains(normalizedTitle))
            {
                continue;
            }

            usedTitles.Add(normalizedTitle);

            double? rating = null;

            if (item.TryGetProperty("rating", out var ratingProp) &&
                ratingProp.ValueKind == JsonValueKind.Number)
            {
                rating = ratingProp.GetDouble();
            }

            string fecha = item.TryGetProperty("released", out var releasedProp)
                ? releasedProp.GetString() ?? string.Empty
                : string.Empty;

            string genero = "Unknown genre";

            if (item.TryGetProperty("genres", out var genresProp) &&
                genresProp.ValueKind == JsonValueKind.Array &&
                genresProp.GetArrayLength() > 0)
            {
                var firstGenre = genresProp[0];

                if (firstGenre.TryGetProperty("name", out var genreName))
                {
                    genero = genreName.GetString() ?? "Unknown genre";
                }
            }

            bool yaAnadido = false;

            if (usuarioId != null)
            {
                yaAnadido = await _context.TA_LISTA_USUARIO
                    .Join(
                        _context.TA_VIDEOJUEGO,
                        lista => lista.VIDEOJUEGO_ID,
                        juego => juego.ID,
                        (lista, juego) => new { lista, juego }
                    )
                    .AnyAsync(x =>
                        x.lista.USUARIO_ID == usuarioId.Value &&
                        x.juego.RAWG_ID == rawgId
                    );
            }

            games.Add(new RawgHomeGameDTO
            {
                RawgId = rawgId,
                Titulo = titulo,
                ImagenUrl = imagenUrl,
                Rating = rating,
                Genero = genero,
                FechaLanzamiento = fecha,
                YaAnadido = yaAnadido
            });

            if (games.Count >= 20)
            {
                break;
            }
        }

        return games;
    }
    private static string NormalizeGameTitle(string title)
    {
        string normalized = title.ToLowerInvariant();

        string[] removableParts =
        {
            "complete edition",
            "game of the year edition",
            "goty edition",
            "definitive edition",
            "deluxe edition",
            "ultimate edition",
            "standard edition",
            "collector's edition",
            "collectors edition",
            "remastered",
            "remaster",
            "enhanced edition",
            "anniversary edition",
            "director's cut",
            "directors cut",
            "blood and wine",
            "hearts of stone"
        };

        foreach (var part in removableParts)
        {
            normalized = normalized.Replace(part, "");
        }

        char[] separators = { ':', '–', '-', '—', '|', '(', '[', '{' };

        foreach (char separator in separators)
        {
            int index = normalized.IndexOf(separator);

            if (index > 0)
            {
                normalized = normalized[..index];
            }
        }

        normalized = new string(
            normalized
                .Where(c => char.IsLetterOrDigit(c) || char.IsWhiteSpace(c))
                .ToArray()
        );

        normalized = string.Join(
            " ",
            normalized.Split(" ", StringSplitOptions.RemoveEmptyEntries)
        );

        return normalized.Trim();
    }
    [HttpGet("categoryRawg")]
    public async Task<IActionResult> GetCategoryRawg(
        [FromQuery] string type = "popular",
        [FromQuery] int page = 1,
        [FromQuery] string? genre = null,
        [FromQuery] double? minRating = null,
        [FromQuery] string? search = null,
        [FromQuery] int? usuarioId = null)
    {
        string? apiKey = _configuration["Rawg:ApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return StatusCode(500, "RAWG API key is not configured.");
        }

        if (page <= 0)
        {
            page = 1;
        }

        string title = GetCategoryTitle(type);
        string ordering = GetCategoryOrdering(type);
        string? genreSlug = GetGenreSlug(genre);

        List<RawgHomeGameDTO> games = new();
        HashSet<string> usedTitles = new();

        /*
            RAWG can return games without images and repeated editions.
            We request more than we need and then filter clean results.
            Frontend page size target = 50.
        */
        int rawgStartPage = ((page - 1) * 2) + 1;

        for (int rawgPage = rawgStartPage; rawgPage < rawgStartPage + 4; rawgPage++)
        {
            string url = BuildRawgCategoryUrl(
                apiKey,
                ordering,
                rawgPage,
                genreSlug,
                search
            );

            List<RawgHomeGameDTO> batch = await GetRawgGamesForCategory(
                url,
                usuarioId,
                usedTitles,
                minRating
            );

            games.AddRange(batch);

            if (games.Count >= 50)
            {
                break;
            }
        }

        games = games.Take(50).ToList();

        RawgCategoryPageDTO result = new()
        {
            Titulo = title,
            Type = type,
            Page = page,
            PageSize = 50,
            HasNextPage = games.Count == 50,
            Juegos = games
        };

        return Ok(result);
    }
    private static string GetCategoryTitle(string type)
{
    return type.ToLowerInvariant() switch
    {
        "top-rated" => "Top rated games",
        "new-releases" => "New releases",
        "action" => "Action games",
        "rpg" => "RPG games",
        "indie" => "Indie games",
        "shooter" => "Shooter games",
        _ => "Popular games"
    };
}

private static string GetCategoryOrdering(string type)
{
    return type.ToLowerInvariant() switch
    {
        "top-rated" => "-rating",
        "new-releases" => "-released",
        _ => "-added"
    };
}

private static string? GetGenreSlug(string? genre)
{
    if (string.IsNullOrWhiteSpace(genre))
    {
        return null;
    }

    return genre.ToLowerInvariant() switch
    {
        "action" => "action",
        "adventure" => "adventure",
        "rpg" => "role-playing-games-rpg",
        "shooter" => "shooter",
        "indie" => "indie",
        "strategy" => "strategy",
        "sports" => "sports",
        "racing" => "racing",
        "simulation" => "simulation",
        "puzzle" => "puzzle",
        "platformer" => "platformer",
        _ => null
    };
}

private static string BuildRawgCategoryUrl(
    string apiKey,
    string ordering,
    int page,
    string? genreSlug,
    string? search)
{
    string url =
        $"https://api.rawg.io/api/games?key={apiKey}" +
        $"&ordering={ordering}" +
        $"&page_size=40" +
        $"&page={page}";

    if (!string.IsNullOrWhiteSpace(genreSlug))
    {
        url += $"&genres={genreSlug}";
    }

    if (!string.IsNullOrWhiteSpace(search))
    {
        url += $"&search={Uri.EscapeDataString(search)}";
    }

    return url;
}

private async Task<List<RawgHomeGameDTO>> GetRawgGamesForCategory(
    string url,
    int? usuarioId,
    HashSet<string> usedTitles,
    double? minRating)
{
    var client = _httpClientFactory.CreateClient();

    var response = await client.GetAsync(url);

    if (!response.IsSuccessStatusCode)
    {
        return new List<RawgHomeGameDTO>();
    }

    var json = await response.Content.ReadAsStringAsync();

    using var document = JsonDocument.Parse(json);

    if (!document.RootElement.TryGetProperty("results", out var results))
    {
        return new List<RawgHomeGameDTO>();
    }

    List<RawgHomeGameDTO> games = new();

    foreach (var item in results.EnumerateArray())
    {
        int rawgId = item.GetProperty("id").GetInt32();

        string titulo = item.TryGetProperty("name", out var nameProp)
            ? nameProp.GetString() ?? string.Empty
            : string.Empty;

        string imagenUrl = item.TryGetProperty("background_image", out var imageProp)
            ? imageProp.GetString() ?? string.Empty
            : string.Empty;

        if (string.IsNullOrWhiteSpace(titulo) || string.IsNullOrWhiteSpace(imagenUrl))
        {
            continue;
        }

        string normalizedTitle = NormalizeGameTitle(titulo);

        if (usedTitles.Contains(normalizedTitle))
        {
            continue;
        }

        double? rating = null;

        if (item.TryGetProperty("rating", out var ratingProp) &&
            ratingProp.ValueKind == JsonValueKind.Number)
        {
            rating = ratingProp.GetDouble();
        }

        if (minRating != null && rating != null && rating < minRating.Value)
        {
            continue;
        }

        usedTitles.Add(normalizedTitle);

        string fecha = item.TryGetProperty("released", out var releasedProp)
            ? releasedProp.GetString() ?? string.Empty
            : string.Empty;

        string genero = "Unknown genre";

        if (item.TryGetProperty("genres", out var genresProp) &&
            genresProp.ValueKind == JsonValueKind.Array &&
            genresProp.GetArrayLength() > 0)
        {
            var firstGenre = genresProp[0];

            if (firstGenre.TryGetProperty("name", out var genreName))
            {
                genero = genreName.GetString() ?? "Unknown genre";
            }
        }

        bool yaAnadido = false;

        if (usuarioId != null)
        {
            yaAnadido = await _context.TA_LISTA_USUARIO
                .Join(
                    _context.TA_VIDEOJUEGO,
                    lista => lista.VIDEOJUEGO_ID,
                    juego => juego.ID,
                    (lista, juego) => new { lista, juego }
                )
                .AnyAsync(x =>
                    x.lista.USUARIO_ID == usuarioId.Value &&
                    x.juego.RAWG_ID == rawgId
                );
        }

        games.Add(new RawgHomeGameDTO
        {
            RawgId = rawgId,
            Titulo = titulo,
            ImagenUrl = imagenUrl,
            Rating = rating,
            Genero = genero,
            FechaLanzamiento = fecha,
            YaAnadido = yaAnadido
        });
    }

    return games;
}
}