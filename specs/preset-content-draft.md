# Preset Content Draft

Draft text for `src/data/presets.json`. Review and finalize before committing. Character counts are approximate — measure the exact value after finalizing text and update `presets.json` accordingly. The 10-page document preset must be < 50,000 characters (highlighter cutoff) and > 12,000 characters (representative of a long document).

---

## `customer-support-turn` (~300 chars)

```
Hi, I've been a subscriber for two years and I'm having trouble resetting my password. The reset email isn't arriving—I've checked spam and my junk folder. I need access to export some data before my subscription renews tomorrow. Can you help expedite this?
```

**Character count:** 257. If padding is needed to reach ~300, add a sentence such as: "My account email is on file. Order number: #48291."

---

## `blog-post-summary` (~2,800 chars / ~500 words)

```
The Hidden Cost of Context: Why Token Efficiency Matters More Than Model Speed

Every AI developer eventually learns the same lesson: the bottleneck isn't compute — it's context. While much attention goes to latency and throughput benchmarks, the more consequential variable for production AI applications is how efficiently you use each model's context window.

Context windows have grown dramatically. GPT-4o supports 128,000 tokens. Claude supports 200,000. Gemini 2.5 Pro can handle 1 million. At first glance, this seems to eliminate scarcity. In practice, it shifts the constraint from "will my prompt fit?" to "how much am I paying per request?"

Consider a retrieval-augmented generation (RAG) pipeline that processes customer support queries. Each request might include a 500-token system prompt, 2,000 tokens of retrieved documentation chunks, 200 tokens of conversation history, and a 50-token user query. That's 2,750 input tokens before any output. At GPT-4o's pricing of $2.50 per million input tokens, this costs $0.007 per request. At 100,000 requests per month, you're spending $687 just on input tokens.

Now consider the same pipeline using Claude Haiku, which offers competitive quality for many support tasks at a fraction of the cost. Or using context caching to avoid re-sending the system prompt on every request — Anthropic offers up to 90% discount on cached input tokens. The same 100,000 monthly requests could cost under $100 with the right model and caching strategy.

The challenge is that these numbers aren't obvious until you run them. Provider pricing pages show per-million-token rates, but your operational unit is a request, not a token. You need to know your prompt's token count across multiple models before you can make an informed architectural decision.

This is the calculation most AI developers are doing manually: opening tabs for each provider's tokenizer, converting character estimates to token counts, multiplying by pricing tiers, then adding output costs. It's tedious and error-prone — especially because different models tokenize differently. GPT-4o and Llama 4 will produce meaningfully different token counts for the same input, directly affecting your cost estimate.

The right time to run these numbers is before you commit to a model, not after you've built your pipeline around one. Cost sensitivity varies dramatically by use case: a high-volume classification task might need the cheapest model possible, while a complex reasoning task might justify a premium model's output quality. Neither decision should be made on intuition alone.

Token efficiency — understanding exactly what you're sending, what it costs across providers, and how to optimize the ratio — is increasingly the skill that separates AI applications that scale sustainably from ones that hit unexpected infrastructure bills at growth.
```

**Character count:** ~2,750. Adjust last paragraph if needed.

---

## `python-script` (~600 chars)

```python
def calculate_moving_average(data: list[float], window: int) -> list[float]:
    """Calculate simple moving average for a time series.

    Args:
        data: List of numeric values in chronological order.
        window: Number of periods to average over.

    Returns:
        List of averages; length is len(data) - window + 1.

    Raises:
        ValueError: If window exceeds data length or is less than 1.
    """
    if window < 1:
        raise ValueError(f"Window must be >= 1, got {window}")
    if window > len(data):
        raise ValueError(f"Window {window} exceeds data length {len(data)}")

    return [
        sum(data[i : i + window]) / window
        for i in range(len(data) - window + 1)
    ]
```

**Character count:** ~580.

---

## `rag-system-prompt` (~1,500 chars)

```
You are a helpful customer support assistant for Acme Software. Your role is to answer questions about the product, troubleshoot common issues, and escalate complex problems to the human support team.

Guidelines:
- Always be polite, concise, and accurate. If you don't know the answer, say so clearly rather than guessing.
- Only answer questions related to Acme Software products. Politely decline off-topic requests.
- When troubleshooting, ask one clarifying question at a time rather than listing many at once.
- For billing or account-specific issues, tell the user to contact billing@acme.com directly — do not attempt to access or modify account data.
- If a user is frustrated, acknowledge their frustration before attempting to solve the problem.
- Format code examples in markdown code blocks. Keep responses under 200 words unless a longer explanation is clearly necessary.
- Always end your response with a follow-up question to confirm the issue was resolved, unless the user has indicated they are satisfied.

Product context:
- Acme Software is a project management tool for software teams.
- Key features: task boards, sprint planning, GitHub integration, time tracking, and team reporting.
- Current version: 4.2.1 (released 2025-09-15).
- Known issues: Export to PDF occasionally times out for projects with > 500 tasks (workaround: export in batches of 200).
- Support hours: Monday–Friday, 9am–6pm EST. After-hours requests are queued and answered the next business day.
```

**Character count:** ~1,480.

---

## `ten-page-document` (~15,000 chars)

The text below is a realistic software architecture design document. Copy the full content between the triple-backtick fences into the `text` field of the `ten-page-document` entry in `presets.json`. Measure the exact character count and update `charCountWarning` accordingly.

```
Order Management System — Architecture Design Document
Version 2.4 | Engineering Team | 2025-09-01

─────────────────────────────────────────────────
1. EXECUTIVE SUMMARY
─────────────────────────────────────────────────

This document describes the architecture of the Order Management System (OMS), the core transactional platform responsible for receiving, validating, routing, and fulfilling customer orders across all sales channels. The OMS processes an average of 4.2 million orders per day at peak, with a 99.95% availability SLA and a P99 end-to-end order confirmation latency of under 800 milliseconds.

The system is built as a collection of loosely coupled microservices communicating over an event-driven message bus (Apache Kafka), with synchronous REST APIs exposed to internal consumers via an API gateway. State is managed in a combination of PostgreSQL (transactional records), Redis (session and cache), and Elasticsearch (search and reporting).

This document is intended for engineers joining the platform team, architects evaluating integration patterns, and stakeholders requiring a technical overview for compliance and audit purposes.

─────────────────────────────────────────────────
2. SYSTEM CONTEXT
─────────────────────────────────────────────────

2.1 External Actors

The OMS interacts with the following external systems:

- Customer-facing storefronts (web, mobile, kiosk): Submit orders via the Order Intake API.
- Third-party marketplace integrations (Amazon, eBay, Walmart): Submit orders via dedicated adapter services that normalize external schemas to the internal order format.
- Payment processing providers (Stripe, Braintree, Adyen): Called synchronously during order authorization; webhook callbacks are consumed for async settlement events.
- Fulfillment partners (3PL providers, internal warehouse management systems): Receive shipment instructions and emit tracking updates via a bidirectional EDI bridge.
- Customer notification services (SendGrid for email, Twilio for SMS): Consume order lifecycle events and generate customer-facing communications.
- Finance and ERP systems (NetSuite): Consume settled order events for revenue recognition and accounting.

2.2 System Boundaries

The OMS owns the order lifecycle from submission through final shipment confirmation. It does not own:
- Product catalog and inventory (managed by the Catalog Service — OMS reads availability via API but does not write)
- Customer identity and authentication (managed by the Identity Service — OMS trusts JWT claims)
- Returns and refunds (managed by the Returns Management System — OMS emits events that RMS consumes)
- Pricing and promotions (managed by the Pricing Engine — OMS calls Pricing Engine at order creation to obtain a locked price quote)

─────────────────────────────────────────────────
3. HIGH-LEVEL ARCHITECTURE
─────────────────────────────────────────────────

3.1 Service Decomposition

The OMS comprises eight primary services:

┌────────────────────────────────────────────────────────────────────────┐
│                        API Gateway (Kong)                              │
│  Rate limiting · Auth token verification · Request routing             │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
          ┌─────────────────┼───────────────────────┐
          │                 │                       │
    ┌─────▼──────┐  ┌───────▼──────┐  ┌────────────▼──────┐
    │  Order     │  │  Cart        │  │  Marketplace       │
    │  Intake    │  │  Service     │  │  Adapter           │
    │  Service   │  │              │  │  (per channel)     │
    └─────┬──────┘  └───────┬──────┘  └────────────┬───────┘
          │                 │                       │
          └─────────────────▼───────────────────────┘
                            │ Kafka: order.created
          ┌─────────────────┼─────────────────────────────────────┐
          │                 │                   │                  │
    ┌─────▼──────┐  ┌───────▼──────┐  ┌────────▼──────┐  ┌───────▼──────┐
    │  Payment   │  │  Inventory   │  │  Fraud        │  │  Order       │
    │  Service   │  │  Reservation │  │  Detection    │  │  Orchestrator│
    │            │  │  Service     │  │  Service      │  │              │
    └─────┬──────┘  └───────┬──────┘  └───────┬───────┘  └───────┬──────┘
          │                 │                  │                   │
          └─────────────────▼──────────────────▼───────────────────┘
                                    │ Kafka: order.authorized
                            ┌───────▼──────┐
                            │  Fulfillment │
                            │  Router      │
                            └──────────────┘

3.2 Data Flow — Happy Path

1. A storefront submits an order to the Order Intake Service via POST /v2/orders.
2. Order Intake validates the request schema, calls the Pricing Engine to lock prices, calls the Catalog Service to confirm product availability, and persists a PENDING order record to PostgreSQL.
3. Order Intake publishes an order.created event to Kafka.
4. Three consumers process order.created in parallel:
   a. Payment Service: Calls the payment provider to authorize (not capture) the payment method.
   b. Inventory Reservation Service: Places a soft hold on inventory in the Catalog Service.
   c. Fraud Detection Service: Scores the order and emits an order.fraud_scored event.
5. The Order Orchestrator consumes all three downstream events, evaluates the combined result, and transitions the order state:
   - All three pass → emits order.authorized
   - Any one fails → emits order.failed (with reason code), triggers compensating actions (void auth, release inventory hold)
6. Fulfillment Router consumes order.authorized, selects the optimal fulfillment center based on inventory location and shipping SLA, and dispatches a shipment instruction to the WMS.
7. The WMS emits shipment tracking events (order.shipped, order.delivered) consumed by the Notification Service and RMS.

─────────────────────────────────────────────────
4. SERVICE SPECIFICATIONS
─────────────────────────────────────────────────

4.1 Order Intake Service

Responsibilities: Schema validation, price locking, idempotency enforcement, initial persistence.

API surface:
  POST   /v2/orders                 — Create order
  GET    /v2/orders/{id}            — Get order by ID
  GET    /v2/orders?customerId={}   — List customer orders (paginated)

Idempotency: Clients MUST supply an Idempotency-Key header (UUID v4). Duplicate requests with the same key within a 24-hour window return the original response without re-processing.

Database: Owns the `orders` and `order_line_items` tables in the `oms` PostgreSQL schema. Writes are wrapped in database transactions. Outbox pattern is used to guarantee at-least-once Kafka publishing: the order record and the Kafka message payload are committed atomically to an `outbox` table; a separate relay process publishes from the outbox and marks entries as delivered.

SLA: P99 < 300ms for POST /v2/orders (excluding downstream synchronous calls to Pricing Engine and Catalog Service, which have their own SLAs).

4.2 Payment Service

Responsibilities: Payment method authorization, capture, and void. Webhook ingestion from payment providers.

The Payment Service is the only service that holds or processes payment method data. PCI DSS scope is isolated to this service. All other services receive only a payment_authorization_id (an opaque token representing a successful authorization).

Authorization flow:
1. Receives order.created event with payment_method_token (a Stripe/Braintree/Adyen token, never a raw card number).
2. Calls the payment provider's authorization API.
3. On success: emits payment.authorized with authorization_id, amount, currency, and provider.
4. On decline: emits payment.declined with decline_code and a human-readable reason (for display in order confirmation emails — not for programmatic branching).
5. On provider timeout (> 8 seconds): emits payment.timeout; the Order Orchestrator treats this as a terminal failure for the current attempt and schedules a retry for the customer's next session.

Webhook handling: Payment providers send async settlement and refund webhooks to POST /webhooks/{provider}. Each webhook is verified using provider-specific signature validation (HMAC-SHA256 for Stripe, JWT for Adyen) before processing. Unverified webhooks are rejected with HTTP 401 and logged.

4.3 Inventory Reservation Service

Responsibilities: Placing and releasing soft holds on inventory to prevent overselling between order creation and fulfillment confirmation.

A soft hold reserves inventory for 30 minutes. If the order is not authorized within that window (payment failed, fraud rejected), the hold is automatically released by a TTL-based expiry job.

The service does not own inventory data — it calls the Catalog Service API to place and release holds. The Catalog Service is the system of record; the Reservation Service is a coordination layer that ensures holds are lifecycle-managed alongside the order state machine.

Hold states: PENDING → CONFIRMED → RELEASED | EXPIRED

4.4 Fraud Detection Service

Responsibilities: Real-time fraud scoring for each order.

Scoring model: A gradient boosted decision tree trained on 18 months of historical order data, retrained weekly. Features include: device fingerprint, IP geolocation, shipping address velocity, email domain reputation, order value percentile, and time-since-last-order for the customer.

Score thresholds:
  < 30   → APPROVED (auto-proceed)
  30–70  → REVIEW (human review queue; order proceeds unless reviewed within 2 hours)
  > 70   → REJECTED (order fails immediately)

The model is served via a dedicated ML inference service (TensorFlow Serving). The Fraud Detection Service calls it synchronously with a 2-second timeout; on timeout, the order defaults to REVIEW status.

─────────────────────────────────────────────────
5. DATA ARCHITECTURE
─────────────────────────────────────────────────

5.1 Primary Datastores

PostgreSQL (AWS RDS, Multi-AZ):
  - orders, order_line_items, order_events, outbox tables
  - Read replicas for reporting queries; write traffic on primary only
  - Connection pooling via PgBouncer (transaction mode, max 200 connections)
  - Automated daily snapshots; PITR enabled with 14-day retention

Redis (AWS ElastiCache, cluster mode):
  - Idempotency key storage (TTL 24h)
  - Rate limit counters (TTL 1m sliding window)
  - Distributed locks for Orchestrator state transitions (TTL 30s with lease renewal)
  - Session cache for Cart Service (TTL 2h)

Kafka (Confluent Cloud):
  - Topics: order.created, payment.authorized, payment.declined, inventory.reserved, fraud.scored, order.authorized, order.failed, order.shipped, order.delivered
  - Partition count: 12 per topic (allows 12 parallel consumer instances)
  - Retention: 7 days
  - Consumer groups use manual offset commit (not auto-commit) to ensure at-least-once semantics

5.2 Schema Migrations

Database schema changes are managed with Flyway. Migration files follow the naming convention V{version}__{description}.sql. All migrations are reviewed and applied by the CI pipeline during deployments; rollback is via a compensating migration (not Flyway's undo, which is not used in production).

Breaking changes (column renames, type changes) are performed in three phases across three deployments:
  Phase 1: Add new column/table (backward compatible)
  Phase 2: Migrate data; update application to use new column
  Phase 3: Remove old column/table

─────────────────────────────────────────────────
6. API CONTRACT
─────────────────────────────────────────────────

6.1 Order Object (v2 schema)

{
  "id": "ord_01J3F2X...",          // KSUID — k-sortable unique ID
  "status": "AUTHORIZED",          // PENDING | AUTHORIZED | FAILED | SHIPPED | DELIVERED
  "customerId": "cust_01J...",
  "channel": "web",                // web | mobile | marketplace | kiosk
  "currency": "USD",
  "subtotal": 4999,                // cents
  "tax": 425,
  "shipping": 0,
  "total": 5424,
  "paymentAuthorizationId": "pi_...",
  "lineItems": [
    {
      "sku": "WIDGET-BLU-M",
      "quantity": 2,
      "unitPrice": 2499,
      "lockedAt": "2025-09-01T14:22:01Z"
    }
  ],
  "shippingAddress": {
    "line1": "...",
    "city": "...",
    "state": "CA",
    "postalCode": "94105",
    "country": "US"
  },
  "createdAt": "2025-09-01T14:22:00Z",
  "updatedAt": "2025-09-01T14:22:05Z"
}

6.2 Error Response Schema

{
  "error": {
    "code": "PAYMENT_DECLINED",
    "message": "The payment method was declined.",
    "detail": "insufficient_funds",
    "requestId": "req_01J..."
  }
}

Error codes are stable identifiers used for programmatic error handling. Human-readable messages may change; error codes do not change without a major version increment.

─────────────────────────────────────────────────
7. DEPLOYMENT & OPERATIONS
─────────────────────────────────────────────────

7.1 Infrastructure

All services run on Kubernetes (EKS, us-east-1 primary, us-west-2 standby). Each service is deployed as a separate Deployment with its own HPA configuration. Services do not share pods.

Minimum replicas:
  Order Intake Service:        4 (scales to 40 at peak)
  Payment Service:             3 (PCI isolation; fixed)
  Inventory Reservation:       2 (scales to 10)
  Fraud Detection Service:     2 (scales to 8)
  Order Orchestrator:          2 (scales to 6; stateless despite name)
  Fulfillment Router:          2 (scales to 4)

Container images are built via GitHub Actions, scanned with Trivy for CVEs, and pushed to ECR. Deployments use a rolling update strategy with maxUnavailable: 0 and maxSurge: 1.

7.2 Observability

Metrics: Prometheus + Grafana. Key dashboards: order intake rate, payment authorization rate, fraud rejection rate, Kafka consumer lag by topic, P99 latency by service.

Traces: OpenTelemetry with Jaeger backend. All inter-service calls propagate W3C trace context headers. Trace sampling rate: 1% for healthy requests, 100% for errors.

Logs: Structured JSON logs shipped to Elasticsearch via Fluent Bit. Log level is configurable per service at runtime via environment variable LOG_LEVEL. Default: INFO. Do not set DEBUG in production; it generates ~40× log volume and will fill the Elasticsearch index within hours.

Alerts:
  - Order intake error rate > 1% for 5 consecutive minutes → PagerDuty P1
  - Payment authorization timeout rate > 5% → PagerDuty P2
  - Kafka consumer lag > 10,000 messages on any topic → Slack warning
  - Any service with 0 ready pods → PagerDuty P1

7.3 Runbooks

All incident runbooks live in the /docs/runbooks directory of this repository. Required reading before taking an on-call shift:
  - runbooks/payment-provider-outage.md
  - runbooks/kafka-consumer-lag.md
  - runbooks/database-failover.md
  - runbooks/fraud-score-service-timeout.md

─────────────────────────────────────────────────
8. SECURITY
─────────────────────────────────────────────────

8.1 Authentication and Authorization

Internal service-to-service calls use mTLS with certificates managed by cert-manager and rotated every 90 days. No service accepts unauthenticated internal requests.

External API calls are authenticated via JWT (RS256, issued by the Identity Service). The API Gateway validates JWT signatures using the Identity Service's public key (fetched and cached at startup; refreshed every 15 minutes). Claims are passed to upstream services as HTTP headers; services do not re-validate tokens.

8.2 Secrets Management

All secrets (database passwords, payment provider API keys, Kafka SASL credentials) are stored in AWS Secrets Manager. Services retrieve secrets at startup via the AWS SDK; secrets are not mounted as environment variables. Secrets are rotated automatically for database credentials (90-day rotation via RDS Lambda rotator) and manually for third-party API keys (rotated quarterly with 48-hour dual-key overlap).

8.3 PCI Compliance

The Payment Service is the sole PCI DSS-scoped service. It runs in a dedicated node group with no inter-pod communication to non-PCI services. Network policies enforce that the Payment Service can only receive traffic from the Kafka consumer connection and send traffic to payment provider endpoints (allowlisted by CIDR). Annual PCI-DSS assessment covers this service only.

─────────────────────────────────────────────────
9. FAILURE MODES AND RESILIENCE
─────────────────────────────────────────────────

9.1 Circuit Breakers

All synchronous external calls (Pricing Engine, Catalog Service, payment providers) are wrapped in a Resilience4j circuit breaker. Configuration:
  - Failure rate threshold: 50% over a 10-request sliding window
  - Open state duration: 30 seconds
  - Half-open probe requests: 2

When the Pricing Engine circuit is open, the Order Intake Service returns HTTP 503 with error code PRICING_UNAVAILABLE. Storefront clients are expected to retry with exponential backoff (initial delay 1s, max delay 30s, jitter ±500ms).

9.2 Idempotency and Retry Safety

All Kafka consumers are idempotent: reprocessing a previously processed event has no side effects. Order Intake Service enforces idempotency at the API boundary via Idempotency-Key. Payment Service deduplicates authorization requests by order ID before calling the payment provider.

9.3 Graceful Degradation

If the Fraud Detection Service is unavailable (circuit open, deployment in progress):
  - Orders with payment value < $500 default to REVIEW status (low-risk threshold for degraded operation)
  - Orders with payment value ≥ $500 are rejected with error code FRAUD_CHECK_UNAVAILABLE
  - The degraded mode flag is logged and emitted as a metric; it triggers a Slack alert after 60 seconds

─────────────────────────────────────────────────
10. FUTURE WORK AND KNOWN LIMITATIONS
─────────────────────────────────────────────────

10.1 Known Limitations

- The Order Orchestrator uses distributed locks in Redis for state transition coordination. Under split-brain conditions (rare but possible), a lock may be held by a crashed process until the 30-second TTL expires. Orders affected by this will be delayed by up to 30 seconds before the Orchestrator retries. Mitigation: the 30-second TTL is monitored; a P2 alert fires if any lock is held for > 25 seconds.

- Kafka consumer groups do not support partial rebalances. During a rolling deployment of any consumer service, all partitions for that consumer group are briefly reassigned, causing a processing pause of up to 15 seconds. During peak periods, this can cause Kafka lag alerts to trigger. Mitigation: deployments are scheduled outside peak hours (not between 11am–2pm EST or 7pm–10pm EST).

- The Payment Service does not yet support multi-currency settlement. All orders are authorized in USD; currency conversion is handled externally by the payment providers. This is tracked in OMS-4821.

10.2 Planned Improvements (Next Two Quarters)

- Migrate Order Intake idempotency from Redis to PostgreSQL (eliminates the Redis dependency for this path; simplifies the consistency model).
- Implement Saga pattern for the authorization flow (replaces the current Orchestrator-based coordination with event-driven compensating transactions; improves resilience during partial failures).
- Add support for split-shipment orders (a single order fulfilled from multiple locations with separate tracking numbers). Currently, OMS creates one shipment instruction per order. This is tracked in OMS-5102.
- Evaluate Apache Flink for real-time fraud feature computation (currently all fraud features are batch-computed nightly; real-time features would improve detection of velocity-based fraud patterns).

Document maintained by the Platform Engineering team. Questions and corrections: #oms-team in Slack or open a PR against this file.
```
