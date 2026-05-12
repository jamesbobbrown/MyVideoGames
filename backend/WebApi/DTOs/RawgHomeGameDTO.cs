namespace WebApi.DTOs;

public class RawgHomeGameDTO
{
    public int RawgId { get; set; }

    public string Titulo { get; set; } = string.Empty;

    public string ImagenUrl { get; set; } = string.Empty;

    public double? Rating { get; set; }

    public string Genero { get; set; } = string.Empty;

    public string FechaLanzamiento { get; set; } = string.Empty;

    public bool YaAnadido { get; set; }
}