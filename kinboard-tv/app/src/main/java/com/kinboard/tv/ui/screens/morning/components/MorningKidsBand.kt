package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kinboard.tv.ui.viewmodel.MorningPathViewModel
import com.kinboard.tv.ui.viewmodel.MorningUiState

@Composable
fun MorningKidsBand(
    state: MorningUiState,
    vm: MorningPathViewModel,
    modifier: Modifier = Modifier
) {
    val kids = state.users.filter { it.id > 0 }.take(2)
    if (kids.isEmpty()) return
    Column(
        modifier = modifier.focusGroup(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        kids.forEachIndexed { laneIndex, kid ->
            KidLane(
                kid = kid,
                jobs = state.jobs,
                laneIndex = laneIndex,
                isAnyFocused = state.focusedKidIndex == laneIndex,
                focusedStoneIndex = state.focusedStoneIndex,
                onFocusStone = { stoneIdx -> vm.setFocus(laneIndex, stoneIdx) },
                onToggleStone = { job, asg -> vm.toggleAssignment(job, asg) },
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            )
        }
    }
}
