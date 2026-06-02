package com.kinboard.tv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.kinboard.tv.ui.screens.ConnectScreen
import com.kinboard.tv.ui.screens.JobsScreen
import com.kinboard.tv.ui.screens.LoginScreen
import com.kinboard.tv.ui.screens.morning.MorningPathScreen
import com.kinboard.tv.ui.theme.KinboardTVTheme
import com.kinboard.tv.ui.viewmodel.JobsViewModel
import com.kinboard.tv.ui.viewmodel.LoginViewModel
import com.kinboard.tv.ui.viewmodel.MorningPathViewModel

sealed class Screen(val route: String) {
    object Connect : Screen("connect")
    object Login : Screen("login")
    object Jobs : Screen("jobs")
    object Morning : Screen("morning")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KinboardTVTheme {
                KinboardTVApp()
            }
        }
    }
}

@Composable
fun KinboardTVApp() {
    val navController = rememberNavController()
    val loginViewModel: LoginViewModel = viewModel()
    val loginState by loginViewModel.uiState.collectAsState()
    val pairingState by loginViewModel.pairingState.collectAsState()

    // Navigate based on authentication state
    LaunchedEffect(loginState.isAuthenticated) {
        if (loginState.isAuthenticated) {
            navController.navigate(Screen.Morning.route) {
                popUpTo(Screen.Connect.route) { inclusive = true }
            }
        } else {
            navController.navigate(Screen.Connect.route) {
                popUpTo(Screen.Morning.route) { inclusive = true }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = Screen.Connect.route
    ) {
        composable(Screen.Connect.route) {
            // Begin a fresh pairing session each time this screen is entered.
            LaunchedEffect(Unit) {
                if (loginViewModel.canPair) {
                    loginViewModel.startPairing()
                }
            }
            ConnectScreen(
                isLoading = pairingState.isLoading,
                qrContent = pairingState.qrContent,
                errorMessage = pairingState.errorMessage,
                expired = pairingState.expired,
                canPair = loginViewModel.canPair,
                onRetry = loginViewModel::startPairing,
                onManualLogin = {
                    loginViewModel.stopPairing()
                    navController.navigate(Screen.Login.route)
                }
            )
        }

        composable(Screen.Login.route) {
            LoginScreen(
                serverUrl = loginState.serverUrl,
                kioskToken = loginState.kioskToken,
                isLoading = loginState.isLoading,
                errorMessage = loginState.errorMessage,
                onServerUrlChange = loginViewModel::updateServerUrl,
                onKioskTokenChange = loginViewModel::updateKioskToken,
                onAuthenticate = loginViewModel::authenticate,
                onBack = if (loginViewModel.canPair) {
                    { navController.navigate(Screen.Connect.route) }
                } else null
            )
        }

        composable(Screen.Jobs.route) {
            val jobsViewModel: JobsViewModel = viewModel()
            val jobsState by jobsViewModel.uiState.collectAsState()

            JobsScreen(
                selectedDate = jobsState.selectedDate,
                userJobsData = jobsState.userJobsData,
                hideCompletedMap = jobsState.hideCompletedMap,
                isLoading = jobsState.isLoading,
                errorMessage = jobsState.errorMessage,
                focusedUserId = jobsState.focusedUserId,
                weather = jobsState.weather,
                isWeatherLoading = jobsState.isWeatherLoading,
                currentTime = jobsState.currentTime,
                calendarEvents = jobsState.calendarEvents,
                isCalendarLoading = jobsState.isCalendarLoading,
                onPrevDay = jobsViewModel::goToPreviousDay,
                onToday = jobsViewModel::goToToday,
                onNextDay = jobsViewModel::goToNextDay,
                onToggleHideCompleted = jobsViewModel::toggleHideCompleted,
                onToggleJobComplete = jobsViewModel::toggleJobComplete,
                onFocusedUserChange = jobsViewModel::setFocusedUserId,
                onRetry = jobsViewModel::loadData
            )
        }

        composable(Screen.Morning.route) {
            val morningViewModel: MorningPathViewModel = viewModel()
            val morningState by morningViewModel.state.collectAsState()
            MorningPathScreen(state = morningState, vm = morningViewModel)
        }
    }
}
