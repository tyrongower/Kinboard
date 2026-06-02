package com.kinboard.tv.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kinboard.tv.BuildConfig
import com.kinboard.tv.data.api.ApiClient
import com.kinboard.tv.data.api.SessionManager
import com.kinboard.tv.data.model.DevicePollRequest
import com.kinboard.tv.data.model.KioskAuthRequest
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class LoginUiState(
    val serverUrl: String = "",
    val kioskToken: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isAuthenticated: Boolean = false
)

data class PairingUiState(
    val isLoading: Boolean = false,
    val qrContent: String? = null,   // URL encoded into the QR shown on screen
    val userCode: String? = null,
    val errorMessage: String? = null,
    val expired: Boolean = false
)

class LoginViewModel(application: Application) : AndroidViewModel(application) {

    private val sessionManager = SessionManager(application)

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    private val _pairingState = MutableStateFlow(PairingUiState())
    val pairingState: StateFlow<PairingUiState> = _pairingState.asStateFlow()

    /** Server URL baked in at build time (empty for local/dev builds). */
    val configuredServerUrl: String = BuildConfig.SERVER_URL

    /** True when a server URL is baked in, so QR pairing can be used. */
    val canPair: Boolean = configuredServerUrl.isNotBlank()

    private var pollingJob: Job? = null

    init {
        loadSavedCredentials()
    }

    private fun loadSavedCredentials() {
        viewModelScope.launch {
            val savedUrl = sessionManager.getBaseUrl()
            val savedToken = sessionManager.getAccessToken()

            _uiState.value = _uiState.value.copy(
                // Prefill the manual field with the saved or baked-in URL.
                serverUrl = savedUrl ?: configuredServerUrl,
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

    // ---- Device pairing (QR "login via mobile") ----

    /**
     * Starts a pairing session against the baked-in server, shows a QR code, and
     * polls for approval. Safe to call repeatedly; restarts a fresh session.
     */
    fun startPairing() {
        val serverUrl = configuredServerUrl.trimEnd('/')
        if (serverUrl.isBlank()) {
            _pairingState.value = PairingUiState(
                errorMessage = "This build has no server configured. Use manual login instead."
            )
            return
        }

        pollingJob?.cancel()
        _pairingState.value = PairingUiState(isLoading = true)

        pollingJob = viewModelScope.launch {
            try {
                ApiClient.initialize(getApplication(), serverUrl)
                val api = ApiClient.getApi(getApplication())

                val startResp = api.deviceStart()
                if (!startResp.isSuccessful || startResp.body() == null) {
                    _pairingState.value = PairingUiState(
                        errorMessage = "Couldn't start pairing (${startResp.code()}). Try again."
                    )
                    return@launch
                }

                val start = startResp.body()!!
                val qrContent = "$serverUrl/pair?code=${start.userCode}"
                _pairingState.value = PairingUiState(
                    isLoading = false,
                    qrContent = qrContent,
                    userCode = start.userCode
                )

                val intervalMs = (start.intervalSeconds.coerceAtLeast(1)) * 1000L
                val deadline = System.currentTimeMillis() + start.expiresInSeconds * 1000L

                while (isActive && System.currentTimeMillis() < deadline) {
                    delay(intervalMs)

                    val pollResp = try {
                        api.devicePoll(DevicePollRequest(deviceCode = start.deviceCode))
                    } catch (e: Exception) {
                        // Transient network error — keep polling until the deadline.
                        continue
                    }

                    val body = pollResp.body()
                    if (!pollResp.isSuccessful || body == null) continue

                    when (body.status) {
                        "approved" -> {
                            val kioskToken = body.kioskToken
                            val accessToken = body.accessToken
                            if (kioskToken != null && accessToken != null) {
                                sessionManager.setBaseUrl(serverUrl)
                                sessionManager.setAccessToken(accessToken)
                                sessionManager.setPin(kioskToken)
                                ApiClient.setAccessToken(accessToken)

                                _pairingState.value = PairingUiState()
                                _uiState.value = _uiState.value.copy(isAuthenticated = true)
                            }
                            return@launch
                        }
                        "expired" -> {
                            _pairingState.value = _pairingState.value.copy(
                                expired = true,
                                qrContent = null,
                                errorMessage = "This code expired. Generate a new one."
                            )
                            return@launch
                        }
                        // "pending" — keep polling.
                    }
                }

                // Loop ended without approval (local deadline reached).
                if (isActive) {
                    _pairingState.value = _pairingState.value.copy(
                        expired = true,
                        qrContent = null,
                        errorMessage = "This code expired. Generate a new one."
                    )
                }
            } catch (e: Exception) {
                _pairingState.value = PairingUiState(
                    errorMessage = "Pairing error: ${e.message ?: "check your connection"}"
                )
            }
        }
    }

    /** Stops polling and clears pairing UI state (e.g. when leaving the screen). */
    fun stopPairing() {
        pollingJob?.cancel()
        pollingJob = null
        _pairingState.value = PairingUiState()
    }

    fun logout() {
        viewModelScope.launch {
            sessionManager.clearAccessToken()

            _uiState.value = LoginUiState(
                serverUrl = _uiState.value.serverUrl // Keep server URL
            )
        }
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}
