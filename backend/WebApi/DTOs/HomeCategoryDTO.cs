namespace WebApi.DTOs;

public class HomeCategoryDTO
{
    public string Titulo { get; set; } = string.Empty;

    public List<RawgHomeGameDTO> Juegos { get; set; } = new();
}