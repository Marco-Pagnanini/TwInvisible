namespace UserProfile.Domain.Models;

public class ProfileScores
{
    /// <summary>Consumo Impulsivo (0-100)</summary>
    public double Ci { get; set; }

    /// <summary>Urgenza nel prendere scelte (0-100)</summary>
    public double Urg { get; set; }

    /// <summary>Scelte basate su hobby (0-100)</summary>
    public double Hobby { get; set; }

    /// <summary>Hype / facilità a comprare (0-100)</summary>
    public double Hype { get; set; }

    /// <summary>Disposizione a esplorare / categorie non interessanti (0-100)</summary>
    public double DispE { get; set; }
}
