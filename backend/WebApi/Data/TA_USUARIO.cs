namespace WebApi.Data;

public class TA_USUARIO
{
    public int ID { get; set; }
    public string USERNAME { get; set; } = string.Empty;
    public string EMAIL { get; set; } = string.Empty;
    public string PASSWORD { get; set; } = string.Empty;
    public DateTime FECHA_REGISTRO { get; set; }
}