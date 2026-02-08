package io.tyrongower.kinboard.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector

enum class AdminTab(val title: String, val icon: ImageVector) {
    SHOPPING("Shopping", Icons.Default.ShoppingCart),
    CALENDAR("Calendar", Icons.Default.DateRange),
    JOBS("Jobs", Icons.Default.CheckCircle),
    USERS("Users", Icons.Default.Person),
    TOKENS("Tokens", Icons.Default.Key),
    SETTINGS("Settings", Icons.Default.Settings),
    PERFORMANCE("Performance", Icons.Default.Speed)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    onBack: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(AdminTab.SHOPPING) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Admin - ${selectedTab.title}") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                AdminTab.entries.forEach { tab ->
                    NavigationBarItem(
                        icon = { Icon(tab.icon, tab.title) },
                        label = { Text(tab.title) },
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab }
                    )
                }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (selectedTab) {
                AdminTab.SHOPPING -> ShoppingAdminScreen()
                AdminTab.CALENDAR -> CalendarAdminScreen()
                AdminTab.JOBS -> AdminPlaceholderScreen("Jobs Admin")
                AdminTab.USERS -> AdminPlaceholderScreen("Users Admin")
                AdminTab.TOKENS -> AdminPlaceholderScreen("Kiosk Tokens Admin")
                AdminTab.SETTINGS -> AdminPlaceholderScreen("Site Settings Admin")
                AdminTab.PERFORMANCE -> AdminPlaceholderScreen("Performance Metrics Admin")
            }
        }
    }
}

@Composable
fun AdminPlaceholderScreen(title: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = androidx.compose.ui.Alignment.Center
    ) {
        Column(
            horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(io.tyrongower.kinboard.ui.theme.SpacingLg)
        ) {
            Text(
                text = "🚧",
                style = MaterialTheme.typography.displayLarge
            )
            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall
            )
            Text(
                text = "Coming soon",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
