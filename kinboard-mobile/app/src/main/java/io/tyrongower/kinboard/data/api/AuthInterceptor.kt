package io.tyrongower.kinboard.data.api

import io.tyrongower.kinboard.data.local.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip auth for login/authenticate endpoints
        val url = originalRequest.url.toString()
        if (url.contains("/auth/admin/login") ||
            url.contains("/auth/kiosk/authenticate")) {
            return chain.proceed(originalRequest)
        }

        // Add access token to request
        val accessToken = runBlocking { tokenManager.getAccessToken() }
        val request = if (accessToken != null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $accessToken")
                .build()
        } else {
            originalRequest
        }

        return chain.proceed(request)
    }
}
