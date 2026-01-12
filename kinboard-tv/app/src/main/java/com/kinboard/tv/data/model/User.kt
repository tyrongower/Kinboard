package com.kinboard.tv.data.model

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("displayName")
    val displayName: String,
    
    @SerializedName("colorHex")
    val colorHex: String,  // e.g., "#6366f1" - USE THIS FOR CARD BORDERS, PROGRESS BARS, AVATARS
    
    @SerializedName("avatarUrl")
    val avatarUrl: String? = null,  // Relative path like "/avatars/user_1.webp"
    
    @SerializedName("displayOrder")
    val displayOrder: Int? = null,
    
    @SerializedName("hideCompletedInKiosk")
    val hideCompletedInKiosk: Boolean? = null
)
