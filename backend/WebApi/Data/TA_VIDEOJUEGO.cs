namespace WebApi.Data;

public class TA_VIDEOJUEGO
{
    public int ID { get; set; }
    public string TITULO { get; set; } = string.Empty;
    public string GENERO { get; set; } = string.Empty;
    public string PLATAFORMA { get; set; } = string.Empty;
    public DateTime? FECHA_LANZAMIENTO { get; set; }
    public string IMAGEN_URL { get; set; } = string.Empty;
    public int? RAWG_ID { get; set; }
}