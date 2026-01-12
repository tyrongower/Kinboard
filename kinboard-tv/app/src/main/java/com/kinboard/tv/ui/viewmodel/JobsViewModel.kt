package com.kinboard.tv.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kinboard.tv.data.api.ApiClient
import com.kinboard.tv.data.model.Job
import com.kinboard.tv.data.model.JobAssignment
import com.kinboard.tv.data.model.User
import com.kinboard.tv.ui.components.UserJobData
import kotlinx.coroutines.Job as CoroutineJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.LocalDate

data class JobsUiState(
    val selectedDate: LocalDate = LocalDate.now(),
    val users: List<User> = emptyList(),
    val jobs: List<Job> = emptyList(),
    val userJobsData: List<UserJobData> = emptyList(),
    val hideCompletedMap: Map<Int, Boolean> = emptyMap(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val focusedUserId: Int? = null // null means focus first card
)

class JobsViewModel(application: Application) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(JobsUiState())
    val uiState: StateFlow<JobsUiState> = _uiState.asStateFlow()

    private var refreshJob: CoroutineJob? = null
    private val refreshIntervalMs = 30_000L // 10 seconds

    init {
        loadData()
        startAutoRefresh()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            try {
                // Fetch users
                val usersResponse = ApiClient.getApi(getApplication()).getUsers()
                if (!usersResponse.isSuccessful) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "API error: ${usersResponse.code()}"
                    )
                    return@launch
                }

                val users = usersResponse.body() ?: emptyList()

                // Initialize hideCompletedMap from user preferences
                val hideCompletedMap = users.associate { user ->
                    user.id to (user.hideCompletedInKiosk ?: false)
                }

                // Fetch jobs for selected date
                val dateString = _uiState.value.selectedDate.toString()
                val jobsResponse = ApiClient.getApi(getApplication()).getJobs(dateString)
                if (!jobsResponse.isSuccessful) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "API error: ${jobsResponse.code()}"
                    )
                    return@launch
                }

                val jobs = jobsResponse.body() ?: emptyList()

                // Process and group jobs by user
                val userJobsData = processJobsData(users, jobs)

                _uiState.value = _uiState.value.copy(
                    users = users,
                    jobs = jobs,
                    userJobsData = userJobsData,
                    hideCompletedMap = hideCompletedMap,
                    isLoading = false,
                    errorMessage = null
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to load data: ${e.message}"
                )
            }
        }
    }

    private fun processJobsData(users: List<User>, jobs: List<Job>): List<UserJobData> {
        // Group jobs by user
        val userJobsMap = mutableMapOf<Int, MutableList<Pair<Job, JobAssignment>>>()

        // Initialize map with all users
        users.forEach { user ->
            userJobsMap[user.id] = mutableListOf()
        }

        // Add unassigned user placeholder
        val unassignedUserId = -1
        userJobsMap[unassignedUserId] = mutableListOf()

        // Process each job and its assignments
        jobs.forEach { job ->
            val assignments = job.assignments ?: emptyList()

            if (assignments.isEmpty()) {
                // Unassigned job
                userJobsMap[unassignedUserId]?.add(
                    job to JobAssignment(
                        id = -1,
                        jobId = job.id,
                        userId = unassignedUserId,
                        displayOrder = 0,
                        isCompleted = false
                    )
                )
            } else {
                assignments.forEach { assignment ->
                    val userId = assignment.userId
                    if (userJobsMap.containsKey(userId)) {
                        userJobsMap[userId]?.add(job to assignment)
                    }
                }
            }
        }

        // Convert to UserJobData list
        val result = mutableListOf<UserJobData>()

        // Add users with jobs (sorted by displayOrder)
        users.sortedBy { it.displayOrder ?: Int.MAX_VALUE }.forEach { user ->
            val userJobs = userJobsMap[user.id] ?: emptyList()
            if (userJobs.isNotEmpty()) {
                val completedCount = userJobs.count { (_, assignment) -> assignment.isCompleted == true }
                result.add(
                    UserJobData(
                        user = user,
                        jobs = userJobs.sortedBy { (_, assignment) -> assignment.displayOrder },
                        completedCount = completedCount,
                        totalCount = userJobs.size
                    )
                )
            }
        }

        // Add unassigned jobs if any
        val unassignedJobs = userJobsMap[unassignedUserId] ?: emptyList()
        if (unassignedJobs.isNotEmpty()) {
            result.add(
                UserJobData(
                    user = User(
                        id = unassignedUserId,
                        displayName = "Unassigned",
                        colorHex = "#94a3b8"
                    ),
                    jobs = unassignedJobs,
                    completedCount = unassignedJobs.count { (_, assignment) -> assignment.isCompleted == true },
                    totalCount = unassignedJobs.size
                )
            )
        }

        return result
    }

    fun selectDate(date: LocalDate) {
        _uiState.value = _uiState.value.copy(selectedDate = date)
        loadData()
    }

    fun goToPreviousDay() {
        selectDate(_uiState.value.selectedDate.minusDays(1))
    }

    fun goToToday() {
        selectDate(LocalDate.now())
    }

    fun goToNextDay() {
        selectDate(_uiState.value.selectedDate.plusDays(1))
    }

    fun setFocusedUserId(userId: Int?) {
        _uiState.value = _uiState.value.copy(focusedUserId = userId)
    }

    fun toggleHideCompleted(user: User) {
        viewModelScope.launch {
            try {
                val response = ApiClient.getApi(getApplication()).toggleHideCompleted(user.id)
                if (response.isSuccessful && response.body() != null) {
                    val newValue = response.body()!!.hideCompletedInKiosk
                    _uiState.value = _uiState.value.copy(
                        hideCompletedMap = _uiState.value.hideCompletedMap + (user.id to newValue)
                    )
                }
            } catch (e: Exception) {
                // Toggle locally on error
                val currentValue = _uiState.value.hideCompletedMap[user.id] ?: false
                _uiState.value = _uiState.value.copy(
                    hideCompletedMap = _uiState.value.hideCompletedMap + (user.id to !currentValue)
                )
            }
        }
    }

    fun toggleJobComplete(job: Job, assignment: JobAssignment, date: String) {
        viewModelScope.launch {
            try {
                val isCurrentlyCompleted = assignment.isCompleted == true
                val newCompletedState = !isCurrentlyCompleted

                val response = if (isCurrentlyCompleted) {
                    ApiClient.getApi(getApplication()).uncompleteJob(job.id, assignment.id, date)
                } else {
                    ApiClient.getApi(getApplication()).completeJob(job.id, assignment.id, date)
                }

                if (response.isSuccessful) {
                    // Update state locally instead of full reload
                    updateJobCompletionLocally(job.id, assignment.id, newCompletedState)
                } else {
                     _uiState.value = _uiState.value.copy(
                        errorMessage = "API error: ${response.code()}"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    errorMessage = "Failed to update job: ${e.message}"
                )
            }
        }
    }

    private fun updateJobCompletionLocally(jobId: Int, assignmentId: Int, isCompleted: Boolean) {
        val currentState = _uiState.value

        // Update the userJobsData with the new completion state
        val updatedUserJobsData = currentState.userJobsData.map { userJobData ->
            // Check if this user has the assignment we're updating
            val hasAssignment = userJobData.jobs.any { (job, assignment) ->
                job.id == jobId && assignment.id == assignmentId
            }

            if (hasAssignment) {
                // Update the jobs list with the new completion state
                val updatedJobs = userJobData.jobs.map { (job, assignment) ->
                    if (job.id == jobId && assignment.id == assignmentId) {
                        job to assignment.copy(isCompleted = isCompleted)
                    } else {
                        job to assignment
                    }
                }

                // Recalculate completed count
                val newCompletedCount = updatedJobs.count { (_, assignment) -> assignment.isCompleted == true }

                userJobData.copy(
                    jobs = updatedJobs,
                    completedCount = newCompletedCount
                )
            } else {
                userJobData
            }
        }

        _uiState.value = currentState.copy(userJobsData = updatedUserJobsData)
    }

    private fun startAutoRefresh() {
        refreshJob?.cancel()
        refreshJob = viewModelScope.launch {
            while (isActive) {
                delay(refreshIntervalMs)
                if (!_uiState.value.isLoading) {
                    refreshJobsQuietly()
                }
            }
        }
    }

    private suspend fun refreshJobsQuietly() {
        try {
            val dateString = _uiState.value.selectedDate.toString()
            val jobsResponse = ApiClient.getApi(getApplication()).getJobs(dateString)

            if (jobsResponse.isSuccessful) {
                val jobs = jobsResponse.body() ?: emptyList()
                val userJobsData = processJobsData(_uiState.value.users, jobs)

                _uiState.value = _uiState.value.copy(
                    jobs = jobs,
                    userJobsData = userJobsData
                )
            }
        } catch (e: Exception) {
            // Silently fail on auto-refresh errors
        }
    }

    override fun onCleared() {
        super.onCleared()
        refreshJob?.cancel()
    }
}
