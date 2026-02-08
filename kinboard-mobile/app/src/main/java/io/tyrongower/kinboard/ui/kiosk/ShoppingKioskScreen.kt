package io.tyrongower.kinboard.ui.kiosk

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
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
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.core.graphics.toColorInt
import androidx.hilt.navigation.compose.hiltViewModel
import io.tyrongower.kinboard.data.model.ShoppingItem
import io.tyrongower.kinboard.data.model.ShoppingList
import io.tyrongower.kinboard.ui.theme.*
import io.tyrongower.kinboard.viewmodel.ShoppingViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingKioskScreen(
    onNavigateToJobs: () -> Unit,
    onNavigateToCalendar: () -> Unit,
    onNavigateToAdmin: () -> Unit = {},
    viewModel: ShoppingViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var selectedListIndex by remember { mutableIntStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Shopping Lists") },
                actions = {
                    IconButton(onClick = onNavigateToJobs) {
                        Icon(Icons.Default.CheckCircle, "Jobs")
                    }
                    IconButton(onClick = onNavigateToCalendar) {
                        Icon(Icons.Default.DateRange, "Calendar")
                    }
                    IconButton(onClick = onNavigateToAdmin) {
                        Icon(Icons.Default.Settings, "Admin")
                    }
                }
            )
        }
    ) { padding ->
        if (state.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (state.lists.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🛒", style = MaterialTheme.typography.displayLarge)
                    Spacer(modifier = Modifier.height(SpacingLg))
                    Text(
                        "No Shopping Lists",
                        style = MaterialTheme.typography.headlineSmall
                    )
                    Text(
                        "Create lists in the Admin panel",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            // Ensure selected index is valid
            if (selectedListIndex >= state.lists.size) {
                selectedListIndex = 0
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                // TabRow for list selection
                if (state.lists.size > 1) {
                    ScrollableTabRow(
                        selectedTabIndex = selectedListIndex,
                        containerColor = MaterialTheme.colorScheme.surface,
                        contentColor = MaterialTheme.colorScheme.primary
                    ) {
                        state.lists.forEachIndexed { index, list ->
                            Tab(
                                selected = selectedListIndex == index,
                                onClick = { selectedListIndex = index },
                                text = { Text(list.name) }
                            )
                        }
                    }
                }

                // Show selected list
                val selectedList = state.lists[selectedListIndex]
                FocusedShoppingList(
                    list = selectedList,
                    isHidden = viewModel.isHiddenFor(selectedList.id),
                    onToggleHide = { viewModel.toggleHideBought(selectedList.id) },
                    onToggleItem = { itemId -> viewModel.toggleItemBought(selectedList.id, itemId) },
                    onToggleImportant = { itemId -> viewModel.toggleItemImportant(selectedList.id, itemId) },
                    onDeleteItem = { itemId -> viewModel.deleteItem(selectedList.id, itemId) },
                    onAddItem = { name -> viewModel.addItem(selectedList.id, name) },
                    onClearBought = { viewModel.clearBoughtItems(selectedList.id) }
                )
            }
        }
    }
}

@Composable
fun FocusedShoppingList(
    list: ShoppingList,
    isHidden: Boolean,
    onToggleHide: () -> Unit,
    onToggleItem: (Int) -> Unit,
    onToggleImportant: (Int) -> Unit,
    onDeleteItem: (Int) -> Unit,
    onAddItem: (String) -> Unit,
    onClearBought: () -> Unit
) {
    var newItemText by remember { mutableStateOf("") }
    var showDeleteDialog by remember { mutableStateOf<Int?>(null) }
    val listColor = try { Color(list.colorHex.toColorInt()) } catch (e: Exception) { ColorPrimary }

    val unboughtItems = list.items.filter { !it.isBought }.sortedByDescending { it.isImportant }
    val boughtItems = list.items.filter { it.isBought }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(SpacingLg),
        verticalArrangement = Arrangement.spacedBy(SpacingMd)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(SpacingMd)
            ) {
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
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = list.name,
                        style = MaterialTheme.typography.headlineSmall
                    )
                    Text(
                        text = "${unboughtItems.size} items" +
                              if (boughtItems.isNotEmpty()) " • ${boughtItems.size} bought" else "",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // Add item input
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(SpacingSm)
            ) {
                OutlinedTextField(
                    value = newItemText,
                    onValueChange = { newItemText = it },
                    placeholder = { Text("Add item to ${list.name}...") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                Button(
                    onClick = {
                        if (newItemText.isNotBlank()) {
                            onAddItem(newItemText.trim())
                            newItemText = ""
                        }
                    },
                    enabled = newItemText.isNotBlank(),
                    modifier = Modifier.height(56.dp)
                ) {
                    Icon(Icons.Default.Add, "Add item")
                }
            }
        }

        // Unbought items
        if (unboughtItems.isEmpty() && boughtItems.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = SpacingXxl),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("✨", style = MaterialTheme.typography.displayLarge)
                        Spacer(modifier = Modifier.height(SpacingSm))
                        Text(
                            "List is empty",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else if (unboughtItems.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = SpacingXl),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("✅", style = MaterialTheme.typography.displayLarge)
                        Spacer(modifier = Modifier.height(SpacingSm))
                        Text(
                            "All done!",
                            style = MaterialTheme.typography.titleMedium,
                            color = ColorSuccess
                        )
                    }
                }
            }
        } else {
            items(unboughtItems, key = { it.id }) { item ->
                EnhancedShoppingItemRow(
                    item = item,
                    listColor = listColor,
                    onToggle = { onToggleItem(item.id) },
                    onToggleImportant = { onToggleImportant(item.id) },
                    onDelete = { showDeleteDialog = item.id }
                )
            }
        }

        // Bought items section
        if (boughtItems.isNotEmpty() && !isHidden) {
            item {
                HorizontalDivider(modifier = Modifier.padding(vertical = SpacingMd))
                Text(
                    text = "Bought (${boughtItems.size})",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = SpacingSm)
                )
            }

            items(boughtItems, key = { it.id }) { item ->
                EnhancedShoppingItemRow(
                    item = item,
                    listColor = listColor,
                    onToggle = { onToggleItem(item.id) },
                    onToggleImportant = { onToggleImportant(item.id) },
                    onDelete = { showDeleteDialog = item.id },
                    dimmed = true
                )
            }
        }

        // Action buttons
        if (boughtItems.isNotEmpty() || unboughtItems.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(SpacingMd))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(SpacingSm)
                ) {
                    if (boughtItems.isNotEmpty()) {
                        OutlinedButton(
                            onClick = onClearBought,
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Delete, "Clear bought", modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(SpacingSm))
                            Text("Clear Bought")
                        }
                    }
                    OutlinedButton(
                        onClick = onToggleHide,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            if (isHidden) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                            if (isHidden) "Show bought" else "Hide bought",
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(SpacingSm))
                        Text(if (isHidden) "Show Bought" else "Hide Bought")
                    }
                }
            }
        }
    }

    // Delete confirmation dialog
    if (showDeleteDialog != null) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = null },
            title = { Text("Delete Item") },
            text = { Text("Are you sure you want to delete this item?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDeleteItem(showDeleteDialog!!)
                        showDeleteDialog = null
                    }
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun EnhancedShoppingItemRow(
    item: ShoppingItem,
    listColor: Color,
    onToggle: () -> Unit,
    onToggleImportant: () -> Unit,
    onDelete: () -> Unit,
    dimmed: Boolean = false
) {
    val alpha = if (dimmed) 0.6f else 1f

    Surface(
        onClick = onToggle,
        modifier = Modifier
            .fillMaxWidth()
            .combinedClickable(
                onClick = onToggle,
                onLongClick = { /* Could show menu here */ }
            ),
        shape = MaterialTheme.shapes.medium,
        color = if (item.isImportant && !item.isBought)
            ColorWarningMuted.copy(alpha = alpha)
        else
            MaterialTheme.colorScheme.surface.copy(alpha = alpha),
        border = if (item.isImportant && !item.isBought)
            androidx.compose.foundation.BorderStroke(1.dp, ColorWarning.copy(alpha = alpha))
        else null,
        tonalElevation = if (!dimmed) 1.dp else 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(SpacingMd),
            horizontalArrangement = Arrangement.spacedBy(SpacingMd),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Checkbox
            Checkbox(
                checked = item.isBought,
                onCheckedChange = { onToggle() },
                colors = CheckboxDefaults.colors(
                    checkedColor = listColor
                ),
                modifier = Modifier.size(24.dp)
            )

            // Item name
            Text(
                text = item.name,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.weight(1f),
                textDecoration = if (item.isBought) TextDecoration.LineThrough else null,
                color = if (item.isBought)
                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = alpha)
                else
                    MaterialTheme.colorScheme.onSurface.copy(alpha = alpha)
            )

            // Important button
            if (!item.isBought) {
                IconButton(
                    onClick = onToggleImportant,
                    modifier = Modifier.size(40.dp)
                ) {
                    if (item.isImportant) {
                        Text("⚠️", style = MaterialTheme.typography.titleMedium)
                    } else {
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = "Mark as important",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // Delete button
            IconButton(
                onClick = onDelete,
                modifier = Modifier.size(40.dp)
            ) {
                Icon(
                    Icons.Default.Close,
                    contentDescription = "Delete item",
                    tint = MaterialTheme.colorScheme.error.copy(alpha = if (dimmed) 0.5f else 0.7f),
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
