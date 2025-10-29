using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace PrayerTasker.Application.DTOs.Account;

public class RegisterDto
{
    [Required(ErrorMessage = "Full Name can't be blank")]
    public required string FullName { get; set; }

    [Required(ErrorMessage = "User Name can't be blank")]
    public required string UserName { get; set; }
    [Required(ErrorMessage = "Email can't be blank")]
    [EmailAddress(ErrorMessage = "Email should be in a proper email address format")]
    [Remote(action: "IsEmailAlreadyRegistered", controller: "Account", ErrorMessage = "Email is already is use")]
    public string Email { get; set; } = string.Empty;
    [Required(ErrorMessage = "Password can't be blank")]
    [DataType(DataType.Password)]
    public required string Password { get; set; }


    [Required(ErrorMessage = "Confirm Password can't be blank")]
    [DataType(DataType.Password)]
    [Compare("Password", ErrorMessage = "Password and Confirm Password must match")]
    public required string ConfirmPassword { get; set; }

}
