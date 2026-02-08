package com.kinboard.tv.data.api

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "session")

class SessionManager(private val context: Context) {

    companion object {
        private val BASE_URL = stringPreferencesKey("base_url")
        private val ACCESS_TOKEN = stringPreferencesKey("access_token")
        private val PIN = stringPreferencesKey("pin")
    }

    suspend fun setBaseUrl(baseUrl: String) {
        context.dataStore.edit {
            it[BASE_URL] = baseUrl
        }
    }

    suspend fun getBaseUrl(): String? {
        return context.dataStore.data.map { it[BASE_URL] }.first()
    }

    suspend fun setAccessToken(accessToken: String) {
        context.dataStore.edit {
            it[ACCESS_TOKEN] = accessToken
        }
    }

    suspend fun getAccessToken(): String? {
        return context.dataStore.data.map { it[ACCESS_TOKEN] }.first()
    }

    suspend fun setPin(pin: String) {
        context.dataStore.edit {
            it[PIN] = pin
        }
    }

    suspend fun getPin(): String? {
        return context.dataStore.data.map { it[PIN] }.first()
    }

    suspend fun clear() {
        context.dataStore.edit {
            it.clear()
        }
    }

    suspend fun clearAccessToken() {
        context.dataStore.edit {
            it.remove(ACCESS_TOKEN)
            it.remove(PIN)
        }
    }
}
