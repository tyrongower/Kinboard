package com.kinboard.tv.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.kinboard.tv.data.model.WeatherData
import com.kinboard.tv.ui.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.*

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun WeatherWidget(
    weather: WeatherData?,
    isLoading: Boolean,
    currentTime: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .shadow(2.dp, RoundedCornerShape(12.dp))
            .clip(RoundedCornerShape(12.dp))
            .background(Surface)
            .border(1.dp, SurfaceBorder, RoundedCornerShape(12.dp))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        when {
            isLoading -> {
                Text(
                    text = "Loading weather...",
                    style = KinboardTypography.bodyMedium,
                    color = OnSurfaceVariant
                )
            }

            weather == null -> {
                Text(
                    text = "Weather unavailable",
                    style = KinboardTypography.bodyMedium,
                    color = OnSurfaceVariant
                )
            }

            else -> {
                // Current weather
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Weather icon
                    if (weather.conditionIconUrl != null) {
                        AsyncImage(
                            model = weather.conditionIconUrl,
                            contentDescription = weather.conditionText,
                            modifier = Modifier.size(48.dp)
                        )
                    }

                    // Temperature
                    Column(
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.Bottom
                        ) {
                            Text(
                                text = "${weather.currentTempC.toInt()}°",
                                fontSize = 32.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = OnBackground
                            )
                        }
                        Text(
                            text = "feels ${weather.feelsLikeC.toInt()}°",
                            fontSize = 14.sp,
                            color = OnSurfaceVariant,
                            modifier = Modifier.alpha(0.8f)
                        )
                    }
                }

                // 3-day forecast
                if (weather.forecast.isNotEmpty()) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        weather.forecast.take(3).forEach { day ->
                            ForecastDayCard(
                                date = day.date,
                                iconUrl = day.conditionIconUrl,
                                minTemp = day.minTempC,
                                maxTemp = day.maxTempC,
                                rainChance = day.chanceOfRainPercent
                            )
                        }
                    }
                }

                // Current time
                Text(
                    text = currentTime,
                    fontSize = 14.sp,
                    color = OnSurfaceVariant,
                    modifier = Modifier.alpha(0.7f)
                )
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun ForecastDayCard(
    date: String,
    iconUrl: String?,
    minTemp: Double,
    maxTemp: Double,
    rainChance: Int,
    modifier: Modifier = Modifier
) {
    val localDate = LocalDate.parse(date)
    val dayOfWeek = localDate.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault()).take(2)

    Column(
        modifier = modifier
            .width(64.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(SurfaceVariant)
            .border(1.dp, SurfaceBorder, RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        // Day label
        Text(
            text = dayOfWeek,
            fontSize = 11.sp,
            color = OnSurfaceVariant,
            modifier = Modifier.alpha(0.7f)
        )

        // Weather icon
        if (iconUrl != null) {
            AsyncImage(
                model = iconUrl,
                contentDescription = null,
                modifier = Modifier.size(24.dp)
            )
        } else {
            Spacer(modifier = Modifier.height(24.dp))
        }

        // Temperature range
        Text(
            text = "${minTemp.toInt()}°/${maxTemp.toInt()}°",
            fontSize = 11.sp,
            color = OnBackground
        )

        // Rain chance
        Text(
            text = "💧$rainChance%",
            fontSize = 11.sp,
            color = OnSurfaceVariant,
            modifier = Modifier.alpha(0.8f)
        )
    }
}
