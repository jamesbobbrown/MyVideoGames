namespace WebApi.DTOs;

public class MensajeDTO
{
    public int? Id { get; set; }

    public int? SenderId { get; set; }

    public int? ReceiverId { get; set; }

    public string? Contenido { get; set; }

    public DateTime? FechaEnvio { get; set; }

    public bool? Leido { get; set; }

    public string? SenderUsername { get; set; }

    public string? ReceiverUsername { get; set; }

    public int? OtherUserId { get; set; }

    public string? OtherUsername { get; set; }

    public string? LastMessage { get; set; }

    public int UnreadCount { get; set; }
}