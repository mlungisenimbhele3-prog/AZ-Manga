package com.kaplus.mangapulse

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

enum class SubscriptionTier {
    STANDARD,  // Free user: Has ads, standard content only
    VIP        // Premium user: No ads, full archive access
}

class UserViewModel : ViewModel() {
    // Tracks current user status. Defaults to STANDARD.
    private val _userTier = MutableStateFlow(SubscriptionTier.STANDARD)
    val userTier: StateFlow<SubscriptionTier> = _userTier

    // Call this after a successful Google Play Billing purchase to upgrade the user
    fun upgradeToVip() {
        _userTier.value = SubscriptionTier.VIP
    }

    // Quick helper to check if a user has sufficient access
    fun hasAccess(requiredTier: SubscriptionTier): Boolean {
        return _userTier.value >= requiredTier
    }
}
