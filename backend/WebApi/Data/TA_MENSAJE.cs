namespace WebApi.Data;

public class TA_MENSAJE
{
    public int ID { get; set; }

    public int SENDER_ID { get; set; }

    public int RECEIVER_ID { get; set; }

    public string CONTENIDO { get; set; } = string.Empty;

    public DateTime FECHA_ENVIO { get; set; }

    public bool LEIDO { get; set; }
}