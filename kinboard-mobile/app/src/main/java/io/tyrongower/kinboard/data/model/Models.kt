package io.tyrongower.kinboard.data.model

import com.google.gson.annotations.SerializedName

// Authentication
data class AuthResponse(
    val accessToken: String,
    val role: String,
    val user: AdminUser?
)

data class AdminUser(
    val id: Int,
    val email: String,
    val displayName: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class KioskAuthRequest(
    val token: String
)

// Shopping Lists
data class ShoppingList(
    val id: Int,
    val name: String,
    val colorHex: String,
    val avatarUrl: String?,
    val displayOrder: Int,
    val items: List<ShoppingItem>
)

data class ShoppingItem(
    val id: Int,
    val shoppingListId: Int,
    val name: String,
    val isBought: Boolean,
    val isImportant: Boolean,
    val displayOrder: Int,
    val createdAt: String
)

data class CreateShoppingListRequest(
    val name: String,
    val colorHex: String,
    val displayOrder: Int
)

data class CreateShoppingItemRequest(
    val name: String,
    val isBought: Boolean,
    val isImportant: Boolean,
    val displayOrder: Int
)

data class AvatarUploadResponse(
    val avatarUrl: String
)

// Users
data class User(
    val id: Int,
    val displayName: String,
    val colorHex: String,
    val hideCompletedInKiosk: Boolean?,
    val avatarUrl: String?,
    val displayOrder: Int?,
    val email: String?,
    val isAdmin: Boolean?
)

// Jobs
data class Job(
    val id: Int,
    val title: String,
    val description: String?,
    val imageUrl: String?,
    val createdAt: String,
    val recurrence: String?,
    val recurrenceStartDate: String?,
    val recurrenceEndDate: String?,
    val recurrenceIndefinite: Boolean?,
    val useSharedRecurrence: Boolean?,
    val assignments: List<JobAssignment>?,
    val occurrenceDate: String?
)

data class JobAssignment(
    val id: Int,
    val jobId: Int,
    val userId: Int,
    val user: User?,
    val recurrence: String?,
    val recurrenceStartDate: String?,
    val recurrenceEndDate: String?,
    val recurrenceIndefinite: Boolean?,
    val displayOrder: Int,
    val isCompleted: Boolean?,
    val completedAt: String?
)

// Calendar
data class CalendarSource(
    val id: Int,
    val name: String,
    val icalUrl: String,
    val colorHex: String,
    val enabled: Boolean,
    val displayOrder: Int
)

data class CalendarEventItem(
    val sourceId: Int,
    val sourceName: String,
    val colorHex: String,
    val title: String,
    val start: String,
    val end: String,
    val allDay: Boolean
)

// Site Settings
data class SiteSettings(
    val id: Int,
    val defaultView: String,
    val completionMode: String?,
    val jobsRefreshSeconds: Int?,
    val calendarRefreshSeconds: Int?,
    val weatherRefreshSeconds: Int?,
    val weatherApiKey: String?,
    val weatherLocation: String?
)

// Kiosk Tokens
data class KioskToken(
    val id: Int,
    val name: String,
    val createdAt: String,
    val isActive: Boolean
)

data class KioskTokenResponse(
    val id: Int,
    val token: String,
    val name: String,
    val createdAt: String
)

data class CreateKioskTokenRequest(
    val name: String
)
