namespace WebApi.DTOs;

public class ListaUsuarioDTO
{
    public int? Id { get; set; }

    public int? UsuarioId { get; set; }

    public int? VideojuegoId { get; set; }

    public string? Estado { get; set; }

    public int? Puntuacion { get; set; }
}