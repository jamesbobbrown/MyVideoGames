namespace WebApi.DTOs;

public class VideojuegoDTO : BasicDTO
{
    public string Titulo { get; set; } = string.Empty;
    public string? Genero { get; set; }
    public string? Plataforma { get; set; }
    public DateTime? FechaLanzamiento { get; set; }
    public string? ImagenUrl { get; set; }
    public int? RawgId { get; set; }
}