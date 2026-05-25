using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kinboard.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSchoolStartTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SchoolStartTime",
                table: "SiteSettings",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SchoolStartTime",
                table: "SiteSettings");
        }
    }
}
