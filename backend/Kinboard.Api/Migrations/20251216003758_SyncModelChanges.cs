using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kinboard.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CalendarSources",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    IcalUrl = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    ColorHex = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    Enabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarSources", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Jobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Recurrence = table.Column<string>(type: "TEXT", nullable: true),
                    RecurrenceStartDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RecurrenceEndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RecurrenceIndefinite = table.Column<bool>(type: "INTEGER", nullable: false),
                    UseSharedRecurrence = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Jobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SiteSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DefaultView = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false, defaultValue: "Day"),
                    CompletionMode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "Today"),
                    ChoresRefreshSeconds = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 10),
                    CalendarRefreshSeconds = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 30),
                    WeatherRefreshSeconds = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1800),
                    WeatherApiKey = table.Column<string>(type: "TEXT", nullable: true),
                    WeatherLocation = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Username = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    ColorHex = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    HideCompletedInKiosk = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    AvatarUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JobAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    JobId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Recurrence = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    RecurrenceStartDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RecurrenceEndDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RecurrenceIndefinite = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobAssignments_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JobAssignments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JobCompletions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    JobId = table.Column<int>(type: "INTEGER", nullable: false),
                    OccurrenceDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CompletedByUserId = table.Column<int>(type: "INTEGER", nullable: true),
                    JobAssignmentId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobCompletions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobCompletions_JobAssignments_JobAssignmentId",
                        column: x => x.JobAssignmentId,
                        principalTable: "JobAssignments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_JobCompletions_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JobCompletions_Users_CompletedByUserId",
                        column: x => x.CompletedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarSources_DisplayOrder",
                table: "CalendarSources",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_JobAssignments_DisplayOrder",
                table: "JobAssignments",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_JobAssignments_JobId_UserId",
                table: "JobAssignments",
                columns: new[] { "JobId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobAssignments_UserId",
                table: "JobAssignments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_JobCompletions_CompletedByUserId",
                table: "JobCompletions",
                column: "CompletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_JobCompletions_JobAssignmentId",
                table: "JobCompletions",
                column: "JobAssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_JobCompletions_JobId_OccurrenceDate_JobAssignmentId",
                table: "JobCompletions",
                columns: new[] { "JobId", "OccurrenceDate", "JobAssignmentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_DisplayOrder",
                table: "Users",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalendarSources");

            migrationBuilder.DropTable(
                name: "JobCompletions");

            migrationBuilder.DropTable(
                name: "SiteSettings");

            migrationBuilder.DropTable(
                name: "JobAssignments");

            migrationBuilder.DropTable(
                name: "Jobs");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
