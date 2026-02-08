package io.tyrongower.kinboard.data.api

import io.tyrongower.kinboard.data.local.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BaseUrlInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Get server URL from TokenManager
        val serverUrl = runBlocking {
            tokenManager.getServerUrl()
        }

        // If no server URL is set, use the original request
        if (serverUrl.isNullOrBlank()) {
            return chain.proceed(originalRequest)
        }

        // Parse the server URL
        val newBaseUrl = serverUrl.toHttpUrlOrNull()
            ?: return chain.proceed(originalRequest)

        // Build new URL with the dynamic base URL
        val newUrl = originalRequest.url.newBuilder()
            .scheme(newBaseUrl.scheme)
            .host(newBaseUrl.host)
            .port(newBaseUrl.port)
            .build()

        // Build new request with the new URL
        val newRequest = originalRequest.newBuilder()
            .url(newUrl)
            .build()

        return chain.proceed(newRequest)
    }
}
