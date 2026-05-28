package com.kinboard.tv.ui.screens.morning

import androidx.annotation.DrawableRes
import com.kinboard.tv.R
import com.kinboard.tv.data.model.ForecastItem
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

@DrawableRes
fun weatherIconFor(f: ForecastItem): Int {
    val cond = (f.conditionText ?: "").lowercase()
    if (f.totalPrecipMm >= 15.0) return R.drawable.weather_heavy_rain
    if (f.chanceOfRainPercent >= 60) return R.drawable.weather_rain
    if ("partly" in cond || ("sun" in cond && "cloud" in cond)) return R.drawable.weather_sun_cloud
    if ("cloud" in cond || "overcast" in cond || "mist" in cond) return R.drawable.weather_cloud
    return R.drawable.weather_sun
}

data class WearCue(
    val label: String,
    @DrawableRes val iconA: Int,
    @DrawableRes val iconB: Int? = null
)

fun wearCueFor(f: ForecastItem): WearCue {
    if (f.totalPrecipMm >= 15.0) return WearCue("coat + boots", R.drawable.cue_raincoat, R.drawable.cue_boots)
    if (f.chanceOfRainPercent >= 60) return WearCue("raincoat", R.drawable.cue_raincoat)
    if (f.maxTempC <= 13.0) return WearCue("coat", R.drawable.cue_coat)
    if (f.maxTempC <= 18.0) return WearCue("jumper", R.drawable.cue_jumper)
    if (f.maxTempC <= 24.0) return WearCue("t-shirt", R.drawable.cue_tshirt)
    return WearCue("sun hat", R.drawable.cue_hat)
}

/**
 * Minutes remaining until schoolStartTime today.
 *  - null if blank/unparseable.
 *  - null if more than 6h before school (chip not relevant yet).
 *  - null if more than 90 min past school start (morning over).
 *  - otherwise returns minutes clamped to >= 0 so the chip shows "0 min"
 *    at school time and remains visible during the grace window.
 */
fun minutesUntilSchool(
    schoolStartTime: String?,
    now: LocalDateTime = LocalDateTime.now()
): Int? {
    if (schoolStartTime.isNullOrBlank()) return null
    val t = runCatching { LocalTime.parse(schoolStartTime, DateTimeFormatter.ofPattern("HH:mm")) }.getOrNull()
        ?: runCatching { LocalTime.parse(schoolStartTime) }.getOrNull()
        ?: return null
    val target = LocalDateTime.of(now.toLocalDate(), t)
    val mins = Duration.between(now, target).toMinutes().toInt()
    return when {
        mins > 360 -> null
        mins < -90 -> null
        else -> mins.coerceAtLeast(0)
    }
}

/** Parse calendar event time. Accepts ISO instant, naked local datetime, or date-only. */
fun parseEventTime(value: String): ZonedDateTime? = runCatching {
    java.time.Instant.parse(value).atZone(java.time.ZoneId.systemDefault())
}.getOrNull() ?: runCatching {
    LocalDateTime.parse(value).atZone(java.time.ZoneId.systemDefault())
}.getOrNull() ?: runCatching {
    LocalDate.parse(value).atStartOfDay(java.time.ZoneId.systemDefault())
}.getOrNull()
