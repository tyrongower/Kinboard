package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import com.kinboard.tv.ui.theme.MorningInk
import com.kinboard.tv.ui.theme.MorningRed
import com.kinboard.tv.ui.theme.MorningType

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun OfflinePill(modifier: Modifier = Modifier) {
    Row(
        modifier
            .background(Color.White, RoundedCornerShape(12.dp))
            .border(2.dp, MorningInk, RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(
            Modifier
                .size(10.dp)
                .background(MorningRed, CircleShape),
        )
        Text(
            text = "OFFLINE",
            style = MorningType.quicksand(14f, FontWeight.ExtraBold).copy(
                color = MorningInk,
                letterSpacing = 0.18.em,
            ),
        )
    }
}
