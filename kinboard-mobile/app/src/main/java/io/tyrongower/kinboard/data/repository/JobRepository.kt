package io.tyrongower.kinboard.data.repository

import io.tyrongower.kinboard.data.api.KinboardApi
import io.tyrongower.kinboard.data.model.Job
import io.tyrongower.kinboard.data.repository.Result
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class JobRepository @Inject constructor(
    private val api: KinboardApi
) {

    suspend fun getJobsByDate(date: String): Result<List<Job>> {
        return try {
            val jobs = api.getJobs(date)
            Result.Success(jobs)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to fetch jobs")
        }
    }
}
