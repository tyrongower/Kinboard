using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kinboard.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHideFromKiosk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HideFromKiosk",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HideFromKiosk",
                table: "Users");
        }
    }
}
