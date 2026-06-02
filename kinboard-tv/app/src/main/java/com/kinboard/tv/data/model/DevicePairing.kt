package com.kinboard.tv.data.model

import com.google.gson.annotations.SerializedName

/** Returned by POST /api/auth/device/start. */
data class DeviceStartResponse(
    @SerializedName("deviceCode")
    val deviceCode: String,

    @SerializedName("userCode")
    val userCode: String,

    @SerializedName("expiresInSeconds")
    val expiresInSeconds: Int,

    @SerializedName("intervalSeconds")
    val intervalSeconds: Int
)

/** Body for POST /api/auth/device/poll. */
data class DevicePollRequest(
    @SerializedName("deviceCode")
    val deviceCode: String
)

/** Returned by POST /api/auth/device/poll. */
data class DevicePollResponse(
    @SerializedName("status")
    val status: String, // pending | approved | expired

    @SerializedName("kioskToken")
    val kioskToken: String? = null,

    @SerializedName("accessToken")
    val accessToken: String? = null
)
