package io.tyrongower.kinboard.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.graphics.toColorInt
import androidx.hilt.navigation.compose.hiltViewModel
import io.tyrongower.kinboard.data.model.CalendarSource
import io.tyrongower.kinboard.ui.admin.components.ColorPicker
import io.tyrongower.kinboard.ui.admin.components.ConfirmDialog
import io.tyrongower.kinboard.ui.theme.*
import io.tyrongower.kinboard.viewmodel.CalendarViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarAdminScreen(
    viewModel: CalendarViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    var editingSource by remember { mutableStateOf<CalendarSource?>(null) }
    var deletingSource by remember { mutableStateOf<CalendarSource?>(null) }

    Box(modifier = Modifier.fillMaxSize()) {
        if (state.isLoading && state.sources.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (state.sources.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(SpacingLg)
                ) {
                    Text("📅", style = MaterialTheme.typography.displayLarge)
                    Text(
                        "No Calendar Sources",
                        style = MaterialTheme.typography.headlineSmall
                    )
                    Text(
                        "Add your first calendar source",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Button(onClick = { showCreateDialog = true }) {
                        Icon(Icons.Default.Add, "Add")
                        Spacer(modifier = Modifier.width(SpacingSm))
                        Text("Add Calendar")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(SpacingLg),
                verticalArrangement = Arrangement.spacedBy(SpacingMd)
            ) {
                items(state.sources, key = { it.id }) { source ->
                    CalendarSourceCard(
                        source = source,
                        onEdit = { editingSource = source },
                        onDelete = { deletingSource = source },
                        onToggleEnabled = {
                            viewModel.updateSource(
                                source.id,
                                source.name,
                                source.icalUrl,
                                source.colorHex,
                                !source.enabled
                            )
                        }
                    )
                }
            }
        }

        // FAB
        FloatingActionButton(
            onClick = { showCreateDialog = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(SpacingLg)
        ) {
            Icon(Icons.Default.Add, "Add Calendar")
        }
    }

    // Create Dialog
    if (showCreateDialog) {
        CalendarSourceEditDialog(
            source = null,
            onDismiss = { showCreateDialog = false },
            onSave = { name, icalUrl, colorHex, enabled ->
                viewModel.createSource(name, icalUrl, colorHex, enabled)
                showCreateDialog = false
            },
            onTestUrl = { url -> viewModel.testIcalUrl(url) },
            testingUrl = state.testingUrl,
            testUrlResult = state.testUrlResult,
            onClearTestResult = { viewModel.clearTestResult() }
        )
    }

    // Edit Dialog
    editingSource?.let { source ->
        CalendarSourceEditDialog(
            source = source,
            onDismiss = { editingSource = null },
            onSave = { name, icalUrl, colorHex, enabled ->
                viewModel.updateSource(source.id, name, icalUrl, colorHex, enabled)
                editingSource = null
            },
            onTestUrl = { url -> viewModel.testIcalUrl(url) },
            testingUrl = state.testingUrl,
            testUrlResult = state.testUrlResult,
            onClearTestResult = { viewModel.clearTestResult() }
        )
    }

    // Delete Confirmation
    deletingSource?.let { source ->
        ConfirmDialog(
            title = "Delete Calendar Source",
            message = "Delete \"${source.name}\"? This action cannot be undone.",
            confirmText = "Delete",
            onConfirm = {
                viewModel.deleteSource(source.id)
            },
            onDismiss = { deletingSource = null }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarSourceCard(
    source: CalendarSource,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onToggleEnabled: () -> Unit
) {
    val sourceColor = try {
        Color(source.colorHex.toColorInt())
    } catch (e: Exception) {
        ColorPrimary
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(SpacingLg),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(SpacingMd)
        ) {
            // Color indicator
            Box(
                modifier = Modifier
                    .size(AvatarMd)
                    .clip(CircleShape)
                    .background(sourceColor)
            )

            // Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = source.name,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = source.icalUrl,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (!source.enabled) {
                    Text(
                        text = "Disabled",
                        style = MaterialTheme.typography.labelSmall,
                        color = ColorWarning
                    )
                }
            }

            // Actions
            Switch(
                checked = source.enabled,
                onCheckedChange = { onToggleEnabled() }
            )
            IconButton(onClick = onEdit) {
                Icon(Icons.Default.Edit, "Edit", tint = ColorPrimary)
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, "Delete", tint = ColorError)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarSourceEditDialog(
    source: CalendarSource?,
    onDismiss: () -> Unit,
    onSave: (name: String, icalUrl: String, colorHex: String, enabled: Boolean) -> Unit,
    onTestUrl: (String) -> Unit,
    testingUrl: Boolean,
    testUrlResult: String?,
    onClearTestResult: () -> Unit
) {
    var name by remember { mutableStateOf(source?.name ?: "") }
    var icalUrl by remember { mutableStateOf(source?.icalUrl ?: "") }
    var colorHex by remember { mutableStateOf(source?.colorHex ?: "#3B82F6") }
    var enabled by remember { mutableStateOf(source?.enabled ?: true) }
    var nameError by remember { mutableStateOf<String?>(null) }
    var urlError by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = {
            onClearTestResult()
            onDismiss()
        },
        title = { Text(if (source == null) "Add Calendar Source" else "Edit Calendar Source") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(SpacingMd),
                modifier = Modifier.fillMaxWidth()
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        nameError = if (it.isBlank()) "Name is required" else null
                    },
                    label = { Text("Name") },
                    isError = nameError != null,
                    supportingText = nameError?.let { { Text(it, color = ColorError) } },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = icalUrl,
                    onValueChange = {
                        icalUrl = it
                        urlError = when {
                            it.isBlank() -> "URL is required"
                            !it.startsWith("http://") && !it.startsWith("https://") ->
                                "URL must start with http:// or https://"
                            else -> null
                        }
                        onClearTestResult()
                    },
                    label = { Text("iCal URL") },
                    isError = urlError != null,
                    supportingText = urlError?.let { { Text(it, color = ColorError) } },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    trailingIcon = {
                        if (testingUrl) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                        } else {
                            IconButton(
                                onClick = { onTestUrl(icalUrl) },
                                enabled = icalUrl.isNotBlank() && urlError == null
                            ) {
                                Icon(Icons.Default.CheckCircle, "Test URL")
                            }
                        }
                    }
                )

                // Test result
                testUrlResult?.let { result ->
                    Text(
                        text = result,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (result.contains("valid", ignoreCase = true))
                            ColorSuccess else ColorError
                    )
                }

                ColorPicker(
                    selectedColor = colorHex,
                    onColorSelected = { colorHex = it },
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Enabled", style = MaterialTheme.typography.bodyMedium)
                    Switch(
                        checked = enabled,
                        onCheckedChange = { enabled = it }
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    when {
                        name.isBlank() -> nameError = "Name is required"
                        icalUrl.isBlank() -> urlError = "URL is required"
                        !icalUrl.startsWith("http://") && !icalUrl.startsWith("https://") ->
                            urlError = "URL must start with http:// or https://"
                        else -> {
                            onSave(name.trim(), icalUrl.trim(), colorHex, enabled)
                            onClearTestResult()
                        }
                    }
                }
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = {
                onClearTestResult()
                onDismiss()
            }) {
                Text("Cancel")
            }
        }
    )
}
