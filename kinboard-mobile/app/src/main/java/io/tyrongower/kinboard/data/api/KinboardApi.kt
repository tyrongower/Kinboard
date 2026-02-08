package io.tyrongower.kinboard.data.api

import io.tyrongower.kinboard.data.model.*
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

interface KinboardApi {

    // Authentication
    @POST("api/auth/admin/login")
    suspend fun adminLogin(@Body request: LoginRequest): AuthResponse

    @POST("api/auth/admin/refresh")
    suspend fun refreshToken(): AuthResponse

    @POST("api/auth/admin/logout")
    suspend fun adminLogout(): Response<Unit>

    @POST("api/auth/kiosk/authenticate")
    suspend fun kioskAuthenticate(@Body request: KioskAuthRequest): AuthResponse

    @GET("api/auth/status")
    suspend fun getAuthStatus(): AuthResponse

    // Shopping Lists
    @GET("api/shoppinglists")
    suspend fun getShoppingLists(): List<ShoppingList>

    @GET("api/shoppinglists/{id}")
    suspend fun getShoppingList(@Path("id") id: Int): ShoppingList

    @POST("api/shoppinglists")
    suspend fun createShoppingList(@Body request: CreateShoppingListRequest): ShoppingList

    @PUT("api/shoppinglists/{id}")
    suspend fun updateShoppingList(@Path("id") id: Int, @Body list: ShoppingList): Response<Unit>

    @DELETE("api/shoppinglists/{id}")
    suspend fun deleteShoppingList(@Path("id") id: Int): Response<Unit>

    @PUT("api/shoppinglists/order")
    suspend fun updateShoppingListOrder(@Body order: List<Int>): Response<Unit>

    @Multipart
    @POST("api/shoppinglists/{id}/avatar")
    suspend fun uploadShoppingListAvatar(
        @Path("id") id: Int,
        @Part file: MultipartBody.Part
    ): AvatarUploadResponse

    @DELETE("api/shoppinglists/{id}/avatar")
    suspend fun deleteShoppingListAvatar(@Path("id") id: Int): Response<Unit>

    // Shopping Items
    @GET("api/shoppinglists/{listId}/items")
    suspend fun getShoppingItems(@Path("listId") listId: Int): List<ShoppingItem>

    @POST("api/shoppinglists/{listId}/items")
    suspend fun createShoppingItem(
        @Path("listId") listId: Int,
        @Body request: CreateShoppingItemRequest
    ): ShoppingItem

    @PUT("api/shoppinglists/{listId}/items/{id}")
    suspend fun updateShoppingItem(
        @Path("listId") listId: Int,
        @Path("id") id: Int,
        @Body item: ShoppingItem
    ): Response<Unit>

    @DELETE("api/shoppinglists/{listId}/items/{id}")
    suspend fun deleteShoppingItem(
        @Path("listId") listId: Int,
        @Path("id") id: Int
    ): Response<Unit>

    @POST("api/shoppinglists/{listId}/items/{id}/toggle")
    suspend fun toggleShoppingItemBought(
        @Path("listId") listId: Int,
        @Path("id") id: Int
    ): ShoppingItem

    @POST("api/shoppinglists/{listId}/items/{id}/important")
    suspend fun toggleShoppingItemImportant(
        @Path("listId") listId: Int,
        @Path("id") id: Int
    ): ShoppingItem

    @PUT("api/shoppinglists/{listId}/items/order")
    suspend fun updateShoppingItemOrder(
        @Path("listId") listId: Int,
        @Body order: List<Int>
    ): Response<Unit>

    @DELETE("api/shoppinglists/{listId}/items/bought")
    suspend fun clearBoughtItems(@Path("listId") listId: Int): Response<Unit>

    // Users
    @GET("api/users")
    suspend fun getUsers(): List<User>

    // Jobs (placeholder for future implementation)
    @GET("api/jobs")
    suspend fun getJobs(@Query("date") date: String? = null): List<Job>

    // Calendar
    @GET("api/calendars")
    suspend fun getCalendarSources(): List<CalendarSource>

    @POST("api/calendars")
    suspend fun createCalendarSource(@Body source: CalendarSource): CalendarSource

    @PUT("api/calendars/{id}")
    suspend fun updateCalendarSource(@Path("id") id: Int, @Body source: CalendarSource): Response<Unit>

    @DELETE("api/calendars/{id}")
    suspend fun deleteCalendarSource(@Path("id") id: Int): Response<Unit>

    @PUT("api/calendars/order")
    suspend fun updateCalendarSourceOrder(@Body order: List<Int>): Response<Unit>

    @GET("api/calendar/events")
    suspend fun getCalendarEvents(
        @Query("start") start: String,
        @Query("end") end: String,
        @Query("include") include: String? = null
    ): List<CalendarEventItem>

    // Site Settings
    @GET("api/sitesettings")
    suspend fun getSiteSettings(): SiteSettings

    @PUT("api/sitesettings")
    suspend fun updateSiteSettings(@Body settings: SiteSettings): Response<Unit>
}
