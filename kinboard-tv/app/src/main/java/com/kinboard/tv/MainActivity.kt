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
import com.kinboard.tv.ui.screens.JobsScreen
import com.kinboard.tv.ui.screens.LoginScreen
import com.kinboard.tv.ui.theme.KinboardTVTheme
import com.kinboard.tv.ui.viewmodel.JobsViewModel
import com.kinboard.tv.ui.viewmodel.LoginViewModel

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Jobs : Screen("jobs")
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

    // Navigate based on authentication state
    LaunchedEffect(loginState.isAuthenticated) {
        if (loginState.isAuthenticated) {
            navController.navigate(Screen.Jobs.route) {
                popUpTo(Screen.Login.route) { inclusive = true }
            }
        } else {
            navController.navigate(Screen.Login.route) {
                popUpTo(Screen.Jobs.route) { inclusive = true }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = Screen.Login.route
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                serverUrl = loginState.serverUrl,
                kioskToken = loginState.kioskToken,
                isLoading = loginState.isLoading,
                errorMessage = loginState.errorMessage,
                onServerUrlChange = loginViewModel::updateServerUrl,
                onKioskTokenChange = loginViewModel::updateKioskToken,
                onAuthenticate = loginViewModel::authenticate
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
                onPrevDay = jobsViewModel::goToPreviousDay,
                onToday = jobsViewModel::goToToday,
                onNextDay = jobsViewModel::goToNextDay,
                onToggleHideCompleted = jobsViewModel::toggleHideCompleted,
                onToggleJobComplete = jobsViewModel::toggleJobComplete,
                onFocusedUserChange = jobsViewModel::setFocusedUserId,
                onRetry = jobsViewModel::loadData
            )
        }
    }
}
