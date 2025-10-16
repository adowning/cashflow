# Deposit & Withdrawal System

A comprehensive, secure, and scalable deposit and withdrawal system built for iGaming platforms. This system integrates seamlessly with the existing betting infrastructure and provides enterprise-grade security and fraud prevention.

## 🚀 Features

### Core Functionality
- **Multi-Payment Provider Support**: CashApp, In-store Cash, In-store Card, and extensible for future providers
- **Real-time Processing**: Sub-500ms response times for critical operations
- **Comprehensive Security**: Fraud detection, velocity checks, and risk scoring
- **Admin Dashboard**: Complete back-office interface for transaction management
- **Bonus Integration**: Automatic XP and free spins awards on deposits

### Integration Points
- **Wallet Service**: Seamless balance management with existing `wallet.service.ts`
- **VIP System**: Automatic XP calculation and level progression
- **Transaction Logging**: Complete audit trail with `transaction-logging.service.ts`
- **Real-time Notifications**: Live updates via `realtime-notifications.service.ts`
- **Wagering Requirements**: Integration with `wagering.service.ts` for withdrawal validation

## 📋 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │   Webhook        │    │   Admin Panel   │
│                 │    │   Processors     │    │                 │
│ - Deposit UI    │◄──►│                  │◄──►│ - Dashboard     │
│ - Withdrawal UI │    │ - CashApp        │    │ - Transaction   │
│ - Status Pages  │    │ - In-store       │    │   Management    │
└─────────────────┘    │ - Generic        │    └─────────────────┘
                       └──────────────────┘
                               │
                      ┌──────────────────┐
                      │   Core Services  │
                      │                  │
                      │ - deposit.service│
                      │ - withdrawal.ser│
                      │ - webhook.service│
                      │ - security.servi│
                      │ - admin.service  │
                      └──────────────────┘
                               │
                      ┌──────────────────┐
                      │   Integration    │
                      │                  │
                      │ - Wallet Service │
                      │ - VIP System     │
                      │ - Transaction Log│
                      │ - Notifications  │
                      │ - Wagering Check │
                      └──────────────────┘
```

## 🔧 API Endpoints

### Deposits

#### Initiate Deposit
```http
POST /api/deposits/initiate
Content-Type: application/json

{
  "userId": "user-123",
  "amount": 10000,        // Amount in cents ($100.00)
  "paymentMethod": "CASHAPP",
  "currency": "USD",
  "note": "Optional note"
}
```

**Response:**
```json
{
  "success": true,
  "depositId": "dep_abc123",
  "status": "PENDING",
  "instructions": "Send $100.00 via CashApp to $CASHAPP_TAG. Include reference: DEP_123456789_abc123",
  "referenceId": "DEP_123456789_abc123"
}
```

#### Get Deposit Status
```http
GET /api/deposits/{depositId}/status
```

#### Get User Deposit History
```http
GET /api/users/{userId}/deposits?limit=50&offset=0
```

### Withdrawals

#### Request Withdrawal
```http
POST /api/withdrawals/request
Content-Type: application/json

{
  "userId": "user-123",
  "amount": 5000,         // Amount in cents ($50.00)
  "payoutMethod": "BANK_TRANSFER",
  "payoutDetails": {
    "accountNumber": "1234567890",
    "routingNumber": "123456789"
  },
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "withdrawalId": "wth_xyz789",
  "status": "PENDING"
}
```

#### Get Withdrawal Status
```http
GET /api/withdrawals/{withdrawalId}/status
```

### Webhooks

#### CashApp Webhook
```http
POST /webhooks/cashapp
Content-Type: application/json
x-webhook-signature: hmac_signature_here

{
  "provider": "CASHAPP",
  "transactionId": "DEP_123456789_abc123",
  "amount": 10000,
  "currency": "USD",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "rawData": {
    "senderName": "John Doe",
    "cashtag": "$johndoe"
  }
}
```

### Admin Endpoints

#### Admin Dashboard
```http
GET /admin/dashboard
x-admin-token: your-admin-token
```

#### Get Pending Withdrawals
```http
GET /admin/withdrawals/pending?limit=100&offset=0
x-admin-token: your-admin-token
```

#### Process Withdrawal
```http
POST /admin/withdrawals/{withdrawalId}/process
Content-Type: application/json
x-admin-token: your-admin-token

{
  "action": "approve",    // or "reject" or "cancel"
  "reason": "Verified by admin",
  "adminNote": "All checks passed"
}
```

## 🔒 Security Features

### Fraud Prevention
- **Risk Scoring**: 0-100 score based on user behavior patterns
- **Velocity Checks**: Hourly and daily transaction limits
- **Pattern Detection**: Identifies suspicious timing and amount patterns
- **Blacklist/Whitelist**: Admin-controlled user risk management

### Webhook Security
- **Signature Validation**: HMAC-SHA256 signature verification
- **Rate Limiting**: Configurable rate limits per IP/provider
- **IP Whitelisting**: Restrict webhook sources to trusted IPs

### Transaction Security
- **Atomic Operations**: Database transactions prevent partial updates
- **Audit Logging**: Complete transaction history for compliance
- **Admin Oversight**: Manual review process for high-risk transactions

## 🎯 Integration Examples

### Frontend Integration

```typescript
// Initiate deposit
const initiateDeposit = async (amount: number) => {
  const response = await fetch('/api/deposits/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.id,
      amount: amount * 100, // Convert to cents
      paymentMethod: 'CASHAPP'
    })
  })

  const result = await response.json()

  if (result.success) {
    // Show payment instructions to user
    displayPaymentInstructions(result.instructions)
    pollDepositStatus(result.depositId)
  }
}

// Poll for deposit completion
const pollDepositStatus = async (depositId: string) => {
  const pollInterval = setInterval(async () => {
    const response = await fetch(`/api/deposits/${depositId}/status`)
    const status = await response.json()

    if (status.status === 'COMPLETED') {
      clearInterval(pollInterval)
      // Update UI with new balance
      updateUserBalance(status.deposit.amount)
    }
  }, 2000) // Poll every 2 seconds
}
```

### Webhook Handler Setup

```typescript
// Express.js middleware for webhook processing
app.post('/webhooks/cashapp', async (req, res) => {
  try {
    const signature = req.header('x-webhook-signature')
    const payload = req.body

    // Process webhook using our service
    const result = await processWebhook(
      payload,
      process.env.WEBHOOK_SECRET,
      signature
    )

    if (result.success) {
      res.json({ success: true })
    } else {
      res.status(400).json({ success: false, error: result.error })
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ success: false, error: 'Internal error' })
  }
})
```

## ⚙️ Configuration

### Environment Variables

```bash
# Webhook security
WEBHOOK_SECRET=your-secure-webhook-secret

# Admin access
ADMIN_TOKEN=your-admin-access-token

# Rate limiting
WEBHOOK_RATE_LIMIT_PER_MINUTE=100
MAX_DEPOSIT_AMOUNT=1000000  # $10,000
MAX_WITHDRAWAL_AMOUNT=500000 # $5,000

# Fraud prevention
FRAUD_CHECK_ENABLED=true
VELOCITY_CHECK_ENABLED=true
```

### Payment Provider Configuration

```typescript
// Configure payment providers
const paymentProviders = {
  CASHAPP: {
    enabled: true,
    webhookSecret: process.env.CASHAPP_WEBHOOK_SECRET,
    allowedIPs: ['192.168.1.1', '10.0.0.1']
  },
  INSTORE_CASH: {
    enabled: true,
    locations: ['store-1', 'store-2'],
    webhookSecret: process.env.INSTORE_WEBHOOK_SECRET
  }
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
bun test src/bets/deposit/deposit-withdrawal.test.ts

# Run specific test suite
bun test src/bets/deposit/deposit-withdrawal.test.ts --describe="Deposit System"

# Run with coverage
bun test --coverage
```

### Test Coverage

The test suite includes:
- ✅ Unit tests for all services
- ✅ Integration tests with existing systems
- ✅ Webhook processing tests
- ✅ Security and fraud prevention tests
- ✅ Admin functionality tests
- ✅ Error handling tests
- ✅ Performance tests

## 🚨 Error Handling

### Common Error Scenarios

```typescript
// Handle deposit errors
try {
  const result = await initiateDeposit(request)
  if (!result.success) {
    switch (result.error) {
      case 'User wallet not found':
        // Redirect to account setup
        break
      case 'Insufficient balance':
        // Show top-up options
        break
      case 'Payment method unavailable':
        // Show alternative methods
        break
      default:
        // Show generic error
    }
  }
} catch (error) {
  // Log error and show user-friendly message
  console.error('Deposit failed:', error)
  showErrorMessage('Deposit temporarily unavailable. Please try again.')
}
```

## 📊 Monitoring & Analytics

### Key Metrics to Monitor

- **Deposit Success Rate**: Target >95%
- **Average Processing Time**: Target <500ms
- **Fraud Detection Rate**: Monitor false positive/negative rates
- **Webhook Reliability**: Monitor delivery and processing rates
- **Admin Response Times**: Track withdrawal approval times

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (c) => {
  const health = {
    status: 'healthy',
    services: {
      database: await checkDatabaseHealth(),
      webhooks: await checkWebhookHealth(),
      fraud_detection: await checkFraudSystemHealth()
    }
  }

  return c.json(health, health.status === 'healthy' ? 200 : 503)
})
```

## 🔄 Maintenance

### Scheduled Tasks

```typescript
// Daily maintenance tasks
const maintenanceTasks = [
  {
    name: 'Cleanup expired deposits',
    schedule: '0 0 * * *', // Daily at midnight
    task: cleanupExpiredDeposits
  },
  {
    name: 'Generate security reports',
    schedule: '0 6 * * *', // Daily at 6 AM
    task: generateSecurityReports
  },
  {
    name: 'Update fraud detection models',
    schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM
    task: updateFraudModels
  }
]
```

## 🚦 Deployment Checklist

- [ ] Environment variables configured
- [ ] Webhook secrets set
- [ ] Admin tokens configured
- [ ] Payment provider webhooks registered
- [ ] Database migrations run
- [ ] Tests passing
- [ ] Health checks working
- [ ] Monitoring alerts configured
- [ ] Admin training completed

## 📞 Support

For technical support or questions about integration:

1. **API Documentation**: Check `/api/docs` endpoint for interactive API docs
2. **Health Check**: Monitor `/health` endpoint for system status
3. **Logs**: Check application logs for detailed error information
4. **Admin Dashboard**: Use admin panel for transaction monitoring

## 🔮 Future Enhancements

- **Cryptocurrency Support**: BTC, ETH, and other crypto integrations
- **Automated AML/KYC**: Third-party service integration
- **Multi-currency Support**: International payment processing
- **Scheduled Withdrawals**: Allow users to schedule future withdrawals
- **Advanced Analytics**: Machine learning fraud detection
- **Mobile SDK**: Native mobile app integration

---

**Built with ❤️ for the iGaming industry**