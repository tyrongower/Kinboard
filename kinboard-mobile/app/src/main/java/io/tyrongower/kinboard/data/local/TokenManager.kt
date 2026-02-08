package io.tyrongower.kinboard.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "kinboard_prefs")

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore

    companion object {
        private val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
        private val ROLE_KEY = stringPreferencesKey("role")
        private val KIOSK_TOKEN_KEY = stringPreferencesKey("kiosk_token")
        private val SERVER_URL_KEY = stringPreferencesKey("server_url")
    }

    suspend fun saveAccessToken(token: String) {
        dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN_KEY] = token
        }
    }

    suspend fun getAccessToken(): String? {
        return dataStore.data.map { preferences ->
            preferences[ACCESS_TOKEN_KEY]
        }.first()
    }

    suspend fun saveRole(role: String) {
        dataStore.edit { preferences ->
            preferences[ROLE_KEY] = role
        }
    }

    suspend fun getRole(): String? {
        return dataStore.data.map { preferences ->
            preferences[ROLE_KEY]
        }.first()
    }

    suspend fun saveKioskToken(token: String) {
        dataStore.edit { preferences ->
            preferences[KIOSK_TOKEN_KEY] = token
        }
    }

    suspend fun getKioskToken(): String? {
        return dataStore.data.map { preferences ->
            preferences[KIOSK_TOKEN_KEY]
        }.first()
    }

    suspend fun saveServerUrl(url: String) {
        dataStore.edit { preferences ->
            preferences[SERVER_URL_KEY] = url
        }
    }

    suspend fun getServerUrl(): String? {
        return dataStore.data.map { preferences ->
            preferences[SERVER_URL_KEY]
        }.first()
    }

    fun getServerUrlFlow(): Flow<String?> {
        return dataStore.data.map { preferences ->
            preferences[SERVER_URL_KEY]
        }
    }

    suspend fun clearTokens() {
        dataStore.edit { preferences ->
            preferences.remove(ACCESS_TOKEN_KEY)
            preferences.remove(ROLE_KEY)
            preferences.remove(KIOSK_TOKEN_KEY)
        }
    }

    suspend fun clearAll() {
        dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
