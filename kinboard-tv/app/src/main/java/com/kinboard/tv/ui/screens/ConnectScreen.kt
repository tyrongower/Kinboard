package com.kinboard.tv.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import com.kinboard.tv.ui.components.KinboardButton
import com.kinboard.tv.ui.components.KinboardOutlinedButton
import com.kinboard.tv.ui.theme.*
import com.kinboard.tv.util.QrCodeGenerator

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun ConnectScreen(
    isLoading: Boolean,
    qrContent: String?,
    errorMessage: String?,
    expired: Boolean,
    canPair: Boolean,
    onRetry: () -> Unit,
    onManualLogin: () -> Unit,
    modifier: Modifier = Modifier
) {
    val qrBitmap: ImageBitmap? = remember(qrContent) {
        qrContent?.let { QrCodeGenerator.generate(it, sizePx = 600) }
    }

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
            Text(
                text = "Kinboard TV",
                style = KinboardTypography.displaySmall,
                color = Primary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(Spacing.sm))

            Text(
                text = "Scan to connect this TV",
                style = KinboardTypography.titleMedium,
                color = OnSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(Spacing.xxl))

            when {
                qrBitmap != null && !expired -> {
                    // White card behind the QR for scanner contrast.
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(BorderRadius.lg))
                            .background(Color.White)
                            .padding(Spacing.lg),
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            bitmap = qrBitmap,
                            contentDescription = "Pairing QR code",
                            modifier = Modifier.size(300.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(Spacing.xl))

                    Text(
                        text = "On your phone, scan this code, sign in as an administrator, and tap Connect.",
                        style = KinboardTypography.bodyMedium,
                        color = OnSurfaceVariant,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                isLoading -> {
                    Text(
                        text = "Preparing pairing code…",
                        style = KinboardTypography.titleMedium,
                        color = OnSurfaceVariant,
                        textAlign = TextAlign.Center
                    )
                }

                else -> {
                    // Error / expired / cannot pair
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(BorderRadius.md))
                            .background(ErrorContainer)
                            .padding(Spacing.md)
                    ) {
                        Text(
                            text = errorMessage
                                ?: "Couldn't start pairing. Try again or use manual login.",
                            style = KinboardTypography.bodyMedium,
                            color = OnErrorContainer,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(Spacing.xl))

            // Primary action: (re)generate a pairing code, if this build can pair.
            if (canPair) {
                KinboardButton(
                    text = if (expired || (qrBitmap == null && !isLoading)) "Generate new code" else "Refresh code",
                    onClick = onRetry,
                    enabled = !isLoading,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(Spacing.md))
            }

            // Fallback: manual token entry.
            KinboardOutlinedButton(
                text = "Enter token manually",
                onClick = onManualLogin,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
