package io.tyrongower.kinboard.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.tyrongower.kinboard.data.model.CalendarSource
import io.tyrongower.kinboard.data.repository.CalendarRepository
import io.tyrongower.kinboard.data.repository.Result
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CalendarState(
    val sources: List<CalendarSource> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val testingUrl: Boolean = false,
    val testUrlResult: String? = null
)

@HiltViewModel
class CalendarViewModel @Inject constructor(
    private val repository: CalendarRepository
) : ViewModel() {

    private val _state = MutableStateFlow(CalendarState())
    val state: StateFlow<CalendarState> = _state.asStateFlow()

    init {
        loadCalendarSources()
    }

    fun loadCalendarSources() {
        viewModelScope.launch {
            repository.getCalendarSources().collect { result ->
                when (result) {
                    is Result.Loading -> {
                        _state.value = _state.value.copy(isLoading = true, error = null)
                    }
                    is Result.Success -> {
                        _state.value = _state.value.copy(
                            sources = result.data.sortedBy { it.displayOrder },
                            isLoading = false,
                            error = null
                        )
                    }
                    is Result.Error -> {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            error = result.message
                        )
                    }
                }
            }
        }
    }

    fun createSource(name: String, icalUrl: String, colorHex: String, enabled: Boolean = true) {
        viewModelScope.launch {
            when (repository.createCalendarSource(name, icalUrl, colorHex, enabled)) {
                is Result.Success -> {
                    loadCalendarSources()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun updateSource(id: Int, name: String, icalUrl: String, colorHex: String, enabled: Boolean) {
        viewModelScope.launch {
            when (repository.updateCalendarSource(id, name, icalUrl, colorHex, enabled)) {
                is Result.Success -> {
                    loadCalendarSources()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun deleteSource(id: Int) {
        viewModelScope.launch {
            when (repository.deleteCalendarSource(id)) {
                is Result.Success -> {
                    loadCalendarSources()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun updateSourceOrder(order: List<Int>) {
        viewModelScope.launch {
            when (repository.updateCalendarSourceOrder(order)) {
                is Result.Success -> {
                    loadCalendarSources()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun testIcalUrl(url: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(testingUrl = true, testUrlResult = null)
            when (val result = repository.testIcalUrl(url)) {
                is Result.Success -> {
                    _state.value = _state.value.copy(
                        testingUrl = false,
                        testUrlResult = "URL appears valid"
                    )
                }
                is Result.Error -> {
                    _state.value = _state.value.copy(
                        testingUrl = false,
                        testUrlResult = result.message
                    )
                }
                else -> {
                    _state.value = _state.value.copy(testingUrl = false)
                }
            }
        }
    }

    fun clearTestResult() {
        _state.value = _state.value.copy(testUrlResult = null)
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
}
