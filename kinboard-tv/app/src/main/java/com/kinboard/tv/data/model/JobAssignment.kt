package com.kinboard.tv.data.model

import com.google.gson.annotations.SerializedName

data class JobAssignment(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("jobId")
    val jobId: Int,
    
    @SerializedName("userId")
    val userId: Int,
    
    @SerializedName("user")
    val user: User? = null,
    
    @SerializedName("recurrence")
    val recurrence: String? = null,
    
    @SerializedName("recurrenceStartDate")
    val recurrenceStartDate: String? = null,
    
    @SerializedName("recurrenceEndDate")
    val recurrenceEndDate: String? = null,
    
    @SerializedName("recurrenceIndefinite")
    val recurrenceIndefinite: Boolean? = null,
    
    @SerializedName("displayOrder")
    val displayOrder: Int,
    
    @SerializedName("isCompleted")
    val isCompleted: Boolean? = null,
    
    @SerializedName("completedAt")
    val completedAt: String? = null  // ISO datetime
)
