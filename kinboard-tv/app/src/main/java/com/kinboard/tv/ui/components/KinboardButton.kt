package com.kinboard.tv.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Border
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Icon
import androidx.tv.material3.IconButton
import androidx.tv.material3.IconButtonDefaults
import androidx.tv.material3.Text
import com.kinboard.tv.ui.theme.*

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun KinboardButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(ComponentSize.buttonHeight),
        enabled = enabled,
        shape = ButtonDefaults.shape(
            shape = RoundedCornerShape(BorderRadius.md)
        ),
        colors = ButtonDefaults.colors(
            containerColor = Primary,
            contentColor = OnPrimary,
            focusedContainerColor = Primary,
            focusedContentColor = OnPrimary,
            disabledContainerColor = SurfaceDisabled,
            disabledContentColor = OnSurfaceDisabled
        ),
        border = ButtonDefaults.border(
            focusedBorder = Border(
                border = BorderStroke(2.dp, Primary),
                shape = RoundedCornerShape(BorderRadius.md)
            )
        ),
        contentPadding = PaddingValues(horizontal = Spacing.lg, vertical = Spacing.sm)
    ) {
        Text(
            text = text,
            style = KinboardTypography.titleMedium
        )
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun KinboardOutlinedButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(ComponentSize.buttonHeight),
        enabled = enabled,
        shape = ButtonDefaults.shape(
            shape = RoundedCornerShape(BorderRadius.md)
        ),
        colors = ButtonDefaults.colors(
            containerColor = Color.Transparent,
            contentColor = OnSurface,
            focusedContainerColor = ElevationLevel3,
            focusedContentColor = OnSurface,
            disabledContainerColor = Color.Transparent,
            disabledContentColor = OnSurfaceDisabled
        ),
        border = ButtonDefaults.border(
            border = Border(
                border = BorderStroke(1.dp, BorderSubtle),
                shape = RoundedCornerShape(BorderRadius.md)
            ),
            focusedBorder = Border(
                border = BorderStroke(2.dp, Primary),
                shape = RoundedCornerShape(BorderRadius.md)
            )
        ),
        contentPadding = PaddingValues(horizontal = Spacing.lg, vertical = Spacing.sm)
    ) {
        Text(
            text = text,
            style = KinboardTypography.titleMedium
        )
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun KinboardIconButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    contentDescription: String? = null,
    focusRequester: FocusRequester? = null,
    content: @Composable () -> Unit
) {
    IconButton(
        onClick = onClick,
        modifier = modifier
            .size(ComponentSize.iconButtonSize)
            .then(if (focusRequester != null) Modifier.focusRequester(focusRequester) else Modifier),
        enabled = enabled,
        colors = IconButtonDefaults.colors(
            containerColor = Color.Transparent,
            contentColor = OnSurface,
            focusedContainerColor = ElevationLevel3,
            focusedContentColor = OnSurface,
            disabledContainerColor = Color.Transparent,
            disabledContentColor = OnSurfaceDisabled
        ),
        border = IconButtonDefaults.border(
            border = Border(
                border = BorderStroke(1.dp, BorderSubtle),
                shape = RoundedCornerShape(BorderRadius.md)
            ),
            focusedBorder = Border(
                border = BorderStroke(2.dp, Primary),
                shape = RoundedCornerShape(BorderRadius.md)
            )
        ),
        shape = IconButtonDefaults.shape(
            shape = RoundedCornerShape(BorderRadius.md)
        )
    ) {
        content()
    }
}
