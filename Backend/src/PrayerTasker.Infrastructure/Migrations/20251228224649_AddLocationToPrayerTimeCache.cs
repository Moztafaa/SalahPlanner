using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrayerTasker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationToPrayerTimeCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "DailyUserPrayerTimes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "DailyUserPrayerTimes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "DailyUserPrayerTimes",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "DailyUserPrayerTimes",
                type: "float",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "DailyUserPrayerTimes");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "DailyUserPrayerTimes");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "DailyUserPrayerTimes");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "DailyUserPrayerTimes");
        }
    }
}
