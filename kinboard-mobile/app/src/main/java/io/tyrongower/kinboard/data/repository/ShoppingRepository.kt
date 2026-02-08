package io.tyrongower.kinboard.data.repository

import io.tyrongower.kinboard.data.api.KinboardApi
import io.tyrongower.kinboard.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
    object Loading : Result<Nothing>()
}

val <T> Result<T>.isSuccess: Boolean
    get() = this is Result.Success

fun <T> Result<T>.getOrNull(): T? {
    return when (this) {
        is Result.Success -> this.data
        else -> null
    }
}

@Singleton
class ShoppingRepository @Inject constructor(
    private val api: KinboardApi
) {

    fun getShoppingLists(): Flow<Result<List<ShoppingList>>> = flow {
        emit(Result.Loading)
        try {
            val lists = api.getShoppingLists()
            emit(Result.Success(lists))
        } catch (e: Exception) {
            emit(Result.Error(e.message ?: "Failed to fetch shopping lists"))
        }
    }

    suspend fun createShoppingList(name: String, colorHex: String): Result<ShoppingList> {
        return try {
            val request = CreateShoppingListRequest(name, colorHex, 0)
            val list = api.createShoppingList(request)
            Result.Success(list)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to create shopping list")
        }
    }

    suspend fun updateShoppingList(list: ShoppingList): Result<Unit> {
        return try {
            api.updateShoppingList(list.id, list)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to update shopping list")
        }
    }

    suspend fun updateShoppingList(listId: Int, name: String, colorHex: String): Result<Unit> {
        return try {
            // Fetch current list to preserve other fields
            val currentList = api.getShoppingList(listId)
            val updatedList = currentList.copy(name = name, colorHex = colorHex)
            api.updateShoppingList(listId, updatedList)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to update shopping list")
        }
    }

    suspend fun deleteShoppingList(id: Int): Result<Unit> {
        return try {
            api.deleteShoppingList(id)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to delete shopping list")
        }
    }

    suspend fun createShoppingItem(
        listId: Int,
        name: String,
        isImportant: Boolean = false
    ): Result<ShoppingItem> {
        return try {
            val request = CreateShoppingItemRequest(
                name = name,
                isBought = false,
                isImportant = isImportant,
                displayOrder = 0
            )
            val item = api.createShoppingItem(listId, request)
            Result.Success(item)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to create item")
        }
    }

    suspend fun toggleItemBought(listId: Int, itemId: Int): Result<ShoppingItem> {
        return try {
            val item = api.toggleShoppingItemBought(listId, itemId)
            Result.Success(item)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to toggle item")
        }
    }

    suspend fun toggleItemImportant(listId: Int, itemId: Int): Result<ShoppingItem> {
        return try {
            val item = api.toggleShoppingItemImportant(listId, itemId)
            Result.Success(item)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to toggle important")
        }
    }

    suspend fun deleteShoppingItem(listId: Int, itemId: Int): Result<Unit> {
        return try {
            api.deleteShoppingItem(listId, itemId)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to delete item")
        }
    }

    suspend fun clearBoughtItems(listId: Int): Result<Unit> {
        return try {
            api.clearBoughtItems(listId)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e.message ?: "Failed to clear bought items")
        }
    }
}
