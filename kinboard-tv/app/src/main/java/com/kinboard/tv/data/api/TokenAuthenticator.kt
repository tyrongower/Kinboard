package com.kinboard.tv.data.api

import android.content.Context
import com.kinboard.tv.data.model.KioskAuthRequest
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

class TokenAuthenticator(
    private val context: Context,
): Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        return runBlocking {
            val sessionManager = SessionManager(context)
            val currentToken = sessionManager.getAccessToken()
            val baseUrl = sessionManager.getBaseUrl()
            val storedPin = sessionManager.getPin()

            if (storedPin == null || baseUrl == null) {
                // Cannot reauthenticate if we don't have the pin and baseUrl
                return@runBlocking null
            }

            val newAuthResponse = ApiClient.getApi(context).authenticate(KioskAuthRequest(storedPin))

            if (newAuthResponse.isSuccessful && newAuthResponse.body() != null) {
                val newAccessToken = newAuthResponse.body()!!.accessToken
                sessionManager.setAccessToken(newAccessToken)

                response.request.newBuilder()
                    .header("Authorization", "Bearer $newAccessToken")
                    .build()
            } else {
                null
            }
        }
    }
}
