using Microsoft.EntityFrameworkCore;

namespace WebApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<TA_USUARIO> TA_USUARIO { get; set; }

    public DbSet<TA_VIDEOJUEGO> TA_VIDEOJUEGO { get; set; }

    public DbSet<TA_LISTA_USUARIO> TA_LISTA_USUARIO { get; set; }

    public DbSet<TA_POST> TA_POST { get; set; }
}