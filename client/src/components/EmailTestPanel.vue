<template>
  <div class="email-test-panel">
    <h2>🧪 Webhook Email Testing</h2>

    <!-- Email Configuration Test -->
    <div class="test-section">
      <h3>📧 Email Service Configuration</h3>
      <button @click="testEmailConfig" :disabled="loading.config" class="test-btn">
        {{ loading.config ? 'Testing...' : 'Test Email Configuration' }}
      </button>
      <div v-if="configResult" class="result" :class="{ success: configResult.success, error: !configResult.success }">
        {{ configResult.message }}
      </div>
    </div>

    <!-- Send Test Email -->
    <div class="test-section">
      <h3>💌 Send Test CashApp Email</h3>
      <form @submit.prevent="sendTestEmail" class="email-form">
        <div class="form-group">
          <label for="amount">Amount (cents):</label>
          <input
            id="amount"
            v-model.number="emailData.amount"
            type="number"
            min="1"
            step="1"
            required
            placeholder="10000"
          />
          <small>${{ (emailData.amount / 100).toFixed(2) }}</small>
        </div>

        <div class="form-group">
          <label for="senderName">Sender Name:</label>
          <input
            id="senderName"
            v-model="emailData.senderName"
            type="text"
            required
            placeholder="John Doe"
          />
        </div>

        <div class="form-group">
          <label for="cashtag">Cashtag:</label>
          <input
            id="cashtag"
            v-model="emailData.cashtag"
            type="text"
            required
            placeholder="$johndoe"
          />
        </div>

        <div class="form-group">
          <label for="reason">Payment Reason:</label>
          <input
            id="reason"
            v-model="emailData.reason"
            type="text"
            placeholder="Order #12345"
          />
        </div>

        <div class="form-group">
          <label for="targetEmail">Target Email:</label>
          <input
            id="targetEmail"
            v-model="emailData.targetEmail"
            type="email"
            required
            placeholder="cashapp@cashflowcasino.com"
          />
        </div>

        <button type="submit" :disabled="loading.email" class="test-btn primary">
          {{ loading.email ? 'Sending...' : 'Send Test Email' }}
        </button>
      </form>

      <!-- Email Result -->
      <div v-if="emailResult" class="result" :class="{ success: emailResult.success, error: !emailResult.success }">
        <div v-if="emailResult.success">
          <p>✅ Email sent successfully!</p>
          <p><strong>Message ID:</strong> {{ emailResult.messageId }}</p>
          <div v-if="emailResult.webhookPayload" class="webhook-payload">
            <h4>📋 Generated Webhook Payload:</h4>
            <pre>{{ JSON.stringify(emailResult.webhookPayload, null, 2) }}</pre>
          </div>
        </div>
        <div v-else>
          <p>❌ Email sending failed:</p>
          <p>{{ emailResult.error }}</p>
        </div>
      </div>
    </div>

    <!-- Webhook Status -->
    <div class="test-section">
      <h3>🔗 Webhook Status</h3>
      <div class="webhook-info">
        <p><strong>Webhook URL:</strong> <code>http://localhost:3000/webhook/cashapp</code></p>
        <p><strong>Expected Provider:</strong> CASHAPP</p>
        <p><strong>Status:</strong> <span class="status-active">Active</span></p>
      </div>
    </div>

    <!-- Instructions -->
    <div class="test-section">
      <h3>📋 Testing Instructions</h3>
      <ol class="instructions">
        <li>Fill out the form above with test payment data</li>
        <li>Click "Send Test Email" to generate and send a CashApp-style email</li>
        <li>The email will be sent to your specified target email address</li>
        <li>Your cloudworker should detect this email and send a webhook POST to <code>/webhook/cashapp</code></li>
        <li>Check the webhook processing results in the backend console logs</li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

interface CashAppEmailData {
  amount: number;
  senderName: string;
  cashtag: string;
  reason: string;
  targetEmail: string;
}

interface TestResult {
  success: boolean;
  message?: string;
  messageId?: string;
  error?: string;
  webhookPayload?: Record<string, unknown>;
}

const loading = ref({
  config: false,
  email: false
});

const configResult = ref<TestResult | null>(null);
const emailResult = ref<TestResult | null>(null);

const emailData = reactive<CashAppEmailData>({
  amount: 10000, // $100.00 in cents
  senderName: 'Test User',
  cashtag: '$testuser',
  reason: 'Test Payment',
  targetEmail: 'cashapp@cashflowcasino.com'
});

const testEmailConfig = async () => {
  loading.value.config = true;
  configResult.value = null;

  try {
    const response = await fetch('http://localhost:3000/test/email/config');
    const result = await response.json();

    configResult.value = {
      success: result.success,
      message: result.success ? 'Email configuration is working!' : result.error,
      error: result.error
    };
  } catch (error) {
    configResult.value = {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  } finally {
    loading.value.config = false;
  }
};

const sendTestEmail = async () => {
  loading.value.email = true;
  emailResult.value = null;

  try {
    const response = await fetch('http://localhost:3000/test/email/cashapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();
    emailResult.value = result;
  } catch (error) {
    emailResult.value = {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  } finally {
    loading.value.email = false;
  }
};
</script>

<style scoped>
.email-test-panel {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.test-section h3 {
  margin-top: 0;
  color: #333;
}

.test-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.test-btn:hover:not(:disabled) {
  background-color: #5a6268;
}

.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-btn.primary {
  background-color: #007bff;
}

.test-btn.primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.email-form {
  display: grid;
  gap: 15px;
  max-width: 400px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: 500;
  color: #495057;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group small {
  margin-top: 3px;
  color: #6c757d;
  font-size: 12px;
}

.result {
  margin-top: 15px;
  padding: 12px;
  border-radius: 5px;
  font-size: 14px;
}

.result.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.webhook-payload {
  margin-top: 15px;
}

.webhook-payload h4 {
  margin-bottom: 10px;
  color: #495057;
}

.webhook-payload pre {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  border: 1px solid #e9ecef;
}

.webhook-info {
  background-color: #e7f3ff;
  padding: 15px;
  border-radius: 5px;
  border-left: 4px solid #007bff;
}

.webhook-info p {
  margin: 8px 0;
}

.webhook-info code {
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.status-active {
  color: #28a745;
  font-weight: bold;
}

.instructions {
  background-color: #fff3cd;
  padding: 15px;
  border-radius: 5px;
  border-left: 4px solid #ffc107;
}

.instructions li {
  margin: 8px 0;
}

.instructions code {
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}
</style>