namespace WebApi.Data;

public class TA_LISTA_USUARIO
{
    public int ID { get; set; }

    public int USUARIO_ID { get; set; }

    public int VIDEOJUEGO_ID { get; set; }

    public string ESTADO { get; set; } = string.Empty;

    public int? PUNTUACION { get; set; }

    public string? REVIEW { get; set; }

    public DateTime FECHA_AGREGADO { get; set; }
}