namespace WebApi.DTOs;

public class RawgGameDTO
{
    public int id { get; set; }
    public string name { get; set; } = string.Empty;
    public string? released { get; set; }
    public string? background_image { get; set; }
    public double? rating { get; set; }
}