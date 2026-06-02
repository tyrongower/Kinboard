package com.kinboard.tv.data.api

import android.content.Context
import com.kinboard.tv.data.model.KioskAuthRequest
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

class TokenAuthenticator(
    private val context: Context,
): Authenticator {

    private fun responseCount(response: Response): Int {
        var r: Response? = response
        var count = 0
        while (r != null) { count++; r = r.priorResponse }
        return count
    }

    override fun authenticate(route: Route?, response: Response): Request? {
        return runBlocking {
            if (responseCount(response) >= 2) return@runBlocking null

            val sessionManager = SessionManager(context)
            val baseUrl = sessionManager.getBaseUrl()
            val storedPin = sessionManager.getPin()

            // No stored credentials to refresh with. Never clear login here:
            // only clearing the app cache/storage is allowed to log the device out.
            if (storedPin == null || baseUrl == null) {
                return@runBlocking null
            }

            val newAuthResponse = try {
                ApiClient.getApi(context).authenticate(KioskAuthRequest(storedPin))
            } catch (e: Exception) {
                // Network/server error: fail this request but keep credentials.
                return@runBlocking null
            }

            if (newAuthResponse.isSuccessful && newAuthResponse.body() != null) {
                val newAccessToken = newAuthResponse.body()!!.accessToken
                sessionManager.setAccessToken(newAccessToken)

                response.request.newBuilder()
                    .header("Authorization", "Bearer $newAccessToken")
                    .build()
            } else {
                // Refresh failed (including 401). Do NOT clear stored credentials and
                // do NOT force logout — the device stays "logged in" and will retry
                // on the next request. Clearing the app cache is the only logout path.
                null
            }
        }
    }
}
