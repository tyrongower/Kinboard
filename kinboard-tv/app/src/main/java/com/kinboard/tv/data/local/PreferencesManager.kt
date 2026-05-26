package com.kinboard.tv.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.kinboard.tv.data.model.CalendarEvent
import com.kinboard.tv.data.model.Job
import com.kinboard.tv.data.model.User
import com.kinboard.tv.data.model.WeatherData
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "kinboard_preferences")

class PreferencesManager(private val context: Context) {
    
    companion object {
        private val SERVER_URL_KEY = stringPreferencesKey("server_url")
        private val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
        private val JOBS_KEY = stringPreferencesKey("cache_jobs")
        private val USERS_KEY = stringPreferencesKey("cache_users")
        private val WEATHER_KEY = stringPreferencesKey("cache_weather")
        private val CAL_KEY = stringPreferencesKey("cache_calendar")
        private val gson by lazy { com.google.gson.Gson() }
    }
    
    // Server URL
    val serverUrlFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[SERVER_URL_KEY]
    }
    
    suspend fun getServerUrl(): String? {
        return context.dataStore.data.first()[SERVER_URL_KEY]
    }
    
    suspend fun saveServerUrl(url: String) {
        context.dataStore.edit { preferences ->
            preferences[SERVER_URL_KEY] = url
        }
    }
    
    // Access Token
    val accessTokenFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[ACCESS_TOKEN_KEY]
    }
    
    suspend fun getAccessToken(): String? {
        return context.dataStore.data.first()[ACCESS_TOKEN_KEY]
    }
    
    suspend fun saveAccessToken(token: String) {
        context.dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN_KEY] = token
        }
    }
    
    suspend fun clearAccessToken() {
        context.dataStore.edit { preferences ->
            preferences.remove(ACCESS_TOKEN_KEY)
        }
    }
    
    suspend fun clearAll() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
    
    // Check if user is logged in
    val isLoggedInFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[ACCESS_TOKEN_KEY] != null && preferences[SERVER_URL_KEY] != null
    }
    
    suspend fun isLoggedIn(): Boolean {
        val prefs = context.dataStore.data.first()
        return prefs[ACCESS_TOKEN_KEY] != null && prefs[SERVER_URL_KEY] != null
    }

    // Jobs cache
    suspend fun saveJobs(jobs: List<Job>) {
        context.dataStore.edit { preferences ->
            preferences[JOBS_KEY] = gson.toJson(jobs)
        }
    }

    suspend fun getJobs(): List<Job> {
        val json = context.dataStore.data.first()[JOBS_KEY] ?: return emptyList()
        return try {
            gson.fromJson(json, Array<Job>::class.java).toList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    // Users cache
    suspend fun saveUsers(users: List<User>) {
        context.dataStore.edit { preferences ->
            preferences[USERS_KEY] = gson.toJson(users)
        }
    }

    suspend fun getUsers(): List<User> {
        val json = context.dataStore.data.first()[USERS_KEY] ?: return emptyList()
        return try {
            gson.fromJson(json, Array<User>::class.java).toList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    // Weather cache
    suspend fun saveWeather(weather: WeatherData) {
        context.dataStore.edit { preferences ->
            preferences[WEATHER_KEY] = gson.toJson(weather)
        }
    }

    suspend fun getWeather(): WeatherData? {
        val json = context.dataStore.data.first()[WEATHER_KEY] ?: return null
        return try {
            gson.fromJson(json, WeatherData::class.java)
        } catch (e: Exception) {
            null
        }
    }

    // Calendar events cache
    suspend fun saveCalendarEvents(events: List<CalendarEvent>) {
        context.dataStore.edit { preferences ->
            preferences[CAL_KEY] = gson.toJson(events)
        }
    }

    suspend fun getCalendarEvents(): List<CalendarEvent> {
        val json = context.dataStore.data.first()[CAL_KEY] ?: return emptyList()
        return try {
            gson.fromJson(json, Array<CalendarEvent>::class.java).toList()
        } catch (e: Exception) {
            emptyList()
        }
    }
}
