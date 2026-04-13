using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.DTOs;

namespace WebApi.Controllers;

[ApiController]
[Route("[controller]")]
public class UsuarioController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsuarioController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RequestDTO<UsuarioDTO> req)
    {
        if (req.Data == null)
            return BadRequest("No user data received.");

        if (string.IsNullOrWhiteSpace(req.Data.Username) ||
            string.IsNullOrWhiteSpace(req.Data.Email) ||
            string.IsNullOrWhiteSpace(req.Data.Password))
        {
            return BadRequest("Username, email and password are required.");
        }

        bool exists = await _context.TA_USUARIO.AnyAsync(u =>
            u.USERNAME == req.Data.Username || u.EMAIL == req.Data.Email);

        if (exists)
            return BadRequest("Username or email already exists.");

        TA_USUARIO nuevoUsuario = new()
        {
            USERNAME = req.Data.Username,
            EMAIL = req.Data.Email,
            PASSWORD = req.Data.Password,
            FECHA_REGISTRO = DateTime.Now
        };

        _context.TA_USUARIO.Add(nuevoUsuario);
        await _context.SaveChangesAsync();

        UsuarioDTO result = new()
        {
            Id = nuevoUsuario.ID,
            Username = nuevoUsuario.USERNAME,
            Email = nuevoUsuario.EMAIL
        };

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] RequestDTO<UsuarioDTO> req)
    {
        if (req.Data == null)
            return BadRequest("No login data received.");

        TA_USUARIO? user = await _context.TA_USUARIO.FirstOrDefaultAsync(u =>
            u.USERNAME == req.Data.Username &&
            u.PASSWORD == req.Data.Password);

        if (user == null)
            return Unauthorized("Invalid username or password.");

        UsuarioDTO result = new()
        {
            Id = user.ID,
            Username = user.USERNAME,
            Email = user.EMAIL
        };

        return Ok(result);
    }

    [HttpGet("getList")]
    public async Task<IActionResult> GetList()
    {
        var usuarios = await _context.TA_USUARIO
            .Select(u => new UsuarioDTO
            {
                Id = u.ID,
                Username = u.USERNAME,
                Email = u.EMAIL
            })
            .ToListAsync();

        return Ok(usuarios);
    }
}