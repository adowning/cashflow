<template>
  <div class="casino-dashboard">
    <!-- Authentication Forms -->
    <div v-if="showAuthForm" class="auth-container">
      <div class="auth-card">
        <h2>{{ isLoginMode ? "Welcome Back" : "Create Account" }}</h2>

        <!-- Error Display -->
        <div v-if="authError" class="auth-error">
          <p>⚠️ {{ authError }}</p>
          <button class="close-error" @click="authError = null">×</button>
        </div>

        <!-- Login Form -->
        <form v-if="isLoginMode" class="auth-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-username">Username</label>
            <input id="login-username" v-model="loginForm.username" type="email" placeholder="Enter your username"
              required :disabled="authLoading" />
          </div>

          <div class="form-group">
            <label for="login-password">Password</label>
            <input id="login-password" v-model="loginForm.password" type="password" placeholder="Enter your password"
              required :disabled="authLoading" />
          </div>

          <button type="submit" class="auth-button" :disabled="authLoading">
            {{ authLoading ? "Signing In..." : "Sign In" }}
          </button>

          <p class="auth-toggle">
            Don't have an account?
            <button type="button" class="link-button" @click="toggleAuthMode">
              Create one here
            </button>
          </p>
        </form>

        <!-- Register Form -->
        <form v-else class="auth-form" @submit.prevent="handleRegister">
          <div class="form-row">
            <div class="form-group">
              <label for="register-firstName">First Name</label>
              <input id="register-firstName" v-model="registerForm.firstName" type="text" placeholder="First name"
                required :disabled="authLoading" />
            </div>
            <div class="form-group">
              <label for="register-lastName">Last Name</label>
              <input id="register-lastName" v-model="registerForm.lastName" type="text" placeholder="Last name" required
                :disabled="authLoading" />
            </div>
          </div>

          <div class="form-group">
            <label for="register-username">Username</label>
            <input id="register-username" v-model="registerForm.username" type="text" placeholder="Choose a username"
              required :disabled="authLoading" />
          </div>

          <div class="form-group">
            <label for="register-email">Email</label>
            <input id="register-email" v-model="registerForm.email" type="email" placeholder="Enter your email" required
              :disabled="authLoading" />
          </div>

          <div class="form-group">
            <label for="register-phone">Phone</label>
            <input id="register-phone" v-model="registerForm.phone" type="tel" placeholder="Phone number" required
              :disabled="authLoading" />
          </div>

          <div class="form-group">
            <label for="register-password">Password</label>
            <input id="register-password" v-model="registerForm.password" type="password"
              placeholder="Create a password" required :disabled="authLoading" />
          </div>

          <button type="submit" class="auth-button" :disabled="authLoading">
            {{ authLoading ? "Creating Account..." : "Create Account" }}
          </button>

          <p class="auth-toggle">
            Already have an account?
            <button type="button" class="link-button" @click="toggleAuthMode">
              Sign in here
            </button>
          </p>
        </form>
      </div>
    </div>

    <!-- Main Dashboard (only show when authenticated) -->
    <div v-else-if="requiresAuth" class="dashboard">
      <!-- Dashboard Header -->
      <header class="dashboard-header">
        <div class="user-info">
          <h1>Welcome back, {{ displayName }}!</h1>
          <p class="user-email">
            {{ currentUser?.email }}
          </p>
        </div>
        <button class="logout-button" @click="handleLogout">Sign Out</button>
      </header>

      <!-- Balance Section -->
      <section class="balance-section">
        <h2>💰 Account Balance</h2>
        <div class="balance-cards">
          <div class="balance-card">
            <span class="label">Real Balance</span>
            <span class="amount">${{ balance.realBalance.toFixed(2) }}</span>
          </div>
          <div class="balance-card">
            <span class="label">Bonus Balance</span>
            <span class="amount bonus">${{ balance.bonusBalance.toFixed(2) }}</span>
          </div>
          <div class="balance-card total">
            <span class="label">Total Balance</span>
            <span class="amount">${{ balance.totalBalance.toFixed(2) }}</span>
          </div>
        </div>
        <p class="last-updated">
          Last updated: {{ formatTime(balance.lastUpdated) }}
        </p>
      </section>

      <!-- VIP Section -->
      <section class="vip-section">
        <h2>👑 VIP Status</h2>
        <div class="vip-info">
          <div class="vip-level">
            <span class="level-number">{{ vip.level }}</span>
            <span class="level-name">{{ vip.levelName }}</span>
          </div>
          <div class="vip-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${vip.progressToNextLevel}%` }" />
            </div>
            <span class="progress-text">{{ vip.pointsToNextLevel }} points to next level</span>
          </div>
        </div>
      </section>

      <!-- Recent Transactions -->
      <section class="transactions-section">
        <h2>📊 Recent Activity</h2>
        <div class="transactions-list">
          <div v-for="transaction in transactions" :key="transaction.id" class="transaction-item"
            :class="transaction.type.toLowerCase()">
            <span class="type">{{ transaction.type }}</span>
            <span class="amount" :class="transaction.amount >= 0 ? 'positive' : 'negative'">
              {{ transaction.amount >= 0 ? "+" : "" }}${{
                transaction.amount.toFixed(2)
              }}
            </span>
            <span class="date">{{ formatDate(transaction.createdAt) }}</span>
          </div>
        </div>
      </section>

      <!-- Jackpot Section -->
      <section v-if="jackpots.minor" class="jackpots-section">
        <h2>🎰 Live Jackpots</h2>
        <div class="jackpot-cards">
          <div class="jackpot-card">
            <span class="jackpot-type">Minor</span>
            <span v-if="jackpots.minor" class="jackpot-amount">${{ jackpots.minor.currentAmount.toLocaleString()
              }}</span>
          </div>
          <div class="jackpot-card">
            <span class="jackpot-type">Major</span>
            <span v-if="jackpots.major" class="jackpot-amount">${{ jackpots.major.currentAmount.toLocaleString()
              }}</span>
          </div>
          <div class="jackpot-card">
            <span class="jackpot-type">Mega</span>
            <span v-if="jackpots.mega" class="jackpot-amount">${{ jackpots.mega.currentAmount.toLocaleString() }}</span>
          </div>
        </div>
      </section>

      <!-- Wagering Progress -->
      <section class="wagering-section">
        <h2>🎯 Bonus Wagering</h2>
        <div class="wagering-progress">
          <div class="progress-stats">
            <span>Progress: {{ wagering.overallProgress.toFixed(1) }}%</span>
            <span>{{ wagering.totalWagered.toFixed(2) }} /
              {{ wagering.totalRequired.toFixed(2) }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :class="{ complete: wagering.withdrawalEligible }"
              :style="{ width: `${Math.min(wagering.overallProgress, 100)}%` }" />
          </div>
          <p v-if="wagering.withdrawalEligible" class="eligible">
            ✅ Eligible for withdrawal!
          </p>
        </div>
      </section>
    </div>

    <!-- Fallback state (should not normally be visible) -->
    <div v-else class="loading">
      <div class="spinner" />
      <p>Initializing...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRealtimeCasino } from "@/composables/useRealtimeUpdates";
import { computed, onMounted, reactive, ref } from "vue";

/**
 * RStore Casino Dashboard Example with Authentication
 *
 * This component demonstrates how to use the complete RStore system
 * with real-time updates, type safety, proper error handling, and authentication.
 */

// Authentication interfaces
interface User
{
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface LoginCredentials
{
  username: string;
  // email: string;
  password: string;
}

interface RegisterData
{
  username: string;
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
}

// interface AuthForm {
//   username: string;
//   email: string;
//   password: string;
//   phone: string;
//   firstName: string;
//   lastName: string;
// }

// Component props (now optional since we get user data from auth)
interface Props
{
  userId?: string;
  walletId?: string;
}

const props = defineProps<Props>();

// Authentication state management
const isAuthenticated = ref(false);
const currentUser = ref<User | null>(null);
const authLoading = ref(false);
const authError = ref<string | null>(null);
const showAuthForm = ref(true);
const isLoginMode = ref(true); // true for login, false for register

// Form state
const loginForm = reactive<LoginCredentials>({
  username: "",
  // email: '',
  password: "",
});

const registerForm = reactive<RegisterData>({
  username: "",
  email: "",
  password: "",
  phone: "",
  firstName: "",
  lastName: "",
});

// Authentication service functions
const authService = {
  async login(credentials: LoginCredentials): Promise<User>
  {
    try {
      const response = await fetch("http://localhost:9999/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Login failed: ${response.statusText}`
        );
      }

      const userData = await response.json();
      return userData.user || userData;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Network error: Please check your connection and try again"
        );
      }
      throw error;
    }
  },

  async register(userData: RegisterData): Promise<User>
  {
    try {
      const response = await fetch("http://localhost:4001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Registration failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      showAuthForm.value = false;
      // requiresAuth.value = true
      return data.user || data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Network error: Please check your connection and try again"
        );
      }
      throw error;
    }
  },

  async logout(): Promise<void>
  {
    try {
      const response = await fetch("http://localhost:4001/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.warn("Logout request failed, but clearing local state anyway");
      }
    } catch (error) {
      console.warn("Logout request failed:", error);
      // Continue with local logout even if server request fails
    }
  },

  async validateSession(): Promise<User | null>
  {
    try {
      const response = await fetch("http://localhost:4001/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const userData = await response.json();
      return userData.user || userData;
    } catch (error) {
      console.error("Session validation failed:", error);
      return null;
    }
  },
};

// Authentication form handlers
const handleLogin = async () =>
{
  if (!loginForm.username || !loginForm.password) {
    authError.value = "Please fill in all required fields";
    return;
  }

  // Basic email validation
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  // if (!emailRegex.test(loginForm.username)) {
  if (!loginForm.username) authError.value = "Please enter a valid username ";
  return;
};

authLoading.value = true;
authError.value = null;
if (loginForm.username === "" && loginForm.password === "") {
  loginForm.username = "asdfasdf";
  loginForm.password = "asdfasdf";
}
try {
  const user = await authService.login(loginForm);
  if (user.id) {
    currentUser.value = user;
    isAuthenticated.value = true;
    showAuthForm.value = false;
  }
  // Clear form
  Object.assign(loginForm, { username: "", email: "", password: "" });
} catch (error) {
  authError.value = error instanceof Error ? error.message : "Login failed";
  console.error("Login error:", error);
} finally {
  authLoading.value = false;
}

const handleRegister = async () =>
{
  if (
    !registerForm.username ||
    !registerForm.email ||
    !registerForm.password ||
    !registerForm.firstName ||
    !registerForm.lastName ||
    !registerForm.phone
  ) {
    authError.value = "Please fill in all required fields";
    return;
  }

  // Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registerForm.email)) {
    authError.value = "Please enter a valid email address";
    return;
  }

  if (registerForm.password.length < 6) {
    authError.value = "Password must be at least 6 characters long";
    return;
  }

  const phoneRegex = /^\d{10,}$/;
  if (!phoneRegex.test(registerForm.phone.replace(/\D/g, ""))) {
    authError.value = "Please enter a valid phone number";
    return;
  }

  authLoading.value = true;
  authError.value = null;

  try {
    const user = await authService.register(registerForm);
    currentUser.value = user;
    isAuthenticated.value = true;
    showAuthForm.value = true;
    isLoginMode.value = true; // Switch to login mode after successful registration

    // Clear form
    Object.assign(registerForm, {
      username: "",
      email: "",
      password: "",
      phone: "",
      firstName: "",
      lastName: "",
    });
  } catch (error) {
    authError.value =
      error instanceof Error ? error.message : "Registration failed";
    console.error("Registration error:", error);
  } finally {
    authLoading.value = false;
  }
};

const handleLogout = async () =>
{
  try {
    await authService.logout();
    isAuthenticated.value = false;
    currentUser.value = null;
    showAuthForm.value = true;
  } catch (error) {
    console.error("Logout error:", error);
    // Force logout even if request fails
    isAuthenticated.value = false;
    currentUser.value = null;
    showAuthForm.value = true;
  }
};

const toggleAuthMode = () =>
{
  isLoginMode.value = !isLoginMode.value;
  authError.value = null;
};

// Initialize authentication state
const initializeAuth = async () =>
{
  try {
    const user = await authService.validateSession();
    if (user) {
      currentUser.value = user;
      isAuthenticated.value = true;
    } else {
      showAuthForm.value = true;
    }
  } catch (error) {
    console.error("Auth initialization failed:", error);
    showAuthForm.value = true;
  }
};

// Computed properties for authentication state
const requiresAuth = computed(() =>
{
  return isAuthenticated.value && currentUser.value;
});

const displayName = computed(() =>
{
  if (!currentUser.value) return "";
  return (
    `${currentUser.value.firstName} ${currentUser.value.lastName}`.trim() ||
    currentUser.value.username
  );
});

// // Initialize RStore with typed helpers
// const { store, getUser, getWallet, getTransactions } = useRStore();

// Get user and wallet IDs from authenticated user or props
const userId = computed(() => currentUser.value?.id || props.userId);
const walletId = computed(() =>
{
  // In a real app, you'd fetch the user's wallet ID from their profile
  // For now, we'll use the prop or a default
  return props.walletId || currentUser.value?.id || "default-wallet";
});

// Real-time casino data (automatically subscribes to WebSocket updates)
const {
  balance,
  vip,
  transactions,
  // recentTransactions,
  jackpots,
  wagering,
  isLoading,
  error,
  lastUpdate,
  // updateBalanceOptimistically,
  // rollbackBalance,
} = useRealtimeCasino(userId.value || "", walletId.value || "");
console.log(
  balance,
  vip,
  transactions,
  // recentTransactions,
  jackpots,
  wagering,
  isLoading,
  error,
  lastUpdate
);
// Initialize authentication on component mount
onMounted(() =>
{
  initializeAuth();
});

// Utility functions for formatting
const formatTime = (date: Date | null) =>
{
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};

const formatDate = (dateString: string) =>
{
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
};

// // Retry connection function
// const retryConnection = () => {
//   // The composable will automatically reconnect via VueUse WebSocket
//   console.log("Retrying connection...");
// };

// // Example: Optimistic balance update (for immediate UI feedback)
// const handleBet = async (betAmount: number) => {
//   try {
//     // Apply optimistic update immediately
//     updateBalanceOptimistically({
//       realBalance: -betAmount,
//       changeType: "bet",
//     });

//     // Make API call
//     // const result = await placeBet(betAmount)

//     // Update was successful - real update will come via WebSocket
//     console.log("Bet placed successfully");
//   } catch (error) {
//     // Rollback optimistic update on error
//     rollbackBalance();
//     console.error("Bet failed:", error);
//   }
// };

// // Example: Manual data fetching with typed queries
// const fetchUserData = async () => {
//   try {
//     // Using typed helper methods
//     const user = await getUser(props.userId);
//     const wallet = await getWallet(props.walletId);
//     const recentTxs = await getTransactions(props.userId, 10);

//     console.log("User:", user);
//     console.log("Wallet:", wallet);
//     console.log("Recent transactions:", recentTxs);
//   } catch (error) {
//     console.error("Failed to fetch user data:", error);
//   }
// };

// // Example: Advanced filtering with type safety
// const getLargeTransactions = async () => {
//   const largeTransactions = await store.transactions.query((q) =>
//     q.many({
//       filter: (tx: Transaction) => Math.abs(tx.amount) > 1000,
//       orderBy: "amount",
//       orderDirection: "desc",
//       limit: 5,
//     })
//   );

//   return largeTransactions;
// };

// // Example: Real-time subscription to specific data
// const subscribeToWallet = (walletId: string) => {
//   // This automatically subscribes via the composable
//   const { data } = store.wallets.query((q) =>
//     q.first({
//       filter: (wallet: Wallet) => wallet.id === walletId,
//     })
//   );

//   return data;
// };
</script>

<style scoped>
.casino-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
}

/* Authentication Styles */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.auth-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.form-group label {
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
}

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.auth-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  margin-top: 10px;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.auth-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.auth-toggle {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.link-button {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
  font: inherit;
}

.link-button:hover {
  color: #764ba2;
}

.auth-error {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.auth-error p {
  margin: 0;
  color: #c33;
}

.close-error {
  background: none;
  border: none;
  color: #c33;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-error:hover {
  color: #a22;
}

/* Dashboard Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.user-info h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.user-email {
  margin: 5px 0 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.logout-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.loading,
.error {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.dashboard section {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.balance-cards {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}

.balance-card {
  flex: 1;
  padding: 20px;
  text-align: center;
  border-radius: 8px;
  background: #f8f9fa;
}

.balance-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.amount {
  display: block;
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
}

.amount.bonus {
  color: #28a745;
}

.vip-level {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.level-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  margin: 10px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s ease;
}

.progress-fill.complete {
  background: linear-gradient(90deg, #28a745, #20c997, #17a2b8);
}

.transactions-list {
  max-height: 300px;
  overflow-y: auto;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 5px;
  border-radius: 5px;
}

.transaction-item.win {
  background: rgba(40, 167, 69, 0.1);
  border-left: 4px solid #28a745;
}

.transaction-item.bet {
  background: rgba(108, 117, 125, 0.1);
  border-left: 4px solid #6c757d;
}

.jackpot-cards {
  display: flex;
  gap: 20px;
}

.jackpot-card {
  flex: 1;
  padding: 20px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
}

.jackpot-amount {
  display: block;
  font-size: 20px;
  font-weight: bold;
  margin-top: 10px;
}

.last-updated {
  color: #6c757d;
  font-size: 14px;
  margin-top: 10px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

button:hover {
  background: #0056b3;
}

/* Responsive Design */
@media (max-width: 768px) {
  .casino-dashboard {
    padding: 10px;
  }

  .auth-card {
    padding: 30px 20px;
    margin: 10px;
  }

  .auth-card h2 {
    font-size: 24px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .user-info h1 {
    font-size: 20px;
  }

  .balance-cards,
  .jackpot-cards {
    flex-direction: column;
  }

  .transaction-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 20px 15px;
  }

  .dashboard section {
    padding: 15px;
  }

  .balance-card,
  .jackpot-card {
    padding: 15px;
  }
}
</style>
