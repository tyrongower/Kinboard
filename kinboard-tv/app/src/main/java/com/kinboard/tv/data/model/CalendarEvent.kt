package com.kinboard.tv.data.model

import com.google.gson.annotations.SerializedName

data class CalendarEvent(
    @SerializedName("sourceId") val sourceId: Int,
    @SerializedName("sourceName") val sourceName: String?,
    @SerializedName("colorHex") val colorHex: String?,
    @SerializedName("title") val title: String?,
    @SerializedName("start") val start: String,
    @SerializedName("end") val end: String,
    @SerializedName("allDay") val allDay: Boolean
)
