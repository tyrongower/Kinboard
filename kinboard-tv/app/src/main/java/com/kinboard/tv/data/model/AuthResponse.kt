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
    val defaultView: String,

    @SerializedName("completionMode")
    val completionMode: String? = null,

    @SerializedName("choresRefreshSeconds")
    val choresRefreshSeconds: Int? = null,

    @SerializedName("calendarRefreshSeconds")
    val calendarRefreshSeconds: Int? = null,

    @SerializedName("weatherRefreshSeconds")
    val weatherRefreshSeconds: Int? = null,

    @SerializedName("weatherLocation")
    val weatherLocation: String? = null,

    @SerializedName("schoolStartTime")
    val schoolStartTime: String? = null
)
