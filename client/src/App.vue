<script setup lang="ts">
import EmailTestPanel from './components/EmailTestPanel.vue';
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>💳 CashFlow Casino - Webhook Testing Suite</h1>
      <p>Testing interface for CashApp payment webhooks and email processing</p>
    </header>

    <main class="app-main">
      <EmailTestPanel />
    </main>

    <footer class="app-footer">
      <p>
        <strong>Backend API:</strong> http://localhost:3000 |
        <strong>Webhook Endpoint:</strong> http://localhost:3000/webhook/cashapp |
        <strong>Environment:</strong> Development
      </p>
    </footer>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 300;
}

.app-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  padding: 2rem;
}

.app-footer {
  background-color: #343a40;
  color: white;
  padding: 1rem 2rem;
  text-align: center;
  border-top: 3px solid #007bff;
}

.app-footer p {
  margin: 0;
  font-size: 0.9rem;
}

.app-footer strong {
  color: #007bff;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1.5rem;
  }

  .app-header h1 {
    font-size: 2rem;
  }

  .app-main {
    padding: 1rem;
  }

  .app-footer {
    padding: 1rem;
  }
}
</style>
