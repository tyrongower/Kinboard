package com.kinboard.tv.data.api

import android.content.Context
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    private const val TIMEOUT_SECONDS = 30L

    private var retrofit: Retrofit? = null
    private var api: KinboardApi? = null
    private var sessionManager: SessionManager? = null

    fun initialize(context: Context, baseUrl: String) {
        this.sessionManager = SessionManager(context)
        runBlocking {
            sessionManager?.setBaseUrl(baseUrl)
        }
        this.retrofit = null
        this.api = null
    }

    fun setAccessToken(token: String) {
        runBlocking {
            sessionManager?.setAccessToken(token)
        }
        // Rebuild retrofit to use new token
        this.retrofit = null
        this.api = null
    }

    fun getAccessToken(): String? = runBlocking {
        sessionManager?.getAccessToken()
    }

    fun getBaseUrl(): String? = runBlocking {
        sessionManager?.getBaseUrl()
    }

    private fun createAuthInterceptor(): Interceptor {
        return Interceptor { chain ->
            val originalRequest = chain.request()
            val requestBuilder = originalRequest.newBuilder()
                .header("Content-Type", "application/json")

            getAccessToken()?.let { token ->
                requestBuilder.header("Authorization", "Bearer $token")
            }

            chain.proceed(requestBuilder.build())
        }
    }

    private fun createLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }

    private fun createOkHttpClient(context: Context): OkHttpClient {
        return OkHttpClient.Builder()
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .addInterceptor(createAuthInterceptor())
            .addInterceptor(createLoggingInterceptor())
            .authenticator(TokenAuthenticator(context))
            .build()
    }

    private fun getRetrofit(context: Context): Retrofit {
        if (retrofit == null) {
            val baseUrl = getBaseUrl()
                ?: throw IllegalStateException("Base URL not initialized. Call initialize() first.")

            retrofit = Retrofit.Builder()
                .baseUrl("$baseUrl/")
                .client(createOkHttpClient(context))
                .addConverterFactory(GsonConverterFactory.create())
                .build()
        }
        return retrofit!!
    }

    fun getApi(context: Context): KinboardApi {
        if (api == null) {
            api = getRetrofit(context).create(KinboardApi::class.java)
        }
        return api!!
    }
}
