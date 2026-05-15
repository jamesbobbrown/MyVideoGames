namespace WebApi.DTOs;

public class RawgCategoryPageDTO
{
    public string Titulo { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public int Page { get; set; }

    public int PageSize { get; set; }

    public bool HasNextPage { get; set; }

    public List<RawgHomeGameDTO> Juegos { get; set; } = new();
}