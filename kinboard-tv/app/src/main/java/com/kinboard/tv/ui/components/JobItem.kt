package com.kinboard.tv.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Icon
import androidx.tv.material3.Surface
import androidx.tv.material3.Text
import com.kinboard.tv.R
import com.kinboard.tv.data.model.Job
import com.kinboard.tv.data.model.JobAssignment
import com.kinboard.tv.ui.theme.*

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun JobItem(
    job: Job,
    assignment: JobAssignment,
    userColorHex: String,
    onToggleComplete: () -> Unit,
    focusRequester: FocusRequester? = null,
    modifier: Modifier = Modifier
) {
    val isCompleted = assignment.isCompleted == true
    val userColor = try {
        Color(android.graphics.Color.parseColor(userColorHex))
    } catch (e: Exception) {
        DefaultUserColor
    }

    Surface(
        onClick = onToggleComplete,
        modifier = modifier
            .fillMaxWidth()
            .alpha(if (isCompleted) 0.6f else 1f)
            .then(if (focusRequester != null) Modifier.focusRequester(focusRequester) else Modifier),
        shape = ClickableSurfaceDefaults.shape(
            shape = RoundedCornerShape(BorderRadius.md)
        ),
        colors = ClickableSurfaceDefaults.colors(
            containerColor = Surface,
            focusedContainerColor = ElevationLevel3,
            contentColor = OnSurface,
            focusedContentColor = OnSurface
        ),
        scale = ClickableSurfaceDefaults.scale(
            focusedScale = 1.02f
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Spacing.sm),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Job Image (optional)
            if (job.imageUrl != null) {
                JobImage(
                    imageUrl = job.imageUrl,
                    jobTitle = job.title,
                    modifier = Modifier.padding(end = Spacing.md)
                )
            }

            // Text Container
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = job.title,
                    style = KinboardTypography.bodyMedium.copy(
                        textDecoration = if (isCompleted) TextDecoration.LineThrough else TextDecoration.None
                    ),
                    color = if (isCompleted) OnSurfaceVariant else OnSurface
                )

                if (job.description != null) {
                    Text(
                        text = job.description,
                        style = KinboardTypography.bodySmall,
                        color = OnSurfaceVariant,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
            }

            // Checkbox Icon
            Icon(
                painter = painterResource(
                    id = if (isCompleted) R.drawable.ic_checkbox_checked else R.drawable.ic_checkbox_unchecked
                ),
                contentDescription = if (isCompleted) {
                    "Mark ${job.title} as not completed"
                } else {
                    "Mark ${job.title} as completed"
                },
                modifier = Modifier.size(ComponentSize.checkboxSize),
                tint = if (isCompleted) userColor else OnSurfaceVariant
            )
        }
    }
}
