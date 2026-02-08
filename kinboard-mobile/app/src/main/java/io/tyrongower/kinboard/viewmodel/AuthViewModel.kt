package io.tyrongower.kinboard.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.tyrongower.kinboard.data.repository.AuthRepository
import io.tyrongower.kinboard.data.repository.AuthResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val role: String? = null,
    val error: String? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _authState = MutableStateFlow(AuthState())
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        checkAuthStatus()
    }

    private fun checkAuthStatus() {
        viewModelScope.launch {
            val isAuthenticated = authRepository.isAuthenticated()
            val role = authRepository.getRole()
            _authState.value = AuthState(
                isAuthenticated = isAuthenticated,
                role = role
            )
        }
    }

    fun adminLogin(email: String, password: String, serverUrl: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)

            when (val result = authRepository.adminLogin(email, password, serverUrl)) {
                is AuthResult.Success -> {
                    _authState.value = AuthState(
                        isAuthenticated = true,
                        role = result.response.role
                    )
                }
                is AuthResult.Error -> {
                    _authState.value = _authState.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
            }
        }
    }

    fun kioskAuthenticate(token: String, serverUrl: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)

            when (val result = authRepository.kioskAuthenticate(token, serverUrl)) {
                is AuthResult.Success -> {
                    _authState.value = AuthState(
                        isAuthenticated = true,
                        role = result.response.role
                    )
                }
                is AuthResult.Error -> {
                    _authState.value = _authState.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _authState.value = AuthState()
        }
    }

    fun clearError() {
        _authState.value = _authState.value.copy(error = null)
    }
}
