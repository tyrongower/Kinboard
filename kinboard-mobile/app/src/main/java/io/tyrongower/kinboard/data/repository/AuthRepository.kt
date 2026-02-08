package io.tyrongower.kinboard.data.repository

import io.tyrongower.kinboard.data.api.KinboardApi
import io.tyrongower.kinboard.data.local.TokenManager
import io.tyrongower.kinboard.data.model.AuthResponse
import io.tyrongower.kinboard.data.model.KioskAuthRequest
import io.tyrongower.kinboard.data.model.LoginRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

sealed class AuthResult {
    data class Success(val response: AuthResponse) : AuthResult()
    data class Error(val message: String) : AuthResult()
}

@Singleton
class AuthRepository @Inject constructor(
    private val api: KinboardApi,
    private val tokenManager: TokenManager
) {

    suspend fun adminLogin(email: String, password: String, serverUrl: String): AuthResult {
        return try {
            // Save server URL first
            tokenManager.saveServerUrl(serverUrl)

            val response = api.adminLogin(LoginRequest(email, password))
            tokenManager.saveAccessToken(response.accessToken)
            tokenManager.saveRole(response.role)
            AuthResult.Success(response)
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Login failed")
        }
    }

    suspend fun kioskAuthenticate(token: String, serverUrl: String): AuthResult {
        return try {
            // Save server URL first
            tokenManager.saveServerUrl(serverUrl)

            val response = api.kioskAuthenticate(KioskAuthRequest(token))
            tokenManager.saveAccessToken(response.accessToken)
            tokenManager.saveRole(response.role)
            tokenManager.saveKioskToken(token)
            AuthResult.Success(response)
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Authentication failed")
        }
    }

    suspend fun refreshToken(): AuthResult {
        return try {
            val role = tokenManager.getRole()
            val response = if (role == "kiosk") {
                // Re-authenticate with kiosk token
                val kioskToken = tokenManager.getKioskToken()
                    ?: return AuthResult.Error("No kiosk token found")
                api.kioskAuthenticate(KioskAuthRequest(kioskToken))
            } else {
                // Use refresh token endpoint for admin
                api.refreshToken()
            }
            tokenManager.saveAccessToken(response.accessToken)
            AuthResult.Success(response)
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Token refresh failed")
        }
    }

    suspend fun logout() {
        try {
            api.adminLogout()
        } catch (e: Exception) {
            // Ignore errors on logout
        } finally {
            tokenManager.clearTokens()
        }
    }

    suspend fun getRole(): String? {
        return tokenManager.getRole()
    }

    suspend fun isAuthenticated(): Boolean {
        return tokenManager.getAccessToken() != null
    }

    fun getServerUrlFlow(): Flow<String?> {
        return tokenManager.getServerUrlFlow()
    }
}
