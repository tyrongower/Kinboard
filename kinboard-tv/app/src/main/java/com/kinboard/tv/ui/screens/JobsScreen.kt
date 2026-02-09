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
import androidx.tv.foundation.lazy.list.TvLazyRow
import androidx.tv.foundation.lazy.list.items
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import com.kinboard.tv.data.model.Job
import com.kinboard.tv.data.model.JobAssignment
import com.kinboard.tv.data.model.User
import com.kinboard.tv.data.model.WeatherData
import com.kinboard.tv.ui.components.KinboardOutlinedButton
import com.kinboard.tv.ui.components.PersonJobCard
import com.kinboard.tv.ui.components.UserJobData
import com.kinboard.tv.ui.components.WeatherWidget
import com.kinboard.tv.ui.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

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
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Header Section
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = Layout.headerMarginBottom),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Title and Date
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

                // Weather Widget
                WeatherWidget(
                    weather = weather,
                    isLoading = isWeatherLoading,
                    currentTime = currentTime
                )

                // Date Navigation Buttons
                Row(
                    horizontalArrangement = Arrangement.spacedBy(Layout.buttonGap)
                ) {
                    KinboardOutlinedButton(
                        text = "Prev",
                        onClick = onPrevDay
                    )
                    KinboardOutlinedButton(
                        text = "Today",
                        onClick = onToday
                    )
                    KinboardOutlinedButton(
                        text = "Next",
                        onClick = onNextDay
                    )
                }
            }

            // Content Area
            when {
                isLoading -> {
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
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = errorMessage,
                                style = KinboardTypography.titleMedium,
                                color = Error
                            )
                            Spacer(modifier = Modifier.height(Spacing.lg))
                            KinboardOutlinedButton(
                                text = "Retry",
                                onClick = onRetry
                            )
                        }
                    }
                }

                userJobsData.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No jobs for this date",
                            style = KinboardTypography.titleMedium,
                            color = OnSurfaceVariant
                        )
                    }
                }

                else -> {
                    // Create a stable key based on user IDs to detect when the user list changes
                    val userIds = remember(userJobsData) { userJobsData.map { it.user.id } }

                    // Create FocusRequesters for each user card
                    val focusRequesters = remember(userIds) {
                        userIds.associateWith { FocusRequester() }
                    }

                    // Determine which user should be focused (stored focusedUserId or first user)
                    val targetUserId = focusedUserId ?: userJobsData.firstOrNull()?.user?.id

                    // Request focus on the target card only when user list changes (not on job data updates)
                    LaunchedEffect(userIds, targetUserId) {
                        if (targetUserId != null) {
                            focusRequesters[targetUserId]?.requestFocus()
                        }
                    }

                    // Person Cards - Horizontal Layout (4 cards across)
                    // Using TvLazyRow for proper TV focus-based scrolling behavior
                    TvLazyRow(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(bottom = Spacing.sm),
                        horizontalArrangement = Arrangement.spacedBy(Layout.cardGap),
                        contentPadding = PaddingValues(horizontal = Layout.screenPadding)
                    ) {
                        items(
                            items = userJobsData,
                            key = { it.user.id }
                        ) { userJobData ->
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
                                    .width(320.dp)
                                    .fillMaxHeight()
                                    .then(
                                        if (focusRequester != null) Modifier.focusRequester(focusRequester)
                                        else Modifier
                                    )
                            )
                        }
                    }
                }
            }
        }
    }
}
