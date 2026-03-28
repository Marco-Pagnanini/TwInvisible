namespace UserProfile.Application.DTOs;

public class UserProfileResponse
{
    public double Ci { get; set; }
    public double Urg { get; set; }
    public double Hobby { get; set; }
    public double Hype { get; set; }
    public double DispE { get; set; }
    public bool Success { get; set; }
    public string? Error { get; set; }
}
