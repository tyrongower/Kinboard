package com.kinboard.tv.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kinboard.tv.data.api.ApiClient
import com.kinboard.tv.data.model.CalendarEvent
import com.kinboard.tv.data.model.Job
import com.kinboard.tv.data.model.JobAssignment
import com.kinboard.tv.data.model.SiteSettings
import com.kinboard.tv.data.model.User
import com.kinboard.tv.data.model.WeatherData
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

data class MorningUiState(
    val users: List<User> = emptyList(),
    val jobs: List<Job> = emptyList(),
    val weather: WeatherData? = null,
    val calendarEvents: List<CalendarEvent> = emptyList(),
    val siteSettings: SiteSettings? = null,
    val now: LocalDateTime = LocalDateTime.now(),
    val isLoading: Boolean = true,
    val errorMessage: String? = null,
    val focusedKidIndex: Int = 0,
    val focusedStoneIndex: Int = 0,
    val celebrateAssignmentId: Int? = null
)

class MorningPathViewModel(application: Application) : AndroidViewModel(application) {

    private val _state = MutableStateFlow(MorningUiState())
    val state: StateFlow<MorningUiState> = _state.asStateFlow()

    private val dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    private val api get() = ApiClient.getApi(getApplication())

    init {
        loadAll()
        startChoresPolling()
        startWeatherPolling()
        startCalendarPolling()
        tickClock()
    }

    private fun loadAll() = viewModelScope.launch {
        try {
            val today = LocalDate.now()
            val todayStr = today.format(dateFmt)
            val endStr = today.plusDays(1).format(dateFmt)

            val settings = api.getSiteSettings().body()
            val users = api.getUsers().body() ?: emptyList()
            val jobs = api.getJobs(todayStr).body() ?: emptyList()
            val weather = api.getWeather().body()
            val cal = api.getCalendarEvents(todayStr, endStr).body() ?: emptyList()

            _state.update {
                it.copy(
                    users = users.filter { u -> u.id > 0 }.sortedBy { u -> u.displayOrder ?: 0 },
                    jobs = jobs,
                    weather = weather,
                    calendarEvents = cal,
                    siteSettings = settings,
                    isLoading = false,
                    errorMessage = null
                )
            }
        } catch (e: Exception) {
            _state.update { it.copy(isLoading = false, errorMessage = e.message) }
        }
    }

    private fun startChoresPolling() = viewModelScope.launch {
        while (isActive) {
            val s = _state.value.siteSettings
            val ms = (s?.choresRefreshSeconds ?: 10) * 1000L
            delay(ms)
            try {
                val today = LocalDate.now().format(dateFmt)
                val jobs = api.getJobs(today).body() ?: emptyList()
                val users = api.getUsers().body() ?: emptyList()
                _state.update {
                    it.copy(
                        jobs = jobs,
                        users = users.filter { u -> u.id > 0 }.sortedBy { u -> u.displayOrder ?: 0 }
                    )
                }
            } catch (_: Exception) { /* keep last good */ }
        }
    }

    private fun startWeatherPolling() = viewModelScope.launch {
        while (isActive) {
            val s = _state.value.siteSettings
            val ms = (s?.weatherRefreshSeconds ?: 1800) * 1000L
            delay(ms)
            try {
                val w = api.getWeather().body()
                _state.update { it.copy(weather = w) }
            } catch (_: Exception) { /* keep last good */ }
        }
    }

    private fun startCalendarPolling() = viewModelScope.launch {
        while (isActive) {
            val s = _state.value.siteSettings
            val ms = (s?.calendarRefreshSeconds ?: 30) * 1000L
            delay(ms)
            try {
                val today = LocalDate.now()
                val startStr = today.format(dateFmt)
                val endStr = today.plusDays(1).format(dateFmt)
                val cal = api.getCalendarEvents(startStr, endStr).body() ?: emptyList()
                _state.update { it.copy(calendarEvents = cal) }
            } catch (_: Exception) { /* keep last good */ }
        }
    }

    private fun tickClock() = viewModelScope.launch {
        while (isActive) {
            delay(30_000)
            _state.update { it.copy(now = LocalDateTime.now()) }
        }
    }

    fun setFocus(kidIndex: Int, stoneIndex: Int) {
        _state.update { it.copy(focusedKidIndex = kidIndex, focusedStoneIndex = stoneIndex) }
    }

    fun toggleAssignment(job: Job, assignment: JobAssignment) = viewModelScope.launch {
        val today = LocalDate.now().format(dateFmt)
        try {
            if (assignment.isCompleted == true) {
                api.uncompleteJob(job.id, assignment.id, today)
            } else {
                api.completeJob(job.id, assignment.id, today)
                _state.update { it.copy(celebrateAssignmentId = assignment.id) }
            }
            val jobs = api.getJobs(today).body() ?: emptyList()
            _state.update { it.copy(jobs = jobs) }
        } catch (_: Exception) { /* surface via error state later */ }
    }

    fun clearCelebrate() = _state.update { it.copy(celebrateAssignmentId = null) }
}
