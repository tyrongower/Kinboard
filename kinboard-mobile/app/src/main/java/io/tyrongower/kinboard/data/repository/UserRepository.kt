package io.tyrongower.kinboard.data.repository

import io.tyrongower.kinboard.data.api.KinboardApi
import io.tyrongower.kinboard.data.model.User
import io.tyrongower.kinboard.data.repository.Result
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepository @Inject constructor(
    private val api: KinboardApi
) {

    suspend fun getUsers(): Result<List<User>> {
        return try {
            val users = api.getUsers()
            Result.Success(users)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to fetch users")
        }
    }
}
