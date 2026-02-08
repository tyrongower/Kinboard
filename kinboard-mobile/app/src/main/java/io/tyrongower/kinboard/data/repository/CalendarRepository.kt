package io.tyrongower.kinboard.data.repository

import io.tyrongower.kinboard.data.api.KinboardApi
import io.tyrongower.kinboard.data.model.CalendarEventItem
import io.tyrongower.kinboard.data.model.CalendarSource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CalendarRepository @Inject constructor(
    private val api: KinboardApi
) {

    fun getCalendarSources(): Flow<Result<List<CalendarSource>>> = flow {
        emit(Result.Loading)
        try {
            val sources = api.getCalendarSources()
            emit(Result.Success(sources))
        } catch (e: Exception) {
            emit(Result.Error(e.message ?: "Failed to fetch calendar sources"))
        }
    }

    suspend fun createCalendarSource(
        name: String,
        icalUrl: String,
        colorHex: String,
        enabled: Boolean = true
    ): Result<CalendarSource> {
        return try {
            val source = CalendarSource(
                id = 0,
                name = name,
                icalUrl = icalUrl,
                colorHex = colorHex,
                enabled = enabled,
                displayOrder = 0
            )
            val created = api.createCalendarSource(source)
            Result.Success(created)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to create calendar source")
        }
    }

    suspend fun updateCalendarSource(
        id: Int,
        name: String,
        icalUrl: String,
        colorHex: String,
        enabled: Boolean
    ): Result<Unit> {
        return try {
            val source = CalendarSource(
                id = id,
                name = name,
                icalUrl = icalUrl,
                colorHex = colorHex,
                enabled = enabled,
                displayOrder = 0
            )
            api.updateCalendarSource(id, source)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to update calendar source")
        }
    }

    suspend fun deleteCalendarSource(id: Int): Result<Unit> {
        return try {
            api.deleteCalendarSource(id)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to delete calendar source")
        }
    }

    suspend fun updateCalendarSourceOrder(order: List<Int>): Result<Unit> {
        return try {
            api.updateCalendarSourceOrder(order)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to update calendar source order")
        }
    }

    suspend fun getCalendarEvents(
        start: String,
        end: String,
        includeSourceIds: List<Int>? = null
    ): Result<List<CalendarEventItem>> {
        return try {
            val include = includeSourceIds?.joinToString(",")
            val events = api.getCalendarEvents(start, end, include)
            Result.Success(events)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to fetch calendar events")
        }
    }

    suspend fun testIcalUrl(url: String): Result<Boolean> {
        return try {
            // Simple validation - in a real app, you might want to actually fetch and parse
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                return Result.Error("URL must start with http:// or https://")
            }
            if (!url.contains(".ics") && !url.contains("calendar")) {
                return Result.Error("URL does not appear to be a valid iCal feed")
            }
            Result.Success(true)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to validate iCal URL")
        }
    }
}
