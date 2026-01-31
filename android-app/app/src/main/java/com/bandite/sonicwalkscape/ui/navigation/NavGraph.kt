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
import com.bandite.sonicwalkscape.ui.discovery.DiscoveryViewModel
import com.bandite.sonicwalkscape.ui.player.PlayerScreen
import com.bandite.sonicwalkscape.ui.player.PlayerViewModel
import com.bandite.sonicwalkscape.ui.player.TourCompletionScreen
import com.bandite.sonicwalkscape.ui.settings.SettingsScreen
import com.bandite.sonicwalkscape.ui.settings.SettingsViewModel
import com.bandite.sonicwalkscape.ui.tourdetail.TourDetailScreen
import com.bandite.sonicwalkscape.ui.tourdetail.TourDetailViewModel
import com.bandite.sonicwalkscape.ui.welcome.OnboardingCarouselScreen
import com.bandite.sonicwalkscape.ui.welcome.WelcomeScreen
import com.bandite.sonicwalkscape.ui.welcome.WelcomeViewModel

sealed class Screen(val route: String) {
    object Welcome : Screen("welcome")
    object Onboarding : Screen("onboarding")
    object Discovery : Screen("discovery")
    object TourDetail : Screen("tour/{tourId}?languages={languages}") {
        fun createRoute(tourId: String, languages: List<String>) =
            "tour/$tourId?languages=${languages.joinToString(",")}"
    }
    object Player : Screen("player/{tourId}?language={language}&subtitles={subtitles}") {
        fun createRoute(tourId: String, language: String, subtitlesEnabled: Boolean) =
            "player/$tourId?language=$language&subtitles=$subtitlesEnabled"
    }
    object TourCompletion : Screen("completion/{tourId}?language={language}") {
        fun createRoute(tourId: String, language: String) = "completion/$tourId?language=$language"
    }
    object Settings : Screen("settings")
}

@Composable
fun NavGraph() {
    val navController = rememberNavController()
    val welcomeViewModel: WelcomeViewModel = hiltViewModel()
    val onboardingCompleted by welcomeViewModel.onboardingCompleted.collectAsState(initial = false)

    val startDestination = if (onboardingCompleted) Screen.Discovery.route else Screen.Welcome.route

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Welcome.route) {
            WelcomeScreen(
                onStartExploring = { navController.navigate(Screen.Onboarding.route) },
                onSettingsClick = { navController.navigate(Screen.Settings.route) }
            )
        }

        composable(Screen.Onboarding.route) {
            OnboardingCarouselScreen(
                onComplete = {
                    welcomeViewModel.completeOnboarding()
                    navController.navigate(Screen.Discovery.route) {
                        popUpTo(Screen.Welcome.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Discovery.route) {
            val viewModel: DiscoveryViewModel = hiltViewModel()
            DiscoveryScreen(
                viewModel = viewModel,
                onTourClick = { tourId, languages ->
                    navController.navigate(Screen.TourDetail.createRoute(tourId, languages))
                },
                onSettingsClick = {
                    navController.navigate(Screen.Settings.route)
                },
                onHomeClick = {
                    // TEMP: Test Tour Completion screen with actual tour ID
                    navController.navigate(Screen.TourCompletion.createRoute("abf19196-419d-41ff-95f1-0be22ff8281f", "it"))
                }
            )
        }

        composable(
            route = Screen.TourDetail.route,
            arguments = listOf(
                navArgument("tourId") { type = NavType.StringType },
                navArgument("languages") { type = NavType.StringType; defaultValue = "" }
            )
        ) { backStackEntry ->
            val tourId = backStackEntry.arguments?.getString("tourId") ?: return@composable
            val languagesArg = backStackEntry.arguments?.getString("languages") ?: ""
            val availableLanguages = languagesArg.split(",").filter { it.isNotEmpty() }
            val viewModel: TourDetailViewModel = hiltViewModel()
            TourDetailScreen(
                tourId = tourId,
                availableLanguages = availableLanguages,
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onStartTour = { config ->
                    navController.navigate(Screen.Player.createRoute(tourId, config.language, config.subtitlesEnabled))
                }
            )
        }

        composable(
            route = Screen.Player.route,
            arguments = listOf(
                navArgument("tourId") { type = NavType.StringType },
                navArgument("language") { type = NavType.StringType; defaultValue = "en" },
                navArgument("subtitles") { type = NavType.BoolType; defaultValue = true }
            )
        ) { backStackEntry ->
            val tourId = backStackEntry.arguments?.getString("tourId") ?: return@composable
            val language = backStackEntry.arguments?.getString("language") ?: "en"
            val subtitlesEnabled = backStackEntry.arguments?.getBoolean("subtitles") ?: true
            val viewModel: PlayerViewModel = hiltViewModel()
            PlayerScreen(
                tourId = tourId,
                language = language,
                subtitlesEnabled = subtitlesEnabled,
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onTourComplete = {
                    navController.navigate(Screen.TourCompletion.createRoute(tourId, language)) {
                        popUpTo(Screen.Discovery.route)
                    }
                }
            )
        }

        composable(
            route = Screen.TourCompletion.route,
            arguments = listOf(
                navArgument("tourId") { type = NavType.StringType },
                navArgument("language") { type = NavType.StringType; defaultValue = "en" }
            )
        ) { backStackEntry ->
            val tourId = backStackEntry.arguments?.getString("tourId") ?: return@composable
            val language = backStackEntry.arguments?.getString("language") ?: "en"
            TourCompletionScreen(
                tourId = tourId,
                language = language,
                onReturnHome = {
                    navController.navigate(Screen.Discovery.route) {
                        popUpTo(Screen.Discovery.route) { inclusive = true }
                    }
                },
                onClose = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.Settings.route) {
            val viewModel: SettingsViewModel = hiltViewModel()
            SettingsScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
