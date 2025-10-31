using System;
using AutoMapper;
using PrayerTasker.Application.DTOs.Account;
using PrayerTasker.Application.DTOs.Task;
using PrayerTasker.Domain.Entities;
using PrayerTasker.Domain.IdentityEntities;

namespace PrayerTasker.Application.Mapping;

public class MappingProfile : Profile
{
    // map register dto to application user and vice versa
    public MappingProfile()
    {
        CreateMap<RegisterDto, ApplicationUser>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.NormalizedEmail, opt => opt.MapFrom(src => src.Email.ToUpper()))
            .ForMember(dest => dest.NormalizedUserName, opt => opt.MapFrom(src => src.UserName.ToUpper()))
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        // .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName)).ReverseMap();


        // Task mappings can be added here as well
        CreateMap<CreateTaskDto, Taask>().ReverseMap();

        CreateMap<Taask, TaskDto>().ReverseMap();
        // CreateMap<List<Taask>, List<TaskDto>>().ReverseMap();

    }


}
