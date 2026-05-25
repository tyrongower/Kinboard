package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.kinboard.tv.data.model.ForecastItem
import com.kinboard.tv.data.model.SiteSettings
import com.kinboard.tv.data.model.WeatherData
import com.kinboard.tv.ui.screens.morning.WearCue
import com.kinboard.tv.ui.screens.morning.minutesUntilSchool
import com.kinboard.tv.ui.screens.morning.wearCueFor
import com.kinboard.tv.ui.screens.morning.weatherIconFor
import com.kinboard.tv.ui.theme.MorningCueHeavy
import com.kinboard.tv.ui.theme.MorningCueRain
import com.kinboard.tv.ui.theme.MorningInk
import com.kinboard.tv.ui.theme.MorningInkSoft
import com.kinboard.tv.ui.theme.MorningRainBlue
import com.kinboard.tv.ui.theme.MorningRed
import com.kinboard.tv.ui.theme.MorningType
import com.kinboard.tv.ui.viewmodel.MorningUiState
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

private val cardRainPillBg = Color(0xFFCFE9FF)
private val countdownLblColor = Color(0xFFFFD9D0)
private val countdownTargetColor = Color(0xFFFFE9E2)

@Composable
fun MorningTopBar(state: MorningUiState, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(30.dp),
        verticalAlignment = Alignment.Top
    ) {
        Brand(
            now = state.now,
            weather = state.weather,
            settings = state.siteSettings,
            modifier = Modifier.weight(1f)
        )
        SchoolCountdownChip(
            schoolStartTime = state.siteSettings?.schoolStartTime,
            now = state.now,
            modifier = Modifier.align(Alignment.CenterVertically)
        )
        WeatherStrip(state.weather)
    }
}

@Composable
private fun Brand(
    now: LocalDateTime,
    weather: WeatherData?,
    settings: SiteSettings?,
    modifier: Modifier = Modifier
) {
    val today = now.toLocalDate()
    val weekday = today.dayOfWeek
        .getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH)
        .lowercase()
    val dom = today.dayOfMonth
    val month = today.month
        .getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH)
        .lowercase()
    val conditionText = weather?.conditionText?.lowercase() ?: ""
    val tempPart = weather?.currentTempC?.let { "${it.toInt()}°" } ?: ""

    val subParts = buildList {
        add(weekday)
        add("$dom $month")
        if (conditionText.isNotBlank()) add(conditionText)
        if (tempPart.isNotBlank()) add(tempPart)
    }
    val sub = subParts.joinToString(" · ")

    Column(modifier) {
        val brandText = buildAnnotatedString {
            withStyle(SpanStyle(color = MorningInk)) { append("Good morning") }
            withStyle(SpanStyle(color = MorningRed)) { append("!") }
        }
        Text(
            text = brandText,
            style = MorningType.fraunces(84f).copy(color = MorningInk)
        )
        Spacer(Modifier.height(10.dp))
        Text(
            text = sub.uppercase(),
            style = MorningType.quicksand(24f, FontWeight.Bold).copy(
                color = MorningInkSoft,
                letterSpacing = 0.18.em,
                fontStyle = FontStyle.Normal
            )
        )
        if (weather != null && settings?.weatherLocation?.isNotBlank() == true) {
            Spacer(Modifier.height(14.dp))
            LocationPill(settings.weatherLocation)
        }
    }
}

@Composable
private fun LocationPill(label: String) {
    Row(
        modifier = Modifier
            .wrapContentSize()
            .hardShadow(offsetY = 4.dp, color = MorningInk, radius = 18.dp)
            .background(Color.White, RoundedCornerShape(18.dp))
            .border(3.dp, MorningInk, RoundedCornerShape(18.dp))
            .padding(horizontal = 12.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "📍",
            style = MorningType.quicksand(18f).copy(color = MorningInk)
        )
        Text(
            text = label,
            style = MorningType.quicksand(18f, FontWeight.Bold).copy(
                color = MorningInk,
                letterSpacing = 0.04.em
            )
        )
    }
}

@Composable
fun SchoolCountdownChip(
    schoolStartTime: String?,
    now: LocalDateTime,
    modifier: Modifier = Modifier
) {
    val mins = minutesUntilSchool(schoolStartTime, now) ?: return
    Box(
        modifier
            .wrapContentSize()
            .rotate(-1.6f)
            .hardShadow(offsetY = 8.dp, color = MorningInk, radius = 26.dp)
            .background(MorningRed, RoundedCornerShape(26.dp))
            .border(5.dp, MorningInk, RoundedCornerShape(26.dp))
            .padding(horizontal = 28.dp, vertical = 14.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "SCHOOL IN",
                style = MorningType.quicksand(18f, FontWeight.ExtraBold).copy(
                    color = countdownLblColor,
                    letterSpacing = 0.22.em
                )
            )
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = "$mins",
                    style = MorningType.fraunces(70f, italic = true).copy(color = Color.White)
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    text = "min",
                    style = MorningType.quicksand(24f, FontWeight.ExtraBold).copy(
                        color = countdownLblColor,
                        fontStyle = FontStyle.Normal
                    ),
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }
            Text(
                text = "be ready by $schoolStartTime",
                style = MorningType.caveat(30f).copy(color = countdownTargetColor)
            )
        }
    }
}

@Composable
fun WeatherStrip(weather: WeatherData?, modifier: Modifier = Modifier) {
    val forecast = (weather?.forecast ?: emptyList()).take(3)
    if (forecast.isEmpty()) return
    val rotations = listOf(-3f, 1f, -1f)
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        forecast.forEachIndexed { i, f ->
            WeatherDayCard(
                item = f,
                isToday = (i == 0),
                rotation = rotations[i.coerceIn(0, 2)],
                modifier = Modifier.width(200.dp)
            )
        }
    }
}

@Composable
private fun WeatherDayCard(
    item: ForecastItem,
    isToday: Boolean,
    rotation: Float,
    modifier: Modifier = Modifier
) {
    val date = runCatching { LocalDate.parse(item.date) }.getOrDefault(LocalDate.now())
    val dayLabel = date.dayOfWeek
        .getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH)
        .uppercase()
    val subDate = "${date.dayOfMonth} ${
        date.month.getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH)
    }"
    val cue = wearCueFor(item)
    val cueBg = if (cue.iconB != null) MorningCueHeavy else MorningCueRain

    Box(modifier.rotate(rotation)) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .hardShadow(offsetY = 6.dp, color = MorningInk, radius = 24.dp)
                .background(Color.White, RoundedCornerShape(24.dp))
                .border(5.dp, MorningInk, RoundedCornerShape(24.dp))
                .padding(start = 10.dp, end = 10.dp, top = 12.dp, bottom = 14.dp)
        ) {
            Text(
                text = dayLabel,
                style = MorningType.quicksand(22f, FontWeight.ExtraBold).copy(
                    color = MorningInk,
                    letterSpacing = 0.06.em
                )
            )
            Text(
                text = subDate.uppercase(),
                style = MorningType.quicksand(13f, FontWeight.Bold).copy(
                    color = MorningInkSoft,
                    letterSpacing = 0.14.em
                ),
                modifier = Modifier.offset(y = (-2).dp)
            )
            Icon(
                painter = painterResource(weatherIconFor(item)),
                contentDescription = item.conditionText,
                tint = Color.Unspecified,
                modifier = Modifier
                    .padding(top = 2.dp)
                    .size(96.dp)
            )
            TempLine(maxC = item.maxTempC.toInt(), minC = item.minTempC.toInt())
            RainPill(percent = item.chanceOfRainPercent, heavy = item.totalPrecipMm >= 15.0)
            Spacer(Modifier.height(6.dp))
            CueChip(cue = cue, bg = cueBg)
        }

        if (isToday) {
            TodayBadge(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = (-14).dp)
            )
        }
    }
}

@Composable
private fun TempLine(maxC: Int, minC: Int) {
    Row(verticalAlignment = Alignment.Bottom) {
        Text(
            text = "$maxC°",
            style = MorningType.fraunces(46f, italic = true).copy(color = MorningInk)
        )
        Spacer(Modifier.width(6.dp))
        Text(
            text = "$minC°",
            style = MorningType.fraunces(30f, italic = true).copy(color = MorningInkSoft)
        )
    }
}

@Composable
private fun RainPill(percent: Int, heavy: Boolean) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier
            .padding(vertical = 4.dp)
            .background(cardRainPillBg, RoundedCornerShape(14.dp))
            .border(2.5.dp, MorningInk, RoundedCornerShape(14.dp))
            .padding(horizontal = 10.dp, vertical = 2.dp)
    ) {
        Text(text = "💧", style = MorningType.quicksand(18f).copy(color = MorningRainBlue))
        Text(
            text = if (heavy) "$percent% · heavy" else "$percent%",
            style = MorningType.quicksand(16f, FontWeight.ExtraBold).copy(
                color = MorningInk,
                letterSpacing = 0.04.em
            )
        )
    }
}

@Composable
private fun CueChip(cue: WearCue, bg: Color) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier
            .hardShadow(offsetY = 3.dp, color = MorningInk, radius = 16.dp)
            .background(bg, RoundedCornerShape(16.dp))
            .border(3.dp, MorningInk, RoundedCornerShape(16.dp))
            .padding(horizontal = 12.dp, vertical = 4.dp)
    ) {
        Icon(
            painter = painterResource(cue.iconA),
            contentDescription = null,
            tint = Color.Unspecified,
            modifier = Modifier.size(22.dp)
        )
        if (cue.iconB != null) {
            Icon(
                painter = painterResource(cue.iconB),
                contentDescription = null,
                tint = Color.Unspecified,
                modifier = Modifier.size(22.dp)
            )
        }
        Text(
            text = cue.label,
            style = MorningType.quicksand(18f, FontWeight.ExtraBold).copy(color = MorningInk)
        )
    }
}

@Composable
private fun TodayBadge(modifier: Modifier = Modifier) {
    Box(
        modifier
            .rotate(-3f)
            .hardShadow(offsetY = 4.dp, color = MorningInk, radius = 14.dp)
            .background(MorningRed, RoundedCornerShape(14.dp))
            .border(3.dp, MorningInk, RoundedCornerShape(14.dp))
            .padding(horizontal = 12.dp, vertical = 3.dp)
    ) {
        Text(
            text = "TODAY",
            style = MorningType.quicksand(14f, FontWeight.Bold).copy(
                color = Color.White,
                letterSpacing = 0.18.em
            )
        )
    }
}
