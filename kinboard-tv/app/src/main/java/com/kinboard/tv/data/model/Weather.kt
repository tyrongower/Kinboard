package com.kinboard.tv.data.model

import com.google.gson.annotations.SerializedName

data class WeatherData(
    @SerializedName("currentTempC") val currentTempC: Double,
    @SerializedName("feelsLikeC") val feelsLikeC: Double,
    @SerializedName("conditionText") val conditionText: String,
    @SerializedName("conditionIconUrl") val conditionIconUrl: String?,
    @SerializedName("humidity") val humidity: Int,
    @SerializedName("windKph") val windKph: Double,
    @SerializedName("todayMinTempC") val todayMinTempC: Double,
    @SerializedName("todayMaxTempC") val todayMaxTempC: Double,
    @SerializedName("todayPrecipMm") val todayPrecipMm: Double,
    @SerializedName("tomorrowAvgTempC") val tomorrowAvgTempC: Double,
    @SerializedName("tomorrowPrecipMm") val tomorrowPrecipMm: Double,
    @SerializedName("forecast5") val forecast: List<ForecastItem>
)

data class ForecastItem(
    @SerializedName("date") val date: String,
    @SerializedName("avgTempC") val avgTempC: Double,
    @SerializedName("minTempC") val minTempC: Double,
    @SerializedName("maxTempC") val maxTempC: Double,
    @SerializedName("totalPrecipMm") val totalPrecipMm: Double,
    @SerializedName("chanceOfRainPercent") val chanceOfRainPercent: Int,
    @SerializedName("conditionIconUrl") val conditionIconUrl: String?,
    @SerializedName("conditionText") val conditionText: String?
)
