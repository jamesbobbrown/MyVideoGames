using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.DTOs;

namespace WebApi.Controllers;

[ApiController]
[Route("[controller]")]
public class PostController : ControllerBase
{
    private readonly AppDbContext _context;

    public PostController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("getList")]
    public async Task<IActionResult> GetList([FromQuery] string? tipo = null)
    {
        var query =
            from post in _context.TA_POST
            join usuario in _context.TA_USUARIO
                on post.USUARIO_ID equals usuario.ID
            join juego in _context.TA_VIDEOJUEGO
                on post.VIDEOJUEGO_ID equals juego.ID into juegosJoin
            from juego in juegosJoin.DefaultIfEmpty()
            select new PostDTO
            {
                Id = post.ID,
                UsuarioId = post.USUARIO_ID,
                VideojuegoId = post.VIDEOJUEGO_ID,
                Tipo = post.TIPO,
                Titulo = post.TITULO,
                Contenido = post.CONTENIDO,
                FechaPublicacion = post.FECHA_PUBLICACION,
                Username = usuario.USERNAME,
                VideojuegoTitulo = juego != null ? juego.TITULO : null,
                ImagenUrl = juego != null ? juego.IMAGEN_URL : null
            };

        if (!string.IsNullOrWhiteSpace(tipo))
        {
            query = query.Where(x => x.Tipo == tipo);
        }

        var posts = await query
            .OrderByDescending(x => x.FechaPublicacion)
            .ToListAsync();

        return Ok(posts);
    }

    [HttpGet("getByUser")]
    public async Task<IActionResult> GetByUser([FromQuery] int usuarioId)
    {
        var posts = await (
            from post in _context.TA_POST
            join usuario in _context.TA_USUARIO
                on post.USUARIO_ID equals usuario.ID
            join juego in _context.TA_VIDEOJUEGO
                on post.VIDEOJUEGO_ID equals juego.ID into juegosJoin
            from juego in juegosJoin.DefaultIfEmpty()
            where post.USUARIO_ID == usuarioId
            orderby post.FECHA_PUBLICACION descending
            select new PostDTO
            {
                Id = post.ID,
                UsuarioId = post.USUARIO_ID,
                VideojuegoId = post.VIDEOJUEGO_ID,
                Tipo = post.TIPO,
                Titulo = post.TITULO,
                Contenido = post.CONTENIDO,
                FechaPublicacion = post.FECHA_PUBLICACION,
                Username = usuario.USERNAME,
                VideojuegoTitulo = juego != null ? juego.TITULO : null,
                ImagenUrl = juego != null ? juego.IMAGEN_URL : null
            }
        ).ToListAsync();

        return Ok(posts);
    }

    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] RequestDTO<PostDTO> req)
    {
        if (req.Data == null)
        {
            return BadRequest("No post data received.");
        }

        if (req.Data.UsuarioId == null)
        {
            return BadRequest("UsuarioId is required.");
        }

        if (string.IsNullOrWhiteSpace(req.Data.Tipo))
        {
            return BadRequest("Post type is required.");
        }

        if (string.IsNullOrWhiteSpace(req.Data.Titulo))
        {
            return BadRequest("Title is required.");
        }

        if (string.IsNullOrWhiteSpace(req.Data.Contenido))
        {
            return BadRequest("Content is required.");
        }

        var usuario = await _context.TA_USUARIO.FindAsync(req.Data.UsuarioId.Value);

        if (usuario == null)
        {
            return NotFound("User not found.");
        }

        if (req.Data.VideojuegoId != null)
        {
            var juego = await _context.TA_VIDEOJUEGO.FindAsync(req.Data.VideojuegoId.Value);

            if (juego == null)
            {
                return NotFound("Linked game not found.");
            }
        }

        TA_POST nuevoPost = new()
        {
            USUARIO_ID = req.Data.UsuarioId.Value,
            VIDEOJUEGO_ID = req.Data.VideojuegoId,
            TIPO = req.Data.Tipo,
            TITULO = req.Data.Titulo,
            CONTENIDO = req.Data.Contenido,
            FECHA_PUBLICACION = DateTime.Now
        };

        _context.TA_POST.Add(nuevoPost);
        await _context.SaveChangesAsync();

        return Ok(new PostDTO
        {
            Id = nuevoPost.ID,
            UsuarioId = nuevoPost.USUARIO_ID,
            VideojuegoId = nuevoPost.VIDEOJUEGO_ID,
            Tipo = nuevoPost.TIPO,
            Titulo = nuevoPost.TITULO,
            Contenido = nuevoPost.CONTENIDO,
            FechaPublicacion = nuevoPost.FECHA_PUBLICACION,
            Username = usuario.USERNAME
        });
    }

    [HttpDelete("delete")]
    public async Task<IActionResult> Delete([FromQuery] int id, [FromQuery] int usuarioId)
    {
        var post = await _context.TA_POST.FindAsync(id);

        if (post == null)
        {
            return NotFound("Post not found.");
        }

        if (post.USUARIO_ID != usuarioId)
        {
            return Unauthorized("You can only delete your own posts.");
        }

        _context.TA_POST.Remove(post);
        await _context.SaveChangesAsync();

        return Ok("Post deleted successfully.");
    }
}