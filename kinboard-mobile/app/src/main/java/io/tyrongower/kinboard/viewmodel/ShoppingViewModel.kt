package io.tyrongower.kinboard.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.tyrongower.kinboard.data.model.ShoppingList
import io.tyrongower.kinboard.data.repository.Result
import io.tyrongower.kinboard.data.repository.ShoppingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ShoppingState(
    val lists: List<ShoppingList> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val hideBoughtByList: Map<Int, Boolean> = emptyMap()
)

@HiltViewModel
class ShoppingViewModel @Inject constructor(
    private val repository: ShoppingRepository
) : ViewModel() {

    private val _state = MutableStateFlow(ShoppingState())
    val state: StateFlow<ShoppingState> = _state.asStateFlow()

    init {
        loadShoppingLists()
    }

    fun loadShoppingLists() {
        viewModelScope.launch {
            repository.getShoppingLists().collect { result ->
                when (result) {
                    is Result.Loading -> {
                        _state.value = _state.value.copy(isLoading = true, error = null)
                    }
                    is Result.Success -> {
                        _state.value = _state.value.copy(
                            lists = result.data,
                            isLoading = false,
                            error = null
                        )
                    }
                    is Result.Error -> {
                        _state.value = _state.value.copy(
                            isLoading = false,
                            error = result.message
                        )
                    }
                }
            }
        }
    }

    fun toggleHideBought(listId: Int) {
        val current = _state.value.hideBoughtByList[listId] ?: true
        _state.value = _state.value.copy(
            hideBoughtByList = _state.value.hideBoughtByList + (listId to !current)
        )
    }

    fun isHiddenFor(listId: Int): Boolean {
        return _state.value.hideBoughtByList[listId] ?: true
    }

    fun addItem(listId: Int, name: String, isImportant: Boolean = false) {
        viewModelScope.launch {
            when (repository.createShoppingItem(listId, name, isImportant)) {
                is Result.Success -> {
                    loadShoppingLists()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun toggleItemBought(listId: Int, itemId: Int) {
        viewModelScope.launch {
            when (repository.toggleItemBought(listId, itemId)) {
                is Result.Success -> {
                    loadShoppingLists()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun toggleItemImportant(listId: Int, itemId: Int) {
        viewModelScope.launch {
            when (repository.toggleItemImportant(listId, itemId)) {
                is Result.Success -> {
                    loadShoppingLists()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun deleteItem(listId: Int, itemId: Int) {
        viewModelScope.launch {
            when (repository.deleteShoppingItem(listId, itemId)) {
                is Result.Success -> {
                    loadShoppingLists()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun clearBoughtItems(listId: Int) {
        viewModelScope.launch {
            when (repository.clearBoughtItems(listId)) {
                is Result.Success -> {
                    loadShoppingLists()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    // Admin operations
    fun createList(name: String, colorHex: String) {
        viewModelScope.launch {
            when (repository.createShoppingList(name, colorHex)) {
                is Result.Success -> {
                    loadShoppingLists()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun updateList(listId: Int, name: String, colorHex: String) {
        viewModelScope.launch {
            when (repository.updateShoppingList(listId, name, colorHex)) {
                is Result.Success -> {
                    loadShoppingLists()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    fun deleteList(listId: Int) {
        viewModelScope.launch {
            when (repository.deleteShoppingList(listId)) {
                is Result.Success -> {
                    loadShoppingLists()
                }
                is Result.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }
}
