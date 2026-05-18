namespace WebApi.DTOs;

public class PostDTO
{
    public int? Id { get; set; }

    public int? UsuarioId { get; set; }

    public int? VideojuegoId { get; set; }

    public string? Tipo { get; set; }

    public string? Titulo { get; set; }

    public string? Contenido { get; set; }

    public DateTime? FechaPublicacion { get; set; }

    public string? Username { get; set; }

    public string? VideojuegoTitulo { get; set; }

    public string? ImagenUrl { get; set; }
}