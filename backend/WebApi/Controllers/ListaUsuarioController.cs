using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.DTOs;

namespace WebApi.Controllers;

[ApiController]
[Route("[controller]")]
public class ListaUsuarioController : ControllerBase
{
    private readonly AppDbContext _context;

    public ListaUsuarioController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] RequestDTO<ListaUsuarioDTO> req)
    {
        if (req.Data == null)
            return BadRequest("No list data received.");

        if (req.Data.UsuarioId == null || req.Data.VideojuegoId == null)
            return BadRequest("UsuarioId and VideojuegoId are required.");

        if (string.IsNullOrWhiteSpace(req.Data.Estado))
            return BadRequest("Estado is required.");

        var usuario = await _context.TA_USUARIO.FindAsync(req.Data.UsuarioId);
        if (usuario == null)
            return NotFound("User not found.");

        var videojuego = await _context.TA_VIDEOJUEGO.FindAsync(req.Data.VideojuegoId);
        if (videojuego == null)
            return NotFound("Game not found.");

        var existing = await _context.TA_LISTA_USUARIO.FirstOrDefaultAsync(x =>
            x.USUARIO_ID == req.Data.UsuarioId &&
            x.VIDEOJUEGO_ID == req.Data.VideojuegoId &&
            x.ESTADO == req.Data.Estado);

        if (existing != null)
            return BadRequest("This game already exists in that user list with the same status.");

        TA_LISTA_USUARIO nuevaEntrada = new()
        {
            USUARIO_ID = req.Data.UsuarioId.Value,
            VIDEOJUEGO_ID = req.Data.VideojuegoId.Value,
            ESTADO = req.Data.Estado,
            PUNTUACION = req.Data.Puntuacion,
            FECHA_AGREGADO = DateTime.Now
        };

        _context.TA_LISTA_USUARIO.Add(nuevaEntrada);
        await _context.SaveChangesAsync();

        ListaUsuarioDTO result = new()
        {
            Id = nuevaEntrada.ID,
            UsuarioId = nuevaEntrada.USUARIO_ID,
            VideojuegoId = nuevaEntrada.VIDEOJUEGO_ID,
            Estado = nuevaEntrada.ESTADO,
            Puntuacion = nuevaEntrada.PUNTUACION
        };

        return Ok(result);
    }

    [HttpGet("getByUser")]
    public async Task<IActionResult> GetByUser([FromQuery] int usuarioId)
    {
        var usuario = await _context.TA_USUARIO.FindAsync(usuarioId);
        if (usuario == null)
            return NotFound("User not found.");

        var lista = await _context.TA_LISTA_USUARIO
            .Where(x => x.USUARIO_ID == usuarioId)
            .Join(
                _context.TA_VIDEOJUEGO,
                listaItem => listaItem.VIDEOJUEGO_ID,
                juego => juego.ID,
                (listaItem, juego) => new
                {
                    id = listaItem.ID,
                    usuarioId = listaItem.USUARIO_ID,
                    videojuegoId = juego.ID,
                    titulo = juego.TITULO,
                    genero = juego.GENERO,
                    plataforma = juego.PLATAFORMA,
                    estado = listaItem.ESTADO,
                    puntuacion = listaItem.PUNTUACION,
                    fechaAgregado = listaItem.FECHA_AGREGADO
                }
            )
            .ToListAsync();

        return Ok(lista);
    }

    [HttpDelete("delete")]
    public async Task<IActionResult> Delete([FromQuery] int id)
    {
        var item = await _context.TA_LISTA_USUARIO.FindAsync(id);

        if (item == null)
            return NotFound("List item not found.");

        _context.TA_LISTA_USUARIO.Remove(item);
        await _context.SaveChangesAsync();

        return Ok("List item deleted successfully.");
    }
}