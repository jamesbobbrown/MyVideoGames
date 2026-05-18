namespace WebApi.Data;

public class TA_POST
{
    public int ID { get; set; }

    public int USUARIO_ID { get; set; }

    public int? VIDEOJUEGO_ID { get; set; }

    public string TIPO { get; set; } = string.Empty;

    public string TITULO { get; set; } = string.Empty;

    public string CONTENIDO { get; set; } = string.Empty;

    public DateTime FECHA_PUBLICACION { get; set; }
}