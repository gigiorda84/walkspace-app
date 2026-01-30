package com.bandite.sonicwalkscape.ui.discovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bandite.sonicwalkscape.data.api.ApiResult
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.data.api.safeApiCall
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.services.TourDownloadManager
import com.bandite.sonicwalkscape.services.UserPreferencesManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DiscoveryViewModel @Inject constructor(
    private val apiService: ApiService,
    private val preferencesManager: UserPreferencesManager,
    private val downloadManager: TourDownloadManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<DiscoveryUiState>(DiscoveryUiState.Loading)
    val uiState: StateFlow<DiscoveryUiState> = _uiState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCity = MutableStateFlow<String?>(null)
    val selectedCity: StateFlow<String?> = _selectedCity.asStateFlow()

    private var allTours: List<Tour> = emptyList()

    init {
        loadTours()
    }

    fun loadTours() {
        viewModelScope.launch {
            _uiState.value = DiscoveryUiState.Loading

            val language = preferencesManager.getPreferredLanguageSync()
            val result = safeApiCall { apiService.getTours(language) }

            when (result) {
                is ApiResult.Success -> {
                    allTours = result.data.map { tour ->
                        // Check if downloaded
                        val isDownloaded = downloadManager.isTourDownloaded(tour.id, language)
                        tour.copy(isDownloaded = isDownloaded)
                    }
                    applyFilters()
                }
                is ApiResult.Error -> {
                    _uiState.value = DiscoveryUiState.Error(result.exception.message)
                }
            }
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
        applyFilters()
    }

    fun setSelectedCity(city: String?) {
        _selectedCity.value = city
        applyFilters()
    }

    private fun applyFilters() {
        val query = _searchQuery.value.lowercase()
        val city = _selectedCity.value

        var filteredTours = allTours

        // Apply search filter
        if (query.isNotEmpty()) {
            filteredTours = filteredTours.filter { tour ->
                tour.getDisplayTitle().lowercase().contains(query) ||
                tour.city.lowercase().contains(query)
            }
        }

        // Apply city filter
        if (city != null) {
            filteredTours = filteredTours.filter { it.city == city }
        }

        _uiState.value = if (filteredTours.isEmpty() && allTours.isNotEmpty()) {
            DiscoveryUiState.Empty
        } else {
            DiscoveryUiState.Success(
                tours = filteredTours,
                cities = allTours.map { it.city }.distinct().sorted()
            )
        }
    }

    fun clearFilters() {
        _searchQuery.value = ""
        _selectedCity.value = null
        applyFilters()
    }
}

sealed class DiscoveryUiState {
    object Loading : DiscoveryUiState()
    data class Success(
        val tours: List<Tour>,
        val cities: List<String>
    ) : DiscoveryUiState()
    object Empty : DiscoveryUiState()
    data class Error(val message: String) : DiscoveryUiState()
}
