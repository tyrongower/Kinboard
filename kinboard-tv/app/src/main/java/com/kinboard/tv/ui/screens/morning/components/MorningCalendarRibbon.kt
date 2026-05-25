package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import com.kinboard.tv.data.model.CalendarEvent
import com.kinboard.tv.ui.screens.morning.parseEventTime
import com.kinboard.tv.ui.theme.MorningInk
import com.kinboard.tv.ui.theme.MorningInkSoft
import com.kinboard.tv.ui.theme.MorningRibbonEv
import com.kinboard.tv.ui.theme.MorningType
import java.time.LocalDate
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

private val timeFmt = DateTimeFormatter.ofPattern("HH:mm")

@Composable
fun MorningCalendarRibbon(events: List<CalendarEvent>, modifier: Modifier = Modifier) {
    val today = LocalDate.now()
    val visible = events
        .mapNotNull { ev -> parseEventTime(ev.start)?.let { it to ev } }
        .filter { it.first.toLocalDate() == today }
        .sortedBy { it.first }
        .take(3)
    if (visible.isEmpty()) return

    val weekday = today.dayOfWeek
        .getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH)
        .lowercase()

    Box(
        modifier
            .height(140.dp)
            .rotate(0.2f)
            .hardShadow(offsetY = 8.dp, color = MorningInk, radius = 26.dp)
            .background(Color.White, RoundedCornerShape(26.dp))
            .border(5.dp, MorningInk, RoundedCornerShape(26.dp))
            .padding(horizontal = 22.dp, vertical = 14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().fillMaxHeight(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            Column(Modifier.width(240.dp)) {
                Text(
                    text = "Today",
                    style = MorningType.fraunces(52f, italic = true).copy(color = MorningInk)
                )
                Text(
                    text = "$weekday · ${visible.size} things on".uppercase(),
                    style = MorningType.quicksand(14f, FontWeight.Bold).copy(
                        color = MorningInkSoft,
                        letterSpacing = 0.18.em,
                        fontStyle = FontStyle.Normal
                    )
                )
            }
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                val rotations = listOf(-1f, 0.6f, -0.8f)
                visible.forEachIndexed { i, (start, ev) ->
                    EventCard(
                        start = start,
                        ev = ev,
                        rotation = rotations[i.coerceIn(0, 2)],
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun EventCard(
    start: ZonedDateTime,
    ev: CalendarEvent,
    rotation: Float,
    modifier: Modifier = Modifier
) {
    val end = parseEventTime(ev.end)
    val timeText = when {
        ev.allDay -> "ALL DAY"
        end != null -> "${start.toLocalTime().format(timeFmt)} – ${end.toLocalTime().format(timeFmt)}"
        else -> start.toLocalTime().format(timeFmt)
    }
    val dotColor = runCatching {
        val hex = ev.colorHex
        if (hex.isNullOrBlank()) Color(0xFF8B5CF6)
        else Color(android.graphics.Color.parseColor(hex))
    }.getOrDefault(Color(0xFF8B5CF6))

    Box(
        modifier
            .rotate(rotation)
            .hardShadow(offsetY = 4.dp, color = MorningInk, radius = 18.dp)
            .background(MorningRibbonEv, RoundedCornerShape(18.dp))
            .border(3.5.dp, MorningInk, RoundedCornerShape(18.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                Modifier
                    .size(16.dp)
                    .clip(CircleShape)
                    .background(dotColor)
                    .border(3.dp, MorningInk, CircleShape)
            )
            Column {
                Text(
                    text = timeText,
                    style = MorningType.quicksand(13f, FontWeight.ExtraBold).copy(
                        color = MorningInkSoft,
                        letterSpacing = 0.18.em
                    )
                )
                Text(
                    text = ev.title ?: "",
                    style = MorningType.quicksand(22f, FontWeight.ExtraBold).copy(color = MorningInk),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}
