package com.kinboard.tv.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kinboard.tv.data.api.ApiClient
import com.kinboard.tv.data.api.SessionManager
import com.kinboard.tv.data.model.KioskAuthRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val serverUrl: String = "",
    val kioskToken: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isAuthenticated: Boolean = false
)

class LoginViewModel(application: Application) : AndroidViewModel(application) {

    private val sessionManager = SessionManager(application)

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    init {
        loadSavedCredentials()
    }

    private fun loadSavedCredentials() {
        viewModelScope.launch {
            val savedUrl = sessionManager.getBaseUrl()
            val savedToken = sessionManager.getAccessToken()

            _uiState.value = _uiState.value.copy(
                serverUrl = savedUrl ?: "",
                isAuthenticated = savedToken != null && savedUrl != null
            )

            // Initialize API client if we have saved credentials
            if (savedUrl != null && savedToken != null) {
                ApiClient.initialize(getApplication(), savedUrl)
                ApiClient.setAccessToken(savedToken)
            }
        }
    }

    fun updateServerUrl(url: String) {
        _uiState.value = _uiState.value.copy(
            serverUrl = url,
            errorMessage = null
        )
    }

    fun updateKioskToken(token: String) {
        _uiState.value = _uiState.value.copy(
            kioskToken = token,
            errorMessage = null
        )
    }

    fun authenticate() {
        val currentState = _uiState.value

        if (currentState.serverUrl.isBlank()) {
            _uiState.value = currentState.copy(errorMessage = "Server URL is required")
            return
        }

        if (currentState.kioskToken.isBlank()) {
            _uiState.value = currentState.copy(errorMessage = "Kiosk token is required")
            return
        }

        viewModelScope.launch {
            _uiState.value = currentState.copy(isLoading = true, errorMessage = null)

            try {
                // Initialize API client with server URL
                ApiClient.initialize(getApplication(), currentState.serverUrl)

                val response = ApiClient.getApi(getApplication()).authenticate(
                    KioskAuthRequest(token = currentState.kioskToken)
                )

                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!

                    // Save credentials
                    sessionManager.setBaseUrl(currentState.serverUrl)
                    sessionManager.setAccessToken(authResponse.accessToken)
                    sessionManager.setPin(currentState.kioskToken)

                    // Set token in API client
                    ApiClient.setAccessToken(authResponse.accessToken)

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isAuthenticated = true,
                        kioskToken = "" // Clear token from memory
                    )
                } else {
                    val errorMsg = when (response.code()) {
                        401 -> "Invalid kiosk token"
                        else -> "Authentication failed: ${response.message()}"
                    }
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errorMsg
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Network error: ${e.message ?: "Please check your connection"}"
                )
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            sessionManager.clearAccessToken()

            _uiState.value = LoginUiState(
                serverUrl = _uiState.value.serverUrl // Keep server URL
            )
        }
    }
}
