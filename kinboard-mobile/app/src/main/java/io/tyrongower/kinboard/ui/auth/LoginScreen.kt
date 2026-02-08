package io.tyrongower.kinboard.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import io.tyrongower.kinboard.R
import io.tyrongower.kinboard.ui.theme.SpacingLg
import io.tyrongower.kinboard.ui.theme.SpacingXl
import io.tyrongower.kinboard.ui.theme.SpacingXxl
import io.tyrongower.kinboard.viewmodel.AuthViewModel

enum class LoginMode {
    ADMIN, KIOSK
}

@Composable
fun LoginScreen(
    onAuthSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val authState by viewModel.authState.collectAsState()
    var loginMode by remember { mutableStateOf(LoginMode.KIOSK) }
    var serverUrl by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var kioskToken by remember { mutableStateOf("") }

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
        // Logo/Favicon
        Image(
            painter = painterResource(id = R.drawable.ic_launcher_foreground),
            contentDescription = "Kinboard Logo",
            modifier = Modifier.size(80.dp)
        )

        Spacer(modifier = Modifier.height(SpacingLg))

        Text(
            text = "Kinboard",
            style = MaterialTheme.typography.displaySmall,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(SpacingLg))

        // Mode Toggle
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            FilterChip(
                selected = loginMode == LoginMode.ADMIN,
                onClick = { loginMode = LoginMode.ADMIN },
                label = { Text("Admin") },
                modifier = Modifier.padding(end = 8.dp)
            )
            FilterChip(
                selected = loginMode == LoginMode.KIOSK,
                onClick = { loginMode = LoginMode.KIOSK },
                label = { Text("Kiosk") }
            )
        }

        Spacer(modifier = Modifier.height(SpacingXxl))

        // Server URL (common for both modes)
        OutlinedTextField(
            value = serverUrl,
            onValueChange = { serverUrl = it },
            label = { Text("Server URL") },
            placeholder = { Text("http://your-server:port") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            enabled = !authState.isLoading
        )

        Spacer(modifier = Modifier.height(SpacingLg))

        // Mode-specific fields
        when (loginMode) {
            LoginMode.ADMIN -> {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !authState.isLoading
                )

                Spacer(modifier = Modifier.height(SpacingLg))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    enabled = !authState.isLoading
                )
            }
            LoginMode.KIOSK -> {
                OutlinedTextField(
                    value = kioskToken,
                    onValueChange = { kioskToken = it },
                    label = { Text("Kiosk Token") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !authState.isLoading
                )
            }
        }

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
                if (serverUrl.isNotBlank()) {
                    when (loginMode) {
                        LoginMode.ADMIN -> {
                            if (email.isNotBlank() && password.isNotBlank()) {
                                viewModel.adminLogin(email, password, serverUrl)
                            }
                        }
                        LoginMode.KIOSK -> {
                            if (kioskToken.isNotBlank()) {
                                viewModel.kioskAuthenticate(kioskToken, serverUrl)
                            }
                        }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !authState.isLoading && serverUrl.isNotBlank() && when (loginMode) {
                LoginMode.ADMIN -> email.isNotBlank() && password.isNotBlank()
                LoginMode.KIOSK -> kioskToken.isNotBlank()
            }
        ) {
            if (authState.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text(if (loginMode == LoginMode.ADMIN) "Login" else "Authenticate")
            }
        }

        Spacer(modifier = Modifier.height(SpacingXl))

        Text(
            text = if (loginMode == LoginMode.ADMIN) {
                "Login with your admin credentials"
            } else {
                "Contact your administrator for a valid kiosk token"
            },
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
            textAlign = TextAlign.Center
        )
    }
}
