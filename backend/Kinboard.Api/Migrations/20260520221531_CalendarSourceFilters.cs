using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kinboard.Api.Migrations
{
    /// <inheritdoc />
    public partial class CalendarSourceFilters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CategoryExcludes",
                table: "CalendarSources",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CategoryIncludes",
                table: "CalendarSources",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TitleExcludes",
                table: "CalendarSources",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TitleIncludes",
                table: "CalendarSources",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryExcludes",
                table: "CalendarSources");

            migrationBuilder.DropColumn(
                name: "CategoryIncludes",
                table: "CalendarSources");

            migrationBuilder.DropColumn(
                name: "TitleExcludes",
                table: "CalendarSources");

            migrationBuilder.DropColumn(
                name: "TitleIncludes",
                table: "CalendarSources");
        }
    }
}
