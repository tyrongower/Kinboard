package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kinboard.tv.data.model.Job
import com.kinboard.tv.data.model.JobAssignment
import com.kinboard.tv.data.model.User

data class StoneData(val job: Job, val asg: JobAssignment)

@Composable
fun KidLane(
    kid: User,
    jobs: List<Job>,
    laneIndex: Int,
    isAnyFocused: Boolean,
    focusedStoneIndex: Int,
    onFocusStone: (Int) -> Unit,
    onToggleStone: (Job, JobAssignment) -> Unit,
    modifier: Modifier = Modifier
) {
    val (stones, doneCount, totalCount) = remember(jobs, kid) { buildLaneData(jobs, kid) }
    val showStrip = stones.isNotEmpty()

    Box(modifier.focusGroup()) {
        if (showStrip) {
            LanePathStrip(
                laneIndex = laneIndex,
                modifier = Modifier
                    .matchParentSize()
                    .padding(start = 280.dp, end = 60.dp)
            )
        }
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 60.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            KidLaneCard(
                kid = kid,
                doneCount = doneCount,
                totalCount = totalCount,
                laneIndex = laneIndex,
                modifier = Modifier.width(200.dp)
            )
            Spacer(Modifier.width(20.dp))
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight(),
                contentAlignment = Alignment.Center
            ) {
                when {
                    totalCount == 0 -> NoJobsToday()
                    stones.isEmpty() -> AllDoneBanner(kid = kid)
                    else -> StonePath(
                        stones = stones,
                        kid = kid,
                        isLaneFocused = isAnyFocused,
                        focusedStoneIndex = focusedStoneIndex,
                        onFocusStone = onFocusStone,
                        onToggleStone = onToggleStone,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }
}

private fun buildLaneData(jobs: List<Job>, kid: User): Triple<List<StoneData>, Int, Int> {
    val visible = mutableListOf<StoneData>()
    var done = 0
    var total = 0
    val ordered = jobs.sortedWith(compareBy({ it.displayOrder }, { it.id }))
    for (j in ordered) {
        for (a in j.assignments.orEmpty()) {
            if (a.userId != kid.id) continue
            total += 1
            val isDone = a.isCompleted == true
            if (isDone) done += 1
            if (isDone && kid.hideCompletedInKiosk == true) continue
            visible += StoneData(j, a)
        }
    }
    return Triple(visible, done, total)
}
