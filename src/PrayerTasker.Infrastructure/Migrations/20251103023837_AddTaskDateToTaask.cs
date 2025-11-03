using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrayerTasker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskDateToTaask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "TaskDate",
                table: "Tasks",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TaskDate",
                table: "Tasks");
        }
    }
}
