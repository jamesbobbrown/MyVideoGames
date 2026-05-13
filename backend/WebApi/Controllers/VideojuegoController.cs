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
                    $"https://api.rawg.io/api/games?key={apiKey}&ordering=-rating&page_size=5",
                    usuarioId
                )
            },
            new()
            {
                Titulo = "Popular games",
                Juegos = await GetRawgGamesForHome(
                    $"https://api.rawg.io/api/games?key={apiKey}&ordering=-added&page_size=5",
                    usuarioId
                )
            },
            new()
            {
                Titulo = "New releases",
                Juegos = await GetRawgGamesForHome(
                    $"https://api.rawg.io/api/games?key={apiKey}&ordering=-released&page_size=5",
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

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var rawgResponse = JsonSerializer.Deserialize<RawgListResponseDTO>(json, options);

        if (rawgResponse == null)
        {
            return Ok(new List<RawgGameDTO>());
        }

        return Ok(rawgResponse.results);
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

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var game = JsonSerializer.Deserialize<RawgGameDetailDTO>(json, options);

        if (game == null)
        {
            return NotFound("Game not found in RAWG.");
        }

        return Ok(game);
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

        foreach (var item in results.EnumerateArray())
        {
            int rawgId = item.GetProperty("id").GetInt32();

            string titulo = item.TryGetProperty("name", out var nameProp)
                ? nameProp.GetString() ?? string.Empty
                : string.Empty;

            string imagenUrl = item.TryGetProperty("background_image", out var imageProp)
                ? imageProp.GetString() ?? string.Empty
                : string.Empty;

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
        }

        return games;
    }
}