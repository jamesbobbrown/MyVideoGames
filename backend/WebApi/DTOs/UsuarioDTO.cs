namespace WebApi.DTOs;

public class UsuarioDTO : BasicDTO
{
    public string Username { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Password { get; set; }
}