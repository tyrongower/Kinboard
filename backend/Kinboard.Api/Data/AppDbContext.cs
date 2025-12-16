using Microsoft.EntityFrameworkCore;
using Kinboard.Api.Models;

namespace Kinboard.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Job> Jobs { get; set; }
    public DbSet<JobCompletion> JobCompletions { get; set; }
    public DbSet<JobAssignment> JobAssignments { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<CalendarSource> CalendarSources { get; set; }
    public DbSet<SiteSettings> SiteSettings { get; set; }
    public DbSet<ShoppingList> ShoppingLists { get; set; }
    public DbSet<ShoppingItem> ShoppingItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure entity relationships and constraints here
        modelBuilder.Entity<Job>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UseSharedRecurrence).IsRequired().HasDefaultValue(true);
            
            // Relationship: Job -> JobAssignments (multi-user)
            entity
                .HasMany(e => e.Assignments)
                .WithOne(a => a.Job)
                .HasForeignKey(a => a.JobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<JobAssignment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Recurrence).HasMaxLength(500);
            entity.Property(e => e.RecurrenceIndefinite).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);

            // Relationship: JobAssignment -> User
            entity
                .HasOne(e => e.User)
                .WithMany(u => u.JobAssignments)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint: one assignment per user per job
            entity.HasIndex(e => new { e.JobId, e.UserId }).IsUnique();
            entity.HasIndex(e => e.DisplayOrder);
        });

        modelBuilder.Entity<JobCompletion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OccurrenceDate).IsRequired();
            entity.Property(e => e.CompletedAt).IsRequired();

            // Relationship: JobCompletion -> Job
            entity
                .HasOne(e => e.Job)
                .WithMany()
                .HasForeignKey(e => e.JobId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relationship: JobCompletion -> User (CompletedBy)
            entity
                .HasOne(e => e.CompletedBy)
                .WithMany()
                .HasForeignKey(e => e.CompletedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Relationship: JobCompletion -> JobAssignment (optional, for per-user tracking)
            entity
                .HasOne(e => e.JobAssignment)
                .WithMany(a => a.Completions)
                .HasForeignKey(e => e.JobAssignmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Unique constraint: one completion per job per occurrence date per assignment
            // When JobAssignmentId is null, it's a legacy/shared completion
            entity.HasIndex(e => new { e.JobId, e.OccurrenceDate, e.JobAssignmentId }).IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ColorHex).IsRequired().HasMaxLength(7); // like #RRGGBB
            entity.Property(e => e.HideCompletedInKiosk)
                  .IsRequired()
                  .HasDefaultValue(true);
            entity.Property(e => e.AvatarUrl)
                  .HasMaxLength(500);
            entity.Property(e => e.DisplayOrder)
                  .IsRequired()
                  .HasDefaultValue(0);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.DisplayOrder);
        });

        modelBuilder.Entity<CalendarSource>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.IcalUrl).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.ColorHex).IsRequired().HasMaxLength(7);
            entity.Property(e => e.Enabled).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);
            entity.HasIndex(e => e.DisplayOrder);
        });

        modelBuilder.Entity<SiteSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DefaultView)
                  .IsRequired()
                  .HasMaxLength(10)
                  .HasDefaultValue("Day");
            entity.Property(e => e.CompletionMode)
                  .IsRequired()
                  .HasMaxLength(20)
                  .HasDefaultValue("Today");
            entity.Property(e => e.ChoresRefreshSeconds)
                  .IsRequired()
                  .HasDefaultValue(10);
            entity.Property(e => e.CalendarRefreshSeconds)
                  .IsRequired()
                  .HasDefaultValue(30);
            entity.Property(e => e.WeatherRefreshSeconds)
                  .IsRequired()
                  .HasDefaultValue(1800);
            // Add these missing configurations to match the snapshot
            entity.Property(e => e.WeatherApiKey);
            entity.Property(e => e.WeatherLocation);
        });

        modelBuilder.Entity<ShoppingList>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ColorHex).IsRequired().HasMaxLength(7);
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);
            entity.HasIndex(e => e.DisplayOrder);
 

            // Relationship: ShoppingList -> ShoppingItems
            entity
                .HasMany(e => e.Items)
                .WithOne(i => i.ShoppingList)
                .HasForeignKey(i => i.ShoppingListId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ShoppingItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(500);
            entity.Property(e => e.IsBought).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IsImportant).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.DisplayOrder).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasIndex(e => e.ShoppingListId);
            entity.HasIndex(e => e.DisplayOrder);
        });
    }
}
