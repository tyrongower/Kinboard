package com.kinboard.tv.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import com.kinboard.tv.data.model.CalendarEvent
import com.kinboard.tv.data.model.Job
import com.kinboard.tv.data.model.JobAssignment
import com.kinboard.tv.data.model.User
import com.kinboard.tv.data.model.WeatherData
import com.kinboard.tv.ui.components.KinboardOutlinedButton
import com.kinboard.tv.ui.components.PersonJobCard
import com.kinboard.tv.ui.components.TodayCalendarCard
import com.kinboard.tv.ui.components.UserJobData
import com.kinboard.tv.ui.components.WeatherWidget
import com.kinboard.tv.ui.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private const val PANEL_PERSON_ID = -100
private const val PANEL_CALENDAR_ID = -101
private val PERSON_CARD_WIDTH = 342.dp

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun JobsScreen(
    selectedDate: LocalDate,
    userJobsData: List<UserJobData>,
    hideCompletedMap: Map<Int, Boolean>,
    isLoading: Boolean,
    errorMessage: String?,
    focusedUserId: Int?,
    weather: WeatherData?,
    isWeatherLoading: Boolean,
    currentTime: String,
    calendarEvents: List<CalendarEvent>,
    isCalendarLoading: Boolean,
    onPrevDay: () -> Unit,
    onToday: () -> Unit,
    onNextDay: () -> Unit,
    onToggleHideCompleted: (User) -> Unit,
    onToggleJobComplete: (Job, JobAssignment, String) -> Unit,
    onFocusedUserChange: (Int) -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dateFormatter = remember { DateTimeFormatter.ofPattern("EEEE, MMM d", Locale.getDefault()) }
    val formattedDate = selectedDate.format(dateFormatter)

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Background)
            .padding(Layout.screenPadding)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = Layout.headerMarginBottom),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Jobs",
                        style = KinboardTypography.headlineLarge,
                        color = OnBackground
                    )
                    Text(
                        text = formattedDate,
                        style = KinboardTypography.titleLarge,
                        color = OnBackground,
                        modifier = Modifier.alpha(0.9f)
                    )
                }

                WeatherWidget(
                    weather = weather,
                    isLoading = isWeatherLoading,
                    currentTime = currentTime
                )

                Row(horizontalArrangement = Arrangement.spacedBy(Layout.buttonGap)) {
                    KinboardOutlinedButton(text = "Prev", onClick = onPrevDay)
                    KinboardOutlinedButton(text = "Today", onClick = onToday)
                    KinboardOutlinedButton(text = "Next", onClick = onNextDay)
                }
            }

            when {
                isLoading && userJobsData.isEmpty() && calendarEvents.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Loading...",
                            style = KinboardTypography.titleMedium,
                            color = OnSurfaceVariant
                        )
                    }
                }

                errorMessage != null -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = errorMessage,
                                style = KinboardTypography.titleMedium,
                                color = Error
                            )
                            Spacer(modifier = Modifier.height(Spacing.lg))
                            KinboardOutlinedButton(text = "Retry", onClick = onRetry)
                        }
                    }
                }

                else -> {
                    val userIds = remember(userJobsData) { userJobsData.map { it.user.id } }
                    val focusRequesters = remember(userIds) {
                        userIds.associateWith { FocusRequester() }
                    }
                    val calendarFocusRequester = remember { FocusRequester() }

                    val targetUserId = focusedUserId
                        ?: userJobsData.firstOrNull()?.user?.id

                    LaunchedEffect(userIds, targetUserId, focusedUserId) {
                        when {
                            focusedUserId == PANEL_CALENDAR_ID -> calendarFocusRequester.requestFocus()
                            targetUserId != null -> focusRequesters[targetUserId]?.requestFocus()
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(bottom = Spacing.sm),
                        horizontalArrangement = Arrangement.spacedBy(Layout.cardGap)
                    ) {
                        userJobsData.forEach { userJobData ->
                            val focusRequester = focusRequesters[userJobData.user.id]
                            PersonJobCard(
                                userJobData = userJobData,
                                hideCompleted = hideCompletedMap[userJobData.user.id] ?: false,
                                onToggleHideCompleted = { onToggleHideCompleted(userJobData.user) },
                                onToggleJobComplete = { job, assignment ->
                                    onToggleJobComplete(job, assignment, selectedDate.toString())
                                },
                                onFocused = { onFocusedUserChange(userJobData.user.id) },
                                modifier = Modifier
                                    .width(PERSON_CARD_WIDTH)
                                    .fillMaxHeight()
                                    .then(
                                        if (focusRequester != null) Modifier.focusRequester(focusRequester)
                                        else Modifier
                                    )
                            )
                        }

                        TodayCalendarCard(
                            events = calendarEvents,
                            selectedDate = selectedDate,
                            isLoading = isCalendarLoading,
                            onFocused = { onFocusedUserChange(PANEL_CALENDAR_ID) },
                            focusRequester = calendarFocusRequester,
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                        )
                    }
                }
            }
        }
    }
}
