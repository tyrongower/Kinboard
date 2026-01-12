package com.kinboard.tv.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import com.kinboard.tv.ui.components.KinboardButton
import com.kinboard.tv.ui.components.KinboardTextField
import com.kinboard.tv.ui.theme.*

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun LoginScreen(
    serverUrl: String,
    kioskToken: String,
    isLoading: Boolean,
    errorMessage: String?,
    onServerUrlChange: (String) -> Unit,
    onKioskTokenChange: (String) -> Unit,
    onAuthenticate: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = Layout.maxContentWidth)
                .padding(Layout.screenPadding),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo placeholder
            Box(
                modifier = Modifier
                    .size(ComponentSize.logoSize)
                    .clip(RoundedCornerShape(ComponentSize.logoBorderRadius))
                    .background(PrimaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "K",
                    style = KinboardTypography.displaySmall,
                    color = Primary
                )
            }
            
            Spacer(modifier = Modifier.height(Spacing.xxl))
            
            // Title
            Text(
                text = "Kinboard TV",
                style = KinboardTypography.displaySmall,
                color = Primary,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(Spacing.sm))
            
            // Subtitle
            Text(
                text = "Enter your kiosk token to continue",
                style = KinboardTypography.titleMedium,
                color = OnSurfaceVariant,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(Spacing.xxxl))
            
            // Error message
            if (errorMessage != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(BorderRadius.md))
                        .background(ErrorContainer)
                        .padding(Spacing.md)
                ) {
                    Text(
                        text = errorMessage,
                        style = KinboardTypography.bodyMedium,
                        color = OnErrorContainer
                    )
                }
                Spacer(modifier = Modifier.height(Spacing.lg))
            }
            
            // Server URL Input
            KinboardTextField(
                value = serverUrl,
                onValueChange = onServerUrlChange,
                label = "Server URL",
                placeholder = "https://your-server.com",
                keyboardType = KeyboardType.Uri,
                imeAction = ImeAction.Next,
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(Spacing.lg))
            
            // Kiosk Token Input
            KinboardTextField(
                value = kioskToken,
                onValueChange = onKioskTokenChange,
                label = "Kiosk Token",
                placeholder = "Enter your kiosk token",
                imeAction = ImeAction.Done,
                onImeAction = onAuthenticate,
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(Spacing.lg))
            
            // Authenticate Button
            KinboardButton(
                text = if (isLoading) "Authenticating..." else "Authenticate",
                onClick = onAuthenticate,
                enabled = !isLoading && serverUrl.isNotBlank() && kioskToken.isNotBlank(),
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(Spacing.lg))
            
            // Help Text
            Text(
                text = "Contact your administrator for a valid kiosk token",
                style = KinboardTypography.bodySmall,
                color = OnSurfaceDisabled,
                textAlign = TextAlign.Center
            )
        }
    }
}
