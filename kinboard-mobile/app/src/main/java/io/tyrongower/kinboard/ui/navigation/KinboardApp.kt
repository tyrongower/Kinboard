package io.tyrongower.kinboard.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import io.tyrongower.kinboard.ui.admin.AdminScreen
import io.tyrongower.kinboard.ui.auth.LoginScreen
import io.tyrongower.kinboard.ui.kiosk.CalendarScreen
import io.tyrongower.kinboard.ui.kiosk.ShoppingKioskScreen
import io.tyrongower.kinboard.ui.placeholder.PlaceholderScreen
import io.tyrongower.kinboard.viewmodel.AuthViewModel

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Shopping : Screen("shopping")
    object Jobs : Screen("jobs")
    object Calendar : Screen("calendar")
    object Admin : Screen("admin")
}

@Composable
fun KinboardApp(
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val authState by authViewModel.authState.collectAsState()

    // Wait for the persisted-auth check to finish before building the nav graph.
    // The graph's startDestination is read only once, so resolving auth first
    // guarantees an authenticated user is never dropped on the Login screen
    // (e.g. after backing out of the app and reopening).
    if (!authState.isInitialized) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    val navController = rememberNavController()

    val startDestination = if (authState.isAuthenticated) {
        Screen.Shopping.route
    } else {
        Screen.Login.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onAuthSuccess = {
                    navController.navigate(Screen.Shopping.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Shopping.route) {
            ShoppingKioskScreen(
                onNavigateToJobs = {
                    navController.navigate(Screen.Jobs.route)
                },
                onNavigateToCalendar = {
                    navController.navigate(Screen.Calendar.route)
                },
                onNavigateToAdmin = {
                    navController.navigate(Screen.Admin.route)
                }
            )
        }

        composable(Screen.Jobs.route) {
            PlaceholderScreen(
                title = "Jobs",
                message = "Jobs feature coming soon.\nSee prompts.md for implementation guide.",
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Calendar.route) {
            CalendarScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Admin.route) {
            AdminScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
}
