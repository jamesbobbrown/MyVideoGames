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
    public async Task<ActionResult<UsuarioDTO>> Register([FromBody] UsuarioDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest("Username, email and password are required.");
        }

        bool emailExists = await _context.TA_USUARIO
            .AnyAsync(u => u.EMAIL == dto.Email);

        if (emailExists)
        {
            return BadRequest("This email is already registered.");
        }

        var usuario = new TA_USUARIO
        {
            USERNAME = dto.Username,
            EMAIL = dto.Email,
            PASSWORD = dto.Password,
            FECHA_REGISTRO = DateTime.Now
        };

        _context.TA_USUARIO.Add(usuario);
        await _context.SaveChangesAsync();

        return Ok(new UsuarioDTO
        {
            Id = usuario.ID,
            Username = usuario.USERNAME,
            Email = usuario.EMAIL
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<UsuarioDTO>> Login([FromBody] UsuarioDTO dto)
    {
        if ((string.IsNullOrWhiteSpace(dto.Email) && string.IsNullOrWhiteSpace(dto.Username)) ||
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest("Username/email and password are required.");
        }

        string loginValue = !string.IsNullOrWhiteSpace(dto.Email)
            ? dto.Email
            : dto.Username!;

        var usuario = await _context.TA_USUARIO
            .Where(u =>
                (u.EMAIL == loginValue || u.USERNAME == loginValue) &&
                u.PASSWORD == dto.Password
            )
            .Select(u => new UsuarioDTO
            {
                Id = u.ID,
                Username = u.USERNAME,
                Email = u.EMAIL
            })
            .FirstOrDefaultAsync();

        if (usuario == null)
        {
            return Unauthorized("Invalid username/email or password.");
        }

        return Ok(usuario);
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
    [HttpPut("update")]
public async Task<ActionResult<UsuarioDTO>> Update([FromBody] UsuarioDTO dto)
{
    if (dto.Id == null)
    {
        return BadRequest("User ID is required.");
    }

    var usuario = await _context.TA_USUARIO.FindAsync(dto.Id.Value);

    if (usuario == null)
    {
        return NotFound("User not found.");
    }

    if (string.IsNullOrWhiteSpace(dto.Username))
    {
        return BadRequest("Username is required.");
    }

    if (string.IsNullOrWhiteSpace(dto.Email))
    {
        return BadRequest("Email is required.");
    }

    bool usernameExists = await _context.TA_USUARIO
        .AnyAsync(u => u.USERNAME == dto.Username && u.ID != dto.Id.Value);

    if (usernameExists)
    {
        return BadRequest("This username is already taken.");
    }

    bool emailExists = await _context.TA_USUARIO
        .AnyAsync(u => u.EMAIL == dto.Email && u.ID != dto.Id.Value);

    if (emailExists)
    {
        return BadRequest("This email is already registered.");
    }

    usuario.USERNAME = dto.Username;
    usuario.EMAIL = dto.Email;

    if (!string.IsNullOrWhiteSpace(dto.Password))
    {
        usuario.PASSWORD = dto.Password;
    }

    await _context.SaveChangesAsync();

    return Ok(new UsuarioDTO
    {
        Id = usuario.ID,
        Username = usuario.USERNAME,
        Email = usuario.EMAIL
    });
}
}