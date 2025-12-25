using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrayerTasker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsAutoLocationToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAutoLocation",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAutoLocation",
                table: "AspNetUsers");
        }
    }
}
