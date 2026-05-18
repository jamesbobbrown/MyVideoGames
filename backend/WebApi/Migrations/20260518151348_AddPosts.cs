using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPosts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TA_POST",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    USUARIO_ID = table.Column<int>(type: "INTEGER", nullable: false),
                    VIDEOJUEGO_ID = table.Column<int>(type: "INTEGER", nullable: true),
                    TIPO = table.Column<string>(type: "TEXT", nullable: false),
                    TITULO = table.Column<string>(type: "TEXT", nullable: false),
                    CONTENIDO = table.Column<string>(type: "TEXT", nullable: false),
                    FECHA_PUBLICACION = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TA_POST", x => x.ID);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TA_POST");
        }
    }
}
