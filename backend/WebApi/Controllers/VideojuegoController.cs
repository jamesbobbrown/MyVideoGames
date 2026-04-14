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
            return BadRequest("No game data received.");

        if (string.IsNullOrWhiteSpace(req.Data.Titulo))
            return BadRequest("Title is required.");

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

    [HttpDelete("delete")]
    public async Task<IActionResult> Delete([FromQuery] int id)
    {
        var juego = await _context.TA_VIDEOJUEGO.FindAsync(id);

        if (juego == null)
            return NotFound("Game not found.");

        _context.TA_VIDEOJUEGO.Remove(juego);
        await _context.SaveChangesAsync();

        return Ok("Game deleted successfully.");
    }
    [HttpGet("searchExternal")]
    public async Task<IActionResult> SearchExternal([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest("Query is required.");

        string? apiKey = _configuration["Rawg:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return StatusCode(500, "RAWG API key is not configured.");

        var client = _httpClientFactory.CreateClient();

        string url =
            $"https://api.rawg.io/api/games?key={apiKey}&search={Uri.EscapeDataString(query)}&search_precise=true&page_size=10";

        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, "RAWG request failed.");

        var json = await response.Content.ReadAsStringAsync();

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var rawgResponse = JsonSerializer.Deserialize<RawgListResponseDTO>(json, options);

        if (rawgResponse == null)
            return Ok(new List<RawgGameDTO>());

        return Ok(rawgResponse.results);
    }
    [HttpGet("getExternalById")]
    public async Task<IActionResult> GetExternalById([FromQuery] int rawgId)
    {
        string? apiKey = _configuration["Rawg:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return StatusCode(500, "RAWG API key is not configured.");

        var client = _httpClientFactory.CreateClient();

        string url = $"https://api.rawg.io/api/games/{rawgId}?key={apiKey}";

        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, "RAWG request failed.");

        var json = await response.Content.ReadAsStringAsync();

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var game = JsonSerializer.Deserialize<RawgGameDetailDTO>(json, options);

        if (game == null)
            return NotFound("Game not found in RAWG.");

        return Ok(game);
    }
}