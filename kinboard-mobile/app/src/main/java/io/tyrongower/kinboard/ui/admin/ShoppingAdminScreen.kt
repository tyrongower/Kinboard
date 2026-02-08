package io.tyrongower.kinboard.ui.admin

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.graphics.toColorInt
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import io.tyrongower.kinboard.data.model.ShoppingList
import io.tyrongower.kinboard.ui.admin.components.ColorPicker
import io.tyrongower.kinboard.ui.admin.components.ConfirmDialog
import io.tyrongower.kinboard.ui.theme.*
import io.tyrongower.kinboard.viewmodel.ShoppingViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingAdminScreen(
    viewModel: ShoppingViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showCreateDialog by remember { mutableStateOf(false) }
    var editingList by remember { mutableStateOf<ShoppingList?>(null) }
    var deletingList by remember { mutableStateOf<ShoppingList?>(null) }

    Box(modifier = Modifier.fillMaxSize()) {
        if (state.isLoading && state.lists.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (state.lists.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(SpacingLg)
                ) {
                    Text("🛒", style = MaterialTheme.typography.displayLarge)
                    Text(
                        "No Shopping Lists",
                        style = MaterialTheme.typography.headlineSmall
                    )
                    Text(
                        "Create your first shopping list",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Button(onClick = { showCreateDialog = true }) {
                        Icon(Icons.Default.Add, "Add")
                        Spacer(modifier = Modifier.width(SpacingSm))
                        Text("Create List")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(SpacingLg),
                verticalArrangement = Arrangement.spacedBy(SpacingMd)
            ) {
                items(state.lists, key = { it.id }) { list ->
                    ShoppingListAdminCard(
                        list = list,
                        onEdit = { editingList = list },
                        onDelete = { deletingList = list }
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
            Icon(Icons.Default.Add, "Add List")
        }
    }

    // Create Dialog
    if (showCreateDialog) {
        ShoppingListEditDialog(
            list = null,
            onDismiss = { showCreateDialog = false },
            onSave = { name, colorHex ->
                viewModel.createList(name, colorHex)
                showCreateDialog = false
            }
        )
    }

    // Edit Dialog
    editingList?.let { list ->
        ShoppingListEditDialog(
            list = list,
            onDismiss = { editingList = null },
            onSave = { name, colorHex ->
                viewModel.updateList(list.id, name, colorHex)
                editingList = null
            }
        )
    }

    // Delete Confirmation
    deletingList?.let { list ->
        ConfirmDialog(
            title = "Delete Shopping List",
            message = "Delete \"${list.name}\"? This list has ${list.items.size} items. This action cannot be undone.",
            confirmText = "Delete",
            onConfirm = {
                viewModel.deleteList(list.id)
            },
            onDismiss = { deletingList = null }
        )
    }

    // Error Snackbar
    state.error?.let { error ->
        LaunchedEffect(error) {
            // Show error toast/snackbar
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingListAdminCard(
    list: ShoppingList,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val listColor = try {
        Color(list.colorHex.toColorInt())
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
            // Avatar or initial
            if (list.avatarUrl != null) {
                AsyncImage(
                    model = list.avatarUrl,
                    contentDescription = list.name,
                    modifier = Modifier
                        .size(AvatarLg)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(AvatarLg)
                        .clip(CircleShape)
                        .background(listColor),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = list.name.firstOrNull()?.uppercase() ?: "?",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White
                    )
                }
            }

            // Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = list.name,
                    style = MaterialTheme.typography.titleMedium
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(SpacingSm),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(16.dp)
                            .clip(CircleShape)
                            .background(listColor)
                    )
                    Text(
                        text = "${list.items.size} items",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Actions
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
fun ShoppingListEditDialog(
    list: ShoppingList?,
    onDismiss: () -> Unit,
    onSave: (name: String, colorHex: String) -> Unit
) {
    var name by remember { mutableStateOf(list?.name ?: "") }
    var colorHex by remember { mutableStateOf(list?.colorHex ?: "#3B82F6") }
    var nameError by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (list == null) "Create Shopping List" else "Edit Shopping List") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(SpacingMd)
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

                ColorPicker(
                    selectedColor = colorHex,
                    onColorSelected = { colorHex = it },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    if (name.isBlank()) {
                        nameError = "Name is required"
                    } else {
                        onSave(name.trim(), colorHex)
                    }
                }
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
