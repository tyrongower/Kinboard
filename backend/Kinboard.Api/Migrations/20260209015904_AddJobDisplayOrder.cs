using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kinboard.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddJobDisplayOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "Jobs",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_DisplayOrder",
                table: "Jobs",
                column: "DisplayOrder");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Jobs_DisplayOrder",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "Jobs");
        }
    }
}
