using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TA_MENSAJE",
                columns: table => new
                {
                    ID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SENDER_ID = table.Column<int>(type: "INTEGER", nullable: false),
                    RECEIVER_ID = table.Column<int>(type: "INTEGER", nullable: false),
                    CONTENIDO = table.Column<string>(type: "TEXT", nullable: false),
                    FECHA_ENVIO = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LEIDO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TA_MENSAJE", x => x.ID);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TA_MENSAJE");
        }
    }
}
