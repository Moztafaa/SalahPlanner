using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrayerTasker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDailyTaskEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DailyUserPrayerTimes_AspNetUsers_ApplicationUserId",
                table: "DailyUserPrayerTimes");

            migrationBuilder.DropIndex(
                name: "IX_DailyUserPrayerTimes_ApplicationUserId",
                table: "DailyUserPrayerTimes");

            migrationBuilder.AlterColumn<string>(
                name: "ApplicationUserId",
                table: "DailyUserPrayerTimes",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApplicationUserId1",
                table: "DailyUserPrayerTimes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Method",
                table: "DailyUserPrayerTimes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_DailyUserPrayerTimes_ApplicationUserId1",
                table: "DailyUserPrayerTimes",
                column: "ApplicationUserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_DailyUserPrayerTimes_AspNetUsers_ApplicationUserId1",
                table: "DailyUserPrayerTimes",
                column: "ApplicationUserId1",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DailyUserPrayerTimes_AspNetUsers_ApplicationUserId1",
                table: "DailyUserPrayerTimes");

            migrationBuilder.DropIndex(
                name: "IX_DailyUserPrayerTimes_ApplicationUserId1",
                table: "DailyUserPrayerTimes");

            migrationBuilder.DropColumn(
                name: "ApplicationUserId1",
                table: "DailyUserPrayerTimes");

            migrationBuilder.DropColumn(
                name: "Method",
                table: "DailyUserPrayerTimes");

            migrationBuilder.AlterColumn<Guid>(
                name: "ApplicationUserId",
                table: "DailyUserPrayerTimes",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DailyUserPrayerTimes_ApplicationUserId",
                table: "DailyUserPrayerTimes",
                column: "ApplicationUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_DailyUserPrayerTimes_AspNetUsers_ApplicationUserId",
                table: "DailyUserPrayerTimes",
                column: "ApplicationUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
