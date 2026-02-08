package com.kinboard.tv.data.model

import com.google.gson.annotations.SerializedName

data class AuthResponse(
    @SerializedName("accessToken")
    val accessToken: String,
    
    @SerializedName("role")
    val role: String,  // "kiosk"
    
    @SerializedName("user")
    val user: User? = null  // Always null for kiosk auth
)

data class KioskAuthRequest(
    @SerializedName("token")
    val token: String
)

data class AuthStatusResponse(
    @SerializedName("accessToken")
    val accessToken: String,
    
    @SerializedName("role")
    val role: String,
    
    @SerializedName("user")
    val user: User? = null
)

data class ErrorResponse(
    @SerializedName("message")
    val message: String
)

data class HideCompletedResponse(
    @SerializedName("hideCompletedInKiosk")
    val hideCompletedInKiosk: Boolean
)

data class SiteSettings(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("defaultView")
    val defaultView: String,  // "Day" | "Week" | "Month"
    
    @SerializedName("completionMode")
    val completionMode: String? = null,  // "Today" | "VisibleRange" | null
    
    @SerializedName("jobsRefreshSeconds")
    val jobsRefreshSeconds: Int? = null
)
