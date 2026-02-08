package io.tyrongower.kinboard.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import io.tyrongower.kinboard.ui.theme.SpacingLg
import io.tyrongower.kinboard.ui.theme.SpacingXl
import io.tyrongower.kinboard.ui.theme.SpacingXxl
import io.tyrongower.kinboard.viewmodel.AuthViewModel

@Composable
fun KioskAuthScreen(
    onAuthSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val authState by viewModel.authState.collectAsState()
    var serverUrl by remember { mutableStateOf("http://10.0.2.2:5197") }
    var token by remember { mutableStateOf("") }

    LaunchedEffect(authState.isAuthenticated) {
        if (authState.isAuthenticated) {
            onAuthSuccess()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(SpacingXxl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Kinboard",
            style = MaterialTheme.typography.displaySmall,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(SpacingLg))

        Text(
            text = "Enter your kiosk token to continue",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(SpacingXxl))

        OutlinedTextField(
            value = serverUrl,
            onValueChange = { serverUrl = it },
            label = { Text("Server URL") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            enabled = !authState.isLoading
        )

        Spacer(modifier = Modifier.height(SpacingLg))

        OutlinedTextField(
            value = token,
            onValueChange = { token = it },
            label = { Text("Kiosk Token") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            enabled = !authState.isLoading
        )

        Spacer(modifier = Modifier.height(SpacingXl))

        if (authState.error != null) {
            Text(
                text = authState.error ?: "",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(bottom = SpacingLg)
            )
        }

        Button(
            onClick = {
                if (token.isNotBlank() && serverUrl.isNotBlank()) {
                    viewModel.kioskAuthenticate(token, serverUrl)
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !authState.isLoading && token.isNotBlank() && serverUrl.isNotBlank()
        ) {
            if (authState.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text("Authenticate")
            }
        }

        Spacer(modifier = Modifier.height(SpacingXl))

        Text(
            text = "Contact your administrator for a valid kiosk token",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
            textAlign = TextAlign.Center
        )
    }
}
