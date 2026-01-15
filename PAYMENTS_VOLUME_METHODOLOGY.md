# Payments Volume Methodology

## Current Implementation

### What We're Using: **Estimation Method**

The "24h Payments Volume (Est.)" metric uses a **research-based estimation methodology**, not real-time labeled wallet data.

**Source:** Artemis 2025 "Stablecoin Payments from the Ground Up" report + Visa/Allium research

### The 38% Payments Estimate

**Calculation:**
```
Raw On-Chain Volume (24h) = All stablecoin transfers on-chain
Payments Volume = Raw Volume × 0.38 (38%)
```

**Why 38%?**

Based on Artemis 2025 research analyzing stablecoin transaction patterns:

| Category | % of Raw Volume | Included in Payments? |
|----------|----------------|----------------------|
| CEX Activity | 28% | ❌ No - Internal exchange transfers |
| DeFi/DEX | 22% | ❌ No - Trading & liquidity provision |
| Bridges | 8% | ❌ No - Cross-chain infrastructure |
| B2B Payments | 18% | ✅ Yes - Business-to-business transfers |
| P2P Transfers | 10% | ✅ Yes - Peer-to-peer EOA transfers |
| P2B/B2P | 10% | ✅ Yes - Consumer-business payments |
| Other/Unknown | 4% | ❌ No - MEV bots, unclassified |
| **Total Payments** | **38%** | **Real economic activity** |

### What Gets Excluded (62%):
- **CEX Activity (28%):** Internal exchange transfers between hot wallets
- **DeFi/DEX (22%):** DEX trading, liquidity adds/removes, yield farming
- **Bridges (8%):** Cross-chain transfers (infrastructure, not end-use)
- **Other (4%):** MEV bots, sandwich attacks, unclassified activity

### What's Included (38%):
- **B2B Payments (18%):** Business paying business (invoices, B2B commerce)
- **P2P Transfers (10%):** Person-to-person (remittances, peer payments)
- **P2B/B2P (10%):** Consumer-business transactions (purchasing goods/services)

## Why Not Real Artemis Labeled Data?

### What We Discovered:

**Artemis offers two data access methods:**

1. **REST API** (What we have access to)
   - ✅ Available: DAU, DAILY_TXNS, STABLECOIN_MC, PRICE
   - ❌ NOT Available: ARTEMIS_STABLECOIN_TRANSFER_VOLUME, P2P_STABLECOIN_TRANSFER_VOLUME

2. **Snowflake Data Share** (Requires separate agreement)
   - ✅ Has: Labeled wallet data with address categories
   - ✅ Has: Filtered volume metrics (CEX excluded, P2P only, etc.)
   - ❌ Not accessible via REST API

### The Snowflake Metrics (What We Can't Access):

```
ARTEMIS_STABLECOIN_TRANSFER_VOLUME
- Excludes: CEX internal transfers, MEV bots
- Includes: DeFi, payments, legitimate activity

P2P_STABLECOIN_TRANSFER_VOLUME
- EOA-to-EOA transfers only
- Pure peer-to-peer activity
- No smart contracts involved
```

**Why they're not available:**
- Snowflake metrics require data warehouse integration
- Not exposed through public REST API
- Would need enterprise Snowflake data share agreement

## Methodology Accuracy

### How Accurate is the 38% Estimate?

**Strengths:**
- ✅ Based on extensive Artemis research analyzing billions of transactions
- ✅ Validated by Visa and Allium independent studies
- ✅ Aligns with industry observations (most on-chain volume is speculation)
- ✅ Consistent with other research (Chainalysis, Nansen)

**Limitations:**
- ⚠️ Assumes constant 38% ratio across all chains (varies in reality)
- ⚠️ Doesn't account for real-time shifts in usage patterns
- ⚠️ Percentages differ by stablecoin (USDT vs USDC have different profiles)
- ⚠️ Regional variations not captured (Tron different from Ethereum)

**Actual Variation by Chain (from Artemis 2025 report):**
- **Ethereum:** ~32% payments (high DeFi activity)
- **Tron:** ~55% payments (P2P remittances dominant)
- **Solana:** ~28% payments (speculation heavy)
- **Arbitrum/Base:** ~35% payments (emerging use cases)

### What Would Real Labeled Data Give Us?

If we had Snowflake access:
1. **Chain-specific accuracy:** Different % for each chain
2. **Stablecoin-specific:** USDT vs USDC vs DAI breakdowns
3. **Real-time classification:** Actual wallet labels (CEX, DEX, bridge, EOA)
4. **Time-series trends:** See payments % changing over time
5. **Geographic patterns:** Regional usage differences

## Display to Users

### Current UI:

**Title:** `24h Payments Volume (Est.)`

**Subtitle:** `~38% of raw volume`

**Tooltip:**
```
Estimated using Visa/Allium & Artemis 2025 research methodology:
~38% of raw on-chain volume is real payments (P2P + B2B), excluding
CEX/DEX/bridge activity. Artemis Snowflake metrics not available via
REST API. Last 24 hours.
```

**Indicator:** Shows "(Est.)" to clearly mark as estimation

## Future Enhancement Options

### Option 1: Request Snowflake Access
- Contact Artemis for data share agreement
- Likely requires paid tier or partnership
- Would give real labeled wallet data

### Option 2: Build Our Own Labeling
- Label known CEX/DEX/bridge addresses
- Filter transactions involving these addresses
- More work, less comprehensive than Artemis

### Option 3: Use Alternative Data Sources
- Chainalysis (expensive)
- Nansen (labels available but costs)
- TRM Labs (compliance-focused)

### Option 4: Keep Current Approach
- Acknowledge it's an estimate
- Reference authoritative research
- Update percentages if Artemis publishes new reports

## References

1. **Artemis Analytics** - "Stablecoin Payments from the Ground Up 2025"
   - Analyzed 100+ stablecoins across 17 chains
   - Billions of transactions labeled and categorized

2. **Visa Crypto** - "Stablecoin Activity Dashboard" (2024)
   - Independent validation of ~35-40% payments estimate

3. **Allium** - "The State of Stablecoins 2024"
   - Similar findings: 30-45% range for payments

4. **Artemis API Documentation**
   - REST API endpoints: https://app.artemisanalytics.com/docs
   - Snowflake data share: Separate product offering

## Bottom Line

**What we show:** Research-based 38% estimate
**What it means:** ~$30B+ of daily payments activity (out of ~$80B raw volume)
**Accuracy:** Industry-validated methodology, but not real-time labeled data
**Transparency:** Clearly marked as "(Est.)" with full methodology in tooltip

The estimate is sound and research-backed, but users should understand it's not live wallet labeling.
