package com.kinboard.tv.data.api

import android.content.Context
import com.kinboard.tv.data.model.KioskAuthRequest
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

object AuthEvents {
    private val _logoutRequired = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val logoutRequired: SharedFlow<Unit> = _logoutRequired.asSharedFlow()
    fun signalLogout() { _logoutRequired.tryEmit(Unit) }
}

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
            val currentToken = sessionManager.getAccessToken()
            val baseUrl = sessionManager.getBaseUrl()
            val storedPin = sessionManager.getPin()

            if (storedPin == null || baseUrl == null) {
                AuthEvents.signalLogout()
                return@runBlocking null
            }

            val newAuthResponse = ApiClient.getApi(context).authenticate(KioskAuthRequest(storedPin))

            if (newAuthResponse.isSuccessful && newAuthResponse.body() != null) {
                val newAccessToken = newAuthResponse.body()!!.accessToken
                sessionManager.setAccessToken(newAccessToken)

                response.request.newBuilder()
                    .header("Authorization", "Bearer $newAccessToken")
                    .build()
            } else if (newAuthResponse.code() == 401) {
                sessionManager.clearPin()
                sessionManager.clearAccessToken()
                AuthEvents.signalLogout()
                null
            } else {
                null
            }
        }
    }
}
