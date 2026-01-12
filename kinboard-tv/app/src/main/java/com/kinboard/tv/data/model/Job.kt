package com.kinboard.tv.data.model

import com.google.gson.annotations.SerializedName

data class Job(
    @SerializedName("id")
    val id: Int,
    
    @SerializedName("title")
    val title: String,
    
    @SerializedName("description")
    val description: String? = null,
    
    @SerializedName("imageUrl")
    val imageUrl: String? = null,  // Relative path like "/job-images/job_1.webp"
    
    @SerializedName("createdAt")
    val createdAt: String,  // ISO datetime
    
    @SerializedName("recurrence")
    val recurrence: String? = null,  // RRULE format
    
    @SerializedName("recurrenceStartDate")
    val recurrenceStartDate: String? = null,
    
    @SerializedName("recurrenceEndDate")
    val recurrenceEndDate: String? = null,
    
    @SerializedName("recurrenceIndefinite")
    val recurrenceIndefinite: Boolean? = null,
    
    @SerializedName("useSharedRecurrence")
    val useSharedRecurrence: Boolean? = null,
    
    @SerializedName("assignments")
    val assignments: List<JobAssignment>? = null,
    
    @SerializedName("occurrenceDate")
    val occurrenceDate: String? = null
)
