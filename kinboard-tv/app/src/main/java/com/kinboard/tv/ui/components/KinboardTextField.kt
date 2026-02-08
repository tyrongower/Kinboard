package com.kinboard.tv.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import com.kinboard.tv.ui.theme.*

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun KinboardTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String? = null,
    isPassword: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: () -> Unit = {},
    enabled: Boolean = true,
    isError: Boolean = false
) {
    var isFocused by remember { mutableStateOf(false) }
    
    Column(modifier = modifier) {
        if (label != null) {
            Text(
                text = label,
                style = KinboardTypography.labelMedium,
                color = if (isError) Error else OnSurfaceVariant,
                modifier = Modifier.padding(bottom = Spacing.xs)
            )
        }
        
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    color = if (enabled) Surface else SurfaceDisabled,
                    shape = RoundedCornerShape(BorderRadius.md)
                )
                .border(
                    border = BorderStroke(
                        width = if (isFocused) 2.dp else 1.dp,
                        color = when {
                            isError -> Error
                            isFocused -> Primary
                            else -> Outline
                        }
                    ),
                    shape = RoundedCornerShape(BorderRadius.md)
                )
                .padding(horizontal = Spacing.lg, vertical = Spacing.md)
        ) {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .onFocusChanged { focusState ->
                        isFocused = focusState.isFocused
                    },
                enabled = enabled,
                textStyle = KinboardTypography.bodyLarge.copy(
                    color = if (enabled) OnSurface else OnSurfaceDisabled
                ),
                keyboardOptions = KeyboardOptions(
                    keyboardType = keyboardType,
                    imeAction = imeAction
                ),
                keyboardActions = KeyboardActions(
                    onDone = { onImeAction() },
                    onNext = { onImeAction() },
                    onGo = { onImeAction() }
                ),
                singleLine = true,
                visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
                cursorBrush = SolidColor(Primary),
                decorationBox = { innerTextField ->
                    Box {
                        if (value.isEmpty() && placeholder != null) {
                            Text(
                                text = placeholder,
                                style = KinboardTypography.bodyLarge,
                                color = OnSurfaceVariant
                            )
                        }
                        innerTextField()
                    }
                }
            )
        }
    }
}
