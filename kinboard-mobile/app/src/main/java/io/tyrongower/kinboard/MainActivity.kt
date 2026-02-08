package io.tyrongower.kinboard

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import dagger.hilt.android.AndroidEntryPoint
import io.tyrongower.kinboard.ui.navigation.KinboardApp
import io.tyrongower.kinboard.ui.theme.KinboardTheme

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            KinboardTheme {
                Surface(
                    modifier = Modifier.fillMaxSize()
                ) {
                    KinboardApp()
                }
            }
        }
    }
}
