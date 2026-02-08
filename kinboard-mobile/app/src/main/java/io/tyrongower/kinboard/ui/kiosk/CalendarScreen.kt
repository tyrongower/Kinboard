package io.tyrongower.kinboard.ui.kiosk

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import io.tyrongower.kinboard.data.model.CalendarEventItem
import io.tyrongower.kinboard.ui.theme.*
import io.tyrongower.kinboard.viewmodel.CalendarUiState
import io.tyrongower.kinboard.viewmodel.CalendarViewModel
import io.tyrongower.kinboard.viewmodel.CalendarViewType
import io.tyrongower.kinboard.viewmodel.UserCompletionStats
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScreen(
    onBack: () -> Unit,
    viewModel: CalendarViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showSourceFilter by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            CalendarTopBar(
                selectedDate = uiState.selectedDate,
                onPreviousDay = { viewModel.previousDay() },
                onToday = { viewModel.selectToday() },
                onNextDay = { viewModel.nextDay() },
                onFilterClick = { showSourceFilter = true },
                onBack = onBack
            )
        }
    ) { paddingValues ->
        if (uiState.isLoading && uiState.events.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            CalendarContent(
                uiState = uiState,
                onViewTypeChange = { viewModel.setViewType(it) },
                onDateSelect = { viewModel.selectDate(it) },
                modifier = Modifier.padding(paddingValues)
            )
        }

        // Source filter bottom sheet
        if (showSourceFilter && uiState.sources.size > 1) {
            SourceFilterBottomSheet(
                sources = uiState.sources,
                selectedIds = uiState.selectedSourceIds,
                onToggleSource = { viewModel.toggleSource(it) },
                onDismiss = { showSourceFilter = false }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarTopBar(
    selectedDate: LocalDate,
    onPreviousDay: () -> Unit,
    onToday: () -> Unit,
    onNextDay: () -> Unit,
    onFilterClick: () -> Unit,
    onBack: () -> Unit
) {
    TopAppBar(
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(SpacingMd)
            ) {
                IconButton(onClick = onPreviousDay) {
                    Icon(Icons.Default.ChevronLeft, "Previous day")
                }
                TextButton(onClick = onToday) {
                    Text(
                        text = selectedDate.format(DateTimeFormatter.ofPattern("EEE, MMM d")),
                        style = MaterialTheme.typography.titleMedium
                    )
                }
                IconButton(onClick = onNextDay) {
                    Icon(Icons.Default.ChevronRight, "Next day")
                }
            }
        },
        navigationIcon = {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ChevronLeft, "Back")
            }
        },
        actions = {
            IconButton(onClick = onFilterClick) {
                Icon(Icons.Default.FilterList, "Filter calendars")
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = KinboardColorBgElevated
        )
    )
}

@Composable
fun CalendarContent(
    uiState: CalendarUiState,
    onViewTypeChange: (CalendarViewType) -> Unit,
    onDateSelect: (LocalDate) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(color = KinboardColorBg),
        contentPadding = PaddingValues(SpacingLg)
    ) {
        // View type selector
        item {
            ViewTypeSelector(
                selectedType = uiState.viewType,
                onTypeChange = onViewTypeChange,
                modifier = Modifier.padding(bottom = SpacingLg)
            )
        }

        // User completion stats (integrated in scroll, not separate horizontal scroll)
        if (uiState.userStats.isNotEmpty()) {
            item {
                UserStatsSection(
                    stats = uiState.userStats,
                    modifier = Modifier.padding(bottom = SpacingLg)
                )
            }
        }

        // Calendar view content
        when (uiState.viewType) {
            CalendarViewType.DAY -> {
                items(uiState.events) { event ->
                    EventCard(
                        event = event,
                        modifier = Modifier.padding(bottom = SpacingMd)
                    )
                }
                if (uiState.events.isEmpty()) {
                    item {
                        EmptyState(message = "No events scheduled")
                    }
                }
            }
            CalendarViewType.WEEK -> {
                item {
                    WeekView(
                        selectedDate = uiState.selectedDate,
                        events = uiState.events,
                        onDateSelect = onDateSelect
                    )
                }
            }
            CalendarViewType.MONTH -> {
                item {
                    MonthView(
                        selectedDate = uiState.selectedDate,
                        events = uiState.events,
                        onDateSelect = onDateSelect
                    )
                }
            }
        }
    }
}

@Composable
fun ViewTypeSelector(
    selectedType: CalendarViewType,
    onTypeChange: (CalendarViewType) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(size = RadiusMd))
            .background(color = KinboardColorSurface)
            .padding(SpacingXs),
        horizontalArrangement = Arrangement.spacedBy(SpacingXs)
    ) {
        CalendarViewType.values().forEach { type ->
            val isSelected = type == selectedType
            Button(
                onClick = { onTypeChange(type) },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isSelected) KinboardColorBgElevated else Color.Transparent,
                    contentColor = if (isSelected) KinboardColorText else KinboardColorTextSecondary
                ),
                elevation = if (isSelected) ButtonDefaults.buttonElevation(2.dp) else ButtonDefaults.buttonElevation(0.dp)
            ) {
                Text(type.name.lowercase().replaceFirstChar { it.uppercase() })
            }
        }
    }
}

@Composable
fun UserStatsSection(
    stats: List<UserCompletionStats>,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(
            text = "Completion Status",
            style = MaterialTheme.typography.titleSmall,
            color = KinboardColorTextSecondary,
            modifier = Modifier.padding(bottom = SpacingMd)
        )

        // Use FlowRow-like layout with wrapping
        stats.chunked(2).forEach { rowStats ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = SpacingMd),
                horizontalArrangement = Arrangement.spacedBy(SpacingMd)
            ) {
                rowStats.forEach { stat ->
                    UserStatCard(
                        stat = stat,
                        modifier = Modifier.weight(1f)
                    )
                }
                // Fill remaining space if odd number
                if (rowStats.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
fun UserStatCard(
    stat: UserCompletionStats,
    modifier: Modifier = Modifier
) {
    val userColor = try {
        Color(android.graphics.Color.parseColor(stat.colorHex))
    } catch (e: Exception) {
        KinboardColorPrimary
    }

    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = userColor.copy(alpha = 0.1f)
        ),
        shape = RoundedCornerShape(size = RadiusMd)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(SpacingMd),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(SpacingMd)
        ) {
            // Avatar
            if (stat.avatarUrl != null) {
                AsyncImage(
                    model = stat.avatarUrl,
                    contentDescription = stat.displayName,
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .border(2.dp, userColor, CircleShape)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(color = userColor),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = stat.displayName.firstOrNull()?.uppercase() ?: "?",
                        color = Color.White,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Name and stats
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = stat.displayName,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = KinboardColorText,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${stat.openJobs}/${stat.totalJobs}",
                    style = MaterialTheme.typography.bodySmall,
                    color = KinboardColorTextSecondary
                )
            }
        }
    }
}

@Composable
fun EventCard(
    event: CalendarEventItem,
    modifier: Modifier = Modifier
) {
    val eventColor = try {
        Color(android.graphics.Color.parseColor(event.colorHex))
    } catch (e: Exception) {
        KinboardColorPrimary
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = eventColor.copy(alpha = 0.1f)
        ),
        shape = RoundedCornerShape(size = RadiusMd)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(SpacingLg)
        ) {
            // Color indicator
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(48.dp)
                    .background(color = eventColor, shape = RoundedCornerShape(size = 2.dp))
            )

            Spacer(modifier = Modifier.width(SpacingLg))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = event.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = KinboardColorText,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(SpacingXs))
                Text(
                    text = formatEventTime(event),
                    style = MaterialTheme.typography.bodyMedium,
                    color = KinboardColorTextSecondary
                )
                if (event.sourceName.isNotBlank()) {
                    Spacer(modifier = Modifier.height(SpacingXs))
                    Text(
                        text = event.sourceName,
                        style = MaterialTheme.typography.bodySmall,
                        color = eventColor
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyState(
    message: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(SpacingXxl),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "📭",
            style = MaterialTheme.typography.displayMedium
        )
        Spacer(modifier = Modifier.height(SpacingLg))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = KinboardColorTextSecondary,
            textAlign = TextAlign.Center
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SourceFilterBottomSheet(
    sources: List<io.tyrongower.kinboard.data.model.CalendarSource>,
    selectedIds: Set<Int>,
    onToggleSource: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = KinboardColorBgElevated
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(SpacingLg)
        ) {
            Text(
                text = "Filter Calendars",
                style = MaterialTheme.typography.titleLarge,
                color = KinboardColorText,
                modifier = Modifier.padding(bottom = SpacingLg)
            )

            sources.forEach { source ->
                val sourceColor = try {
                    Color(android.graphics.Color.parseColor(source.colorHex))
                } catch (e: Exception) {
                    KinboardColorPrimary
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = SpacingMd),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = selectedIds.contains(source.id),
                        onCheckedChange = { onToggleSource(source.id) },
                        colors = CheckboxDefaults.colors(
                            checkedColor = sourceColor
                        )
                    )
                    Spacer(modifier = Modifier.width(SpacingMd))
                    Box(
                        modifier = Modifier
                            .size(16.dp)
                            .background(color = sourceColor, shape = CircleShape)
                    )
                    Spacer(modifier = Modifier.width(SpacingMd))
                    Text(
                        text = source.name,
                        style = MaterialTheme.typography.bodyLarge,
                        color = KinboardColorText
                    )
                }
            }

            Spacer(modifier = Modifier.height(SpacingLg))
        }
    }
}

// Helper function to format event time
private fun formatEventTime(event: CalendarEventItem): String {
    return if (event.allDay) {
        "All day"
    } else {
        val formatter = DateTimeFormatter.ofPattern("h:mm a")
        val start = java.time.LocalDateTime.parse(event.start, DateTimeFormatter.ISO_DATE_TIME)
        val end = java.time.LocalDateTime.parse(event.end, DateTimeFormatter.ISO_DATE_TIME)
        "${start.format(formatter)} – ${end.format(formatter)}"
    }
}

// Placeholder for WeekView - will implement in next file
@Composable
fun WeekView(
    selectedDate: LocalDate,
    events: List<CalendarEventItem>,
    onDateSelect: (LocalDate) -> Unit,
    modifier: Modifier = Modifier
) {
    Text(
        text = "Week view - Coming soon",
        modifier = modifier.padding(SpacingLg),
        color = KinboardColorTextSecondary
    )
}

// Placeholder for MonthView - will implement in next file
@Composable
fun MonthView(
    selectedDate: LocalDate,
    events: List<CalendarEventItem>,
    onDateSelect: (LocalDate) -> Unit,
    modifier: Modifier = Modifier
) {
    Text(
        text = "Month view - Coming soon",
        modifier = modifier.padding(SpacingLg),
        color = KinboardColorTextSecondary
    )
}
