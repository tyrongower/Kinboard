package com.kinboard.tv.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.tv.foundation.lazy.list.TvLazyColumn
import androidx.tv.foundation.lazy.list.itemsIndexed
import androidx.tv.foundation.lazy.list.rememberTvLazyListState
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import com.kinboard.tv.data.model.CalendarEvent
import com.kinboard.tv.ui.theme.*
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

// Backend emits UTC times with 'Z' suffix for timed events, naked local-date-time for all-day.
private fun parseDateTime(value: String): LocalDateTime? = try {
    java.time.Instant.parse(value)
        .atZone(java.time.ZoneId.systemDefault())
        .toLocalDateTime()
} catch (e: DateTimeParseException) {
    try {
        LocalDateTime.parse(value)
    } catch (e2: Exception) {
        try {
            LocalDate.parse(value).atStartOfDay()
        } catch (e3: Exception) {
            null
        }
    }
}

private fun parseColor(hex: String?): Color = try {
    if (hex.isNullOrBlank()) Primary
    else Color(android.graphics.Color.parseColor(hex))
} catch (e: Exception) {
    Primary
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun TodayCalendarCard(
    events: List<CalendarEvent>,
    selectedDate: LocalDate,
    isLoading: Boolean,
    onFocused: () -> Unit = {},
    focusRequester: FocusRequester? = null,
    modifier: Modifier = Modifier
) {
    var isCardFocused by remember { mutableStateOf(false) }
    val isToday = selectedDate == LocalDate.now()

    var now by remember { mutableStateOf(LocalDateTime.now()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(60_000L)
            now = LocalDateTime.now()
        }
    }

    val sorted = remember(events) {
        events.sortedWith(compareByDescending<CalendarEvent> { it.allDay }
            .thenBy { parseDateTime(it.start) ?: LocalDateTime.MAX })
    }
    val allDayEvents = sorted.filter { it.allDay }
    val timedEvents = sorted.filter { !it.allDay }

    val firstUpcomingIndex = remember(timedEvents, now, isToday) {
        if (!isToday) 0
        else timedEvents.indexOfFirst { ev ->
            val end = parseDateTime(ev.end)
            end != null && end.isAfter(now)
        }.coerceAtLeast(0)
    }

    val listState = rememberTvLazyListState()
    LaunchedEffect(firstUpcomingIndex, timedEvents.size) {
        if (timedEvents.isNotEmpty()) {
            listState.scrollToItem(firstUpcomingIndex)
        }
    }

    val titleText = when {
        isToday -> "Today"
        selectedDate == LocalDate.now().plusDays(1) -> "Tomorrow"
        selectedDate == LocalDate.now().minusDays(1) -> "Yesterday"
        else -> "Events"
    }

    Box(
        modifier = modifier
            .onFocusChanged { focusState ->
                isCardFocused = focusState.hasFocus
                if (focusState.hasFocus) onFocused()
            }
            .border(
                border = BorderStroke(
                    width = ComponentSize.focusBorderWidth,
                    color = if (isCardFocused) Primary else Color.Transparent
                ),
                shape = RoundedCornerShape(18.dp)
            )
            .padding(ComponentSize.focusBorderWidth)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(BorderRadius.md))
                .background(Surface)
                .drawBehind {
                    drawLine(
                        color = Primary,
                        start = Offset(0f, 0f),
                        end = Offset(0f, size.height),
                        strokeWidth = ComponentSize.cardLeftBorder.toPx()
                    )
                }
                .padding(
                    start = ComponentSize.cardLeftBorder + Spacing.md,
                    top = Spacing.md,
                    end = Spacing.md,
                    bottom = Spacing.md
                )
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = Spacing.md),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = titleText,
                        style = KinboardTypography.titleMedium,
                        color = OnSurface
                    )
                    val count = events.size
                    if (count > 0) {
                        Text(
                            text = if (count == 1) "1 event" else "$count events",
                            style = KinboardTypography.bodySmall,
                            color = OnSurfaceVariant
                        )
                    }
                }

                if (allDayEvents.isNotEmpty()) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(Spacing.xs),
                        modifier = Modifier.padding(bottom = Spacing.md)
                    ) {
                        allDayEvents.forEach { ev ->
                            AllDayChip(ev)
                        }
                    }
                }

                when {
                    isLoading && events.isEmpty() -> {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = Spacing.xxl),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Loading…",
                                style = KinboardTypography.bodyMedium,
                                color = OnSurfaceVariant
                            )
                        }
                    }

                    events.isEmpty() -> {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = Spacing.xxl),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No events",
                                style = KinboardTypography.titleMedium,
                                color = OnSurfaceVariant
                            )
                        }
                    }

                    timedEvents.isEmpty() -> {
                        // only all-day events; nothing more to render below
                    }

                    else -> {
                        val rowFocusRequesters = remember(timedEvents) {
                            timedEvents.mapIndexed { i, _ -> i to FocusRequester() }.toMap()
                        }

                        LaunchedEffect(focusRequester, timedEvents) {
                            // The card's external focusRequester (if any) is attached to the
                            // first focusable row so the parent can drive entry focus.
                        }

                        TvLazyColumn(
                            state = listState,
                            verticalArrangement = Arrangement.spacedBy(Spacing.sm)
                        ) {
                            itemsIndexed(
                                items = timedEvents,
                                key = { idx, ev -> "${ev.sourceId}-${ev.start}-$idx" }
                            ) { idx, ev ->
                                val start = parseDateTime(ev.start)
                                val end = parseDateTime(ev.end)
                                val isPast = isToday && end != null && !end.isAfter(now)
                                val isCurrent = isToday && start != null && end != null &&
                                    !start.isAfter(now) && end.isAfter(now)

                                val rowModifier = if (idx == 0 && focusRequester != null) {
                                    Modifier.focusRequester(focusRequester)
                                } else if (rowFocusRequesters[idx] != null) {
                                    Modifier.focusRequester(rowFocusRequesters[idx]!!)
                                } else Modifier

                                EventRow(
                                    event = ev,
                                    isPast = isPast,
                                    isCurrent = isCurrent,
                                    modifier = rowModifier
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun AllDayChip(event: CalendarEvent) {
    val color = parseColor(event.colorHex)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(BorderRadius.sm))
            .background(SurfaceVariant)
            .padding(horizontal = Spacing.sm, vertical = Spacing.xs),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(Spacing.sm))
        Text(
            text = "All day · ${event.title.orEmpty()}",
            style = KinboardTypography.bodySmall,
            color = OnSurface
        )
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun EventRow(
    event: CalendarEvent,
    isPast: Boolean,
    isCurrent: Boolean,
    modifier: Modifier = Modifier
) {
    var isFocused by remember { mutableStateOf(false) }
    val color = parseColor(event.colorHex)
    val start = parseDateTime(event.start)
    val end = parseDateTime(event.end)
    val timeText = when {
        start != null && end != null -> "${start.format(timeFormatter)}–${end.format(timeFormatter)}"
        start != null -> start.format(timeFormatter)
        else -> ""
    }

    val background = when {
        isCurrent -> ElevationLevel3
        isFocused -> ElevationLevel3
        else -> ElevationLevel1
    }
    val borderColor = when {
        isCurrent -> Secondary
        isFocused -> Primary
        else -> Color.Transparent
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(BorderRadius.sm))
            .background(background)
            .border(
                border = BorderStroke(2.dp, borderColor),
                shape = RoundedCornerShape(BorderRadius.sm)
            )
            .onFocusChanged { isFocused = it.isFocused || it.hasFocus }
            .padding(horizontal = Spacing.sm, vertical = Spacing.sm)
            .alpha(if (isPast) 0.4f else 1f),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(Spacing.sm))
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = timeText,
                    style = KinboardTypography.labelLarge,
                    color = OnSurface
                )
                if (isCurrent) {
                    Spacer(modifier = Modifier.width(Spacing.sm))
                    Text(
                        text = "NOW",
                        style = KinboardTypography.labelSmall,
                        color = Secondary
                    )
                }
            }
            Text(
                text = event.title.orEmpty(),
                style = KinboardTypography.bodyMedium,
                color = OnSurface
            )
            if (!event.sourceName.isNullOrBlank()) {
                Text(
                    text = event.sourceName,
                    style = KinboardTypography.bodySmall,
                    color = OnSurfaceVariant
                )
            }
        }
    }
}
