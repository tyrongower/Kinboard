package com.kinboard.tv.data.api

import com.kinboard.tv.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface KinboardApi {
    
    // Authentication
    
    @POST("api/auth/kiosk/authenticate")
    suspend fun authenticate(
        @Body request: KioskAuthRequest
    ): Response<AuthResponse>
    
    @GET("api/auth/status")
    suspend fun getAuthStatus(): Response<AuthStatusResponse>
    
    // Jobs
    
    @GET("api/jobs")
    suspend fun getJobs(
        @Query("date") date: String  // YYYY-MM-DD format
    ): Response<List<Job>>
    
    @POST("api/jobs/{jobId}/assignments/{assignmentId}/complete")
    suspend fun completeJob(
        @Path("jobId") jobId: Int,
        @Path("assignmentId") assignmentId: Int,
        @Query("date") date: String  // YYYY-MM-DD format
    ): Response<Unit>
    
    @DELETE("api/jobs/{jobId}/assignments/{assignmentId}/complete")
    suspend fun uncompleteJob(
        @Path("jobId") jobId: Int,
        @Path("assignmentId") assignmentId: Int,
        @Query("date") date: String  // YYYY-MM-DD format
    ): Response<Unit>
    
    // Users
    
    @GET("api/users")
    suspend fun getUsers(): Response<List<User>>
    
    @PATCH("api/users/{userId}/hide-completed")
    suspend fun toggleHideCompleted(
        @Path("userId") userId: Int
    ): Response<HideCompletedResponse>
    
    // Site Settings

    @GET("api/sitesettings")
    suspend fun getSiteSettings(): Response<SiteSettings>

    // Weather

    @GET("api/weather")
    suspend fun getWeather(): Response<WeatherData>
}
