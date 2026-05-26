package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.unit.dp
import com.kinboard.tv.data.model.Job
import com.kinboard.tv.data.model.JobAssignment
import com.kinboard.tv.data.model.User

@Composable
fun StonePath(
    stones: List<StoneData>,
    kid: User,
    isLaneFocused: Boolean,
    focusedStoneIndex: Int,
    onFocusStone: (Int) -> Unit,
    onToggleStone: (Job, JobAssignment) -> Unit,
    modifier: Modifier = Modifier
) {
    BoxWithConstraints(modifier) {
        val count = stones.size
        if (count == 0) return@BoxWithConstraints
        val slot = maxWidth / count
        val stoneSize = minOf(120.dp, (slot - 12.dp).coerceAtLeast(60.dp))
        val focusReqs = remember(count) { List(count) { FocusRequester() } }

        LaunchedEffect(isLaneFocused, count) {
            if (isLaneFocused) {
                val idx = focusedStoneIndex.coerceIn(0, count - 1)
                runCatching { focusReqs[idx].requestFocus() }
            }
        }

        Row(
            modifier = Modifier.fillMaxSize(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            stones.forEachIndexed { i, sd ->
                Box(
                    Modifier.width(slot).fillMaxHeight(),
                    contentAlignment = Alignment.Center
                ) {
                    StoneTile(
                        data = sd,
                        kid = kid,
                        size = stoneSize,
                        isNext = i == 0,
                        showWalker = i == 0,
                        focusRequester = focusReqs[i],
                        onFocused = { onFocusStone(i) },
                        onToggle = { onToggleStone(sd.job, sd.asg) }
                    )
                }
            }
        }
    }
}
