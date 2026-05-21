using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.DTOs;

namespace WebApi.Controllers;

[ApiController]
[Route("[controller]")]
public class MensajeController : ControllerBase
{
    private readonly AppDbContext _context;

    public MensajeController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("inbox")]
    public async Task<IActionResult> Inbox([FromQuery] int usuarioId)
    {
        var usuario = await _context.TA_USUARIO.FindAsync(usuarioId);

        if (usuario == null)
        {
            return NotFound("User not found.");
        }

        var mensajes = await _context.TA_MENSAJE
            .Where(m => m.SENDER_ID == usuarioId || m.RECEIVER_ID == usuarioId)
            .OrderByDescending(m => m.FECHA_ENVIO)
            .ToListAsync();

        var conversations = mensajes
            .GroupBy(m => m.SENDER_ID == usuarioId ? m.RECEIVER_ID : m.SENDER_ID)
            .Select(g =>
            {
                var last = g.OrderByDescending(m => m.FECHA_ENVIO).First();
                int otherUserId = g.Key;

                var otherUser = _context.TA_USUARIO.FirstOrDefault(u => u.ID == otherUserId);

                return new MensajeDTO
                {
                    OtherUserId = otherUserId,
                    OtherUsername = otherUser != null ? otherUser.USERNAME : "Unknown user",
                    LastMessage = last.CONTENIDO,
                    FechaEnvio = last.FECHA_ENVIO,
                    UnreadCount = g.Count(m => m.RECEIVER_ID == usuarioId && !m.LEIDO)
                };
            })
            .OrderByDescending(x => x.FechaEnvio)
            .ToList();

        return Ok(conversations);
    }

    [HttpGet("conversation")]
    public async Task<IActionResult> Conversation([FromQuery] int userId, [FromQuery] int otherUserId)
    {
        var user = await _context.TA_USUARIO.FindAsync(userId);
        var otherUser = await _context.TA_USUARIO.FindAsync(otherUserId);

        if (user == null || otherUser == null)
        {
            return NotFound("User not found.");
        }

        var mensajes = await _context.TA_MENSAJE
            .Where(m =>
                (m.SENDER_ID == userId && m.RECEIVER_ID == otherUserId) ||
                (m.SENDER_ID == otherUserId && m.RECEIVER_ID == userId)
            )
            .OrderBy(m => m.FECHA_ENVIO)
            .Select(m => new MensajeDTO
            {
                Id = m.ID,
                SenderId = m.SENDER_ID,
                ReceiverId = m.RECEIVER_ID,
                Contenido = m.CONTENIDO,
                FechaEnvio = m.FECHA_ENVIO,
                Leido = m.LEIDO,
                SenderUsername = m.SENDER_ID == userId ? user.USERNAME : otherUser.USERNAME,
                ReceiverUsername = m.RECEIVER_ID == userId ? user.USERNAME : otherUser.USERNAME
            })
            .ToListAsync();

        var unreadMessages = await _context.TA_MENSAJE
            .Where(m =>
                m.SENDER_ID == otherUserId &&
                m.RECEIVER_ID == userId &&
                !m.LEIDO
            )
            .ToListAsync();

        foreach (var message in unreadMessages)
        {
            message.LEIDO = true;
        }

        await _context.SaveChangesAsync();

        return Ok(mensajes);
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send([FromBody] RequestDTO<MensajeDTO> req)
    {
        if (req.Data == null)
        {
            return BadRequest("No message data received.");
        }

        if (req.Data.SenderId == null || req.Data.ReceiverId == null)
        {
            return BadRequest("Sender and receiver are required.");
        }

        if (req.Data.SenderId == req.Data.ReceiverId)
        {
            return BadRequest("You cannot send a message to yourself.");
        }

        if (string.IsNullOrWhiteSpace(req.Data.Contenido))
        {
            return BadRequest("Message content is required.");
        }

        var sender = await _context.TA_USUARIO.FindAsync(req.Data.SenderId.Value);
        var receiver = await _context.TA_USUARIO.FindAsync(req.Data.ReceiverId.Value);

        if (sender == null || receiver == null)
        {
            return NotFound("User not found.");
        }

        TA_MENSAJE mensaje = new()
        {
            SENDER_ID = req.Data.SenderId.Value,
            RECEIVER_ID = req.Data.ReceiverId.Value,
            CONTENIDO = req.Data.Contenido,
            FECHA_ENVIO = DateTime.Now,
            LEIDO = false
        };

        _context.TA_MENSAJE.Add(mensaje);
        await _context.SaveChangesAsync();

        return Ok(new MensajeDTO
        {
            Id = mensaje.ID,
            SenderId = mensaje.SENDER_ID,
            ReceiverId = mensaje.RECEIVER_ID,
            Contenido = mensaje.CONTENIDO,
            FechaEnvio = mensaje.FECHA_ENVIO,
            Leido = mensaje.LEIDO,
            SenderUsername = sender.USERNAME,
            ReceiverUsername = receiver.USERNAME
        });
    }
}