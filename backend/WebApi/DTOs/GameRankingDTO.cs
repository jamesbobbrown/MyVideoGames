namespace WebApi.DTOs;

public class GameRankingDTO
{
    public int VideojuegoId { get; set; }

    public int? RawgId { get; set; }

    public string Titulo { get; set; } = string.Empty;

    public string Genero { get; set; } = string.Empty;

    public string Plataforma { get; set; } = string.Empty;

    public string ImagenUrl { get; set; } = string.Empty;

    public double AverageRating { get; set; }

    public int RatingCount { get; set; }

    public int ReviewCount { get; set; }
}