package io.tyrongower.kinboard.ui.admin.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.core.graphics.toColorInt
import io.tyrongower.kinboard.ui.theme.*

// Preset colors for color picker
val PresetColors = listOf(
    "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
    "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
    "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF",
    "#EC4899", "#F43F5E", "#64748B", "#6B7280", "#78716C"
)

@Composable
fun ColorPicker(
    selectedColor: String,
    onColorSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var customColorInput by remember { mutableStateOf("") }
    var showCustomInput by remember { mutableStateOf(false) }

    Column(modifier = modifier) {
        Text(
            text = "Color",
            style = MaterialTheme.typography.labelLarge,
            modifier = Modifier.padding(bottom = SpacingSm)
        )

        // Preset colors grid
        LazyVerticalGrid(
            columns = GridCells.Fixed(5),
            horizontalArrangement = Arrangement.spacedBy(SpacingSm),
            verticalArrangement = Arrangement.spacedBy(SpacingSm),
            modifier = Modifier.height(200.dp)
        ) {
            items(PresetColors) { colorHex ->
                ColorSwatch(
                    colorHex = colorHex,
                    isSelected = selectedColor.equals(colorHex, ignoreCase = true),
                    onClick = { onColorSelected(colorHex) }
                )
            }
        }

        Spacer(modifier = Modifier.height(SpacingMd))

        // Custom color input
        if (showCustomInput) {
            OutlinedTextField(
                value = customColorInput,
                onValueChange = { customColorInput = it },
                label = { Text("Custom Hex Color") },
                placeholder = { Text("#RRGGBB") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                trailingIcon = {
                    TextButton(
                        onClick = {
                            if (customColorInput.matches(Regex("^#[0-9A-Fa-f]{6}$"))) {
                                onColorSelected(customColorInput.uppercase())
                                customColorInput = ""
                                showCustomInput = false
                            }
                        }
                    ) {
                        Text("Apply")
                    }
                }
            )
        } else {
            TextButton(
                onClick = { showCustomInput = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Enter Custom Color")
            }
        }

        // Selected color preview
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = SpacingMd),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(SpacingSm)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(
                        try {
                            Color(selectedColor.toColorInt())
                        } catch (e: Exception) {
                            ColorPrimary
                        }
                    )
            )
            Text(
                text = "Selected: $selectedColor",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun ColorSwatch(
    colorHex: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val color = try {
        Color(colorHex.toColorInt())
    } catch (e: Exception) {
        ColorPrimary
    }

    Box(
        modifier = modifier
            .size(48.dp)
            .clip(CircleShape)
            .background(color)
            .then(
                if (isSelected) {
                    Modifier.border(3.dp, MaterialTheme.colorScheme.primary, CircleShape)
                } else {
                    Modifier.border(1.dp, ColorDivider, CircleShape)
                }
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        if (isSelected) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = "Selected",
                tint = Color.White,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

@Composable
fun ConfirmDialog(
    title: String,
    message: String,
    confirmText: String = "Delete",
    dismissText: String = "Cancel",
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(message) },
        confirmButton = {
            TextButton(
                onClick = {
                    onConfirm()
                    onDismiss()
                }
            ) {
                Text(confirmText, color = ColorError)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(dismissText)
            }
        }
    )
}

@Composable
fun LoadingOverlay() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.5f)),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}
