package com.bandite.sonicwalkscape.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.bandite.sonicwalkscape.ui.discovery.DiscoveryScreen
import com.bandite.sonicwalkscape.ui.player.PlayerScreen
import com.bandite.sonicwalkscape.ui.player.TourCompletionScreen
import com.bandite.sonicwalkscape.ui.settings.SettingsScreen
import com.bandite.sonicwalkscape.ui.tourdetail.TourDetailScreen
import com.bandite.sonicwalkscape.ui.welcome.OnboardingCarouselScreen
import com.bandite.sonicwalkscape.ui.welcome.WelcomeScreen
import com.bandite.sonicwalkscape.ui.welcome.WelcomeViewModel

sealed class Screen(val route: String) {
    object Welcome : Screen("welcome")
    object Onboarding : Screen("onboarding")
    object Discovery : Screen("discovery")
    object TourDetail : Screen("tour/{tourId}") {
        fun createRoute(tourId: String) = "tour/$tourId"
    }
    object Player : Screen("player/{tourId}/{language}") {
        fun createRoute(tourId: String, language: String) = "player/$tourId/$language"
    }
    object TourCompletion : Screen("completion/{tourId}") {
        fun createRoute(tourId: String) = "completion/$tourId"
    }
    object Settings : Screen("settings")
}

@Composable
fun NavGraph() {
    val navController = rememberNavController()
    val welcomeViewModel: WelcomeViewModel = hiltViewModel()
    val onboardingCompleted by welcomeViewModel.onboardingCompleted.collectAsState(initial = null)

    // Determine start destination based on onboarding status
    val startDestination = when (onboardingCompleted) {
        true -> Screen.Discovery.route
        false -> Screen.Welcome.route
        null -> Screen.Welcome.route // Loading state, default to welcome
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // Welcome
        composable(Screen.Welcome.route) {
            WelcomeScreen(
                onGetStarted = {
                    navController.navigate(Screen.Onboarding.route)
                }
            )
        }

        // Onboarding
        composable(Screen.Onboarding.route) {
            OnboardingCarouselScreen(
                onFinish = {
                    welcomeViewModel.completeOnboarding()
                    navController.navigate(Screen.Discovery.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                },
                onSkip = {
                    welcomeViewModel.completeOnboarding()
                    navController.navigate(Screen.Discovery.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                }
            )
        }

        // Discovery (Tour List)
        composable(Screen.Discovery.route) {
            DiscoveryScreen(
                onTourClick = { tourId ->
                    navController.navigate(Screen.TourDetail.createRoute(tourId))
                },
                onSettingsClick = {
                    navController.navigate(Screen.Settings.route)
                }
            )
        }

        // Tour Detail
        composable(
            route = Screen.TourDetail.route,
            arguments = listOf(navArgument("tourId") { type = NavType.StringType })
        ) { backStackEntry ->
            val tourId = backStackEntry.arguments?.getString("tourId") ?: return@composable
            TourDetailScreen(
                tourId = tourId,
                onBack = { navController.popBackStack() },
                onStartTour = { language ->
                    navController.navigate(Screen.Player.createRoute(tourId, language))
                }
            )
        }

        // Player
        composable(
            route = Screen.Player.route,
            arguments = listOf(
                navArgument("tourId") { type = NavType.StringType },
                navArgument("language") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val tourId = backStackEntry.arguments?.getString("tourId") ?: return@composable
            val language = backStackEntry.arguments?.getString("language") ?: return@composable
            PlayerScreen(
                tourId = tourId,
                language = language,
                onExit = { navController.popBackStack() },
                onTourComplete = {
                    navController.navigate(Screen.TourCompletion.createRoute(tourId)) {
                        popUpTo(Screen.Discovery.route)
                    }
                }
            )
        }

        // Tour Completion
        composable(
            route = Screen.TourCompletion.route,
            arguments = listOf(navArgument("tourId") { type = NavType.StringType })
        ) { backStackEntry ->
            val tourId = backStackEntry.arguments?.getString("tourId") ?: return@composable
            TourCompletionScreen(
                tourId = tourId,
                onDone = {
                    navController.navigate(Screen.Discovery.route) {
                        popUpTo(Screen.Discovery.route) { inclusive = true }
                    }
                }
            )
        }

        // Settings
        composable(Screen.Settings.route) {
            SettingsScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
}
