using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApi.Migrations
{
    /// <inheritdoc />
    public partial class InicializarBaseDeDatos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TA_LISTA_USUARIO",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    USUARIO_ID = table.Column<int>(type: "INTEGER", nullable: false),
                    VIDEOJUEGO_ID = table.Column<int>(type: "INTEGER", nullable: false),
                    ESTADO = table.Column<string>(type: "TEXT", nullable: false),
                    PUNTUACION = table.Column<int>(type: "INTEGER", nullable: true),
                    FECHA_AGREGADO = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TA_LISTA_USUARIO", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "TA_USUARIO",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    USERNAME = table.Column<string>(type: "TEXT", nullable: false),
                    EMAIL = table.Column<string>(type: "TEXT", nullable: false),
                    PASSWORD = table.Column<string>(type: "TEXT", nullable: false),
                    FECHA_REGISTRO = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TA_USUARIO", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "TA_VIDEOJUEGO",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TITULO = table.Column<string>(type: "TEXT", nullable: false),
                    GENERO = table.Column<string>(type: "TEXT", nullable: false),
                    PLATAFORMA = table.Column<string>(type: "TEXT", nullable: false),
                    FECHA_LANZAMIENTO = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IMAGEN_URL = table.Column<string>(type: "TEXT", nullable: false),
                    RAWG_ID = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TA_VIDEOJUEGO", x => x.ID);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TA_LISTA_USUARIO");

            migrationBuilder.DropTable(
                name: "TA_USUARIO");

            migrationBuilder.DropTable(
                name: "TA_VIDEOJUEGO");
        }
    }
}
