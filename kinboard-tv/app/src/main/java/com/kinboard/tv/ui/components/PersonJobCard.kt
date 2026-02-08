package com.kinboard.tv.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Icon
import androidx.tv.material3.Text
import com.kinboard.tv.R
import com.kinboard.tv.data.model.Job
import com.kinboard.tv.data.model.JobAssignment
import com.kinboard.tv.data.model.User
import com.kinboard.tv.ui.theme.*

data class UserJobData(
    val user: User,
    val jobs: List<Pair<Job, JobAssignment>>,
    val completedCount: Int,
    val totalCount: Int
)

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun PersonJobCard(
    userJobData: UserJobData,
    hideCompleted: Boolean,
    onToggleHideCompleted: () -> Unit,
    onToggleJobComplete: (Job, JobAssignment) -> Unit,
    onFocused: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val user = userJobData.user
    val userColor = try {
        Color(android.graphics.Color.parseColor(user.colorHex))
    } catch (e: Exception) {
        DefaultUserColor
    }

    var isCardFocused by remember { mutableStateOf(false) }

    // FocusRequester for the toggle button
    val toggleButtonFocusRequester = remember { FocusRequester() }

    // Create FocusRequesters for each job item (keyed by job-assignment id)
    val jobFocusRequesters = remember(userJobData.jobs) {
        userJobData.jobs.associate { (job, assignment) ->
            "${job.id}-${assignment.id}" to FocusRequester()
        }
    }

    // Track pending focus request after toggle
    var pendingFocusKey by remember { mutableStateOf<String?>(null) }
    var shouldFocusToggle by remember { mutableStateOf(false) }

    val visibleJobs = if (hideCompleted) {
        userJobData.jobs.filter { (_, assignment) -> assignment.isCompleted != true }
    } else {
        userJobData.jobs
    }

    val progress = if (userJobData.totalCount > 0) {
        userJobData.completedCount.toFloat() / userJobData.totalCount.toFloat()
    } else {
        0f
    }

    // Handle pending focus requests after toggle actions
    LaunchedEffect(pendingFocusKey) {
        if (pendingFocusKey != null) {
            jobFocusRequesters[pendingFocusKey]?.requestFocus()
            pendingFocusKey = null
        }
    }

    LaunchedEffect(shouldFocusToggle) {
        if (shouldFocusToggle) {
            toggleButtonFocusRequester.requestFocus()
            shouldFocusToggle = false
        }
    }

    // Card wrapper with focus border
    Box(
        modifier = modifier
            .onFocusChanged { focusState ->
                isCardFocused = focusState.hasFocus
                if (focusState.hasFocus) {
                    onFocused()
                }
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
        // Card content with left border
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(BorderRadius.md))
                .background(Surface)
                .drawBehind {
                    // Draw left border
                    drawLine(
                        color = userColor,
                        start = Offset(0f, 0f),
                        end = Offset(0f, size.height),
                        strokeWidth = ComponentSize.cardLeftBorder.toPx()
                    )
                }
                .padding(start = ComponentSize.cardLeftBorder + Spacing.md, top = Spacing.md, end = Spacing.md, bottom = Spacing.md)
        ) {
            Column {
                // Card Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = Spacing.md),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Avatar
                    UserAvatar(
                        displayName = user.displayName,
                        colorHex = user.colorHex,
                        avatarUrl = user.avatarUrl
                    )

                    // User Info
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = Spacing.md)
                    ) {
                        Text(
                            text = user.displayName,
                            style = KinboardTypography.titleMedium,
                            color = OnSurface
                        )
                        Text(
                            text = "${userJobData.completedCount} of ${userJobData.totalCount} completed",
                            style = KinboardTypography.bodySmall,
                            color = OnSurfaceVariant
                        )
                    }

                    // Hide/Show Toggle Button
                    KinboardIconButton(
                        onClick = onToggleHideCompleted,
                        contentDescription = if (hideCompleted) {
                            "Show completed for ${user.displayName}"
                        } else {
                            "Hide completed for ${user.displayName}"
                        },
                        focusRequester = toggleButtonFocusRequester
                    ) {
                        Icon(
                            painter = painterResource(
                                id = if (hideCompleted) R.drawable.ic_eye_off else R.drawable.ic_eye
                            ),
                            contentDescription = null,
                            modifier = Modifier.size(ComponentSize.iconDefault),
                            tint = OnSurface
                        )
                    }
                }

                // Progress Bar
                JobProgressBar(
                    progress = progress,
                    colorHex = user.colorHex,
                    modifier = Modifier.padding(bottom = Spacing.md)
                )

                // Jobs List or Empty State
                if (visibleJobs.isEmpty()) {
                    // Empty state
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = Spacing.xxl),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "✓ All done!",
                            style = KinboardTypography.titleMedium,
                            color = Secondary
                        )
                    }
                } else {
                    // Jobs list
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(Spacing.sm)
                    ) {
                        itemsIndexed(
                            items = visibleJobs,
                            key = { _, (job, assignment) -> "${job.id}-${assignment.id}" }
                        ) { index, (job, assignment) ->
                            val itemKey = "${job.id}-${assignment.id}"
                            JobItem(
                                job = job,
                                assignment = assignment,
                                userColorHex = user.colorHex,
                                onToggleComplete = {
                                    // Determine where focus should go after toggle
                                    val isCurrentlyCompleted = assignment.isCompleted == true
                                    val willBeHiddenAfterToggle = hideCompleted && !isCurrentlyCompleted

                                    if (willBeHiddenAfterToggle) {
                                        // Item will be hidden after completion
                                        // Find the next item to focus, or focus toggle button if no items left
                                        val remainingAfterToggle = visibleJobs.filterIndexed { i, _ -> i != index }
                                        if (remainingAfterToggle.isEmpty()) {
                                            // No items left, focus toggle button
                                            shouldFocusToggle = true
                                        } else {
                                            // Focus next item (or previous if this was the last)
                                            val nextIndex = if (index < remainingAfterToggle.size) index else index - 1
                                            val nextItem = remainingAfterToggle.getOrNull(nextIndex.coerceAtLeast(0))
                                            if (nextItem != null) {
                                                pendingFocusKey = "${nextItem.first.id}-${nextItem.second.id}"
                                            }
                                        }
                                    }
                                    // Otherwise, focus stays on current item naturally (no need to set pendingFocusKey)
                                    onToggleJobComplete(job, assignment)
                                },
                                focusRequester = jobFocusRequesters[itemKey]
                            )
                        }
                    }
                }
            }
        }
    }
}
