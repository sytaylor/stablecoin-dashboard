# Artemis API Integration Notes

## API Configuration
- **Base URL**: `https://api.artemisxyz.com`
- **Authentication**: API key as query parameter `?APIKey=YOUR_KEY`
- **API Key**: Set in `.env.local` as `ARTEMIS_API_KEY`

## Available Stablecoins
- usdc, usdt, dai, usde, busd, usdt0, usdtb, usdai, syrupusdt

## Key Metrics Available for Stablecoins
Based on testing with USDC:

1. **STABLECOIN_MC** - Total supply/market cap (USD)
2. **DAU** - Daily active users (transacting addresses)
3. **DAILY_TXNS** - Daily transaction count
4. **PRICE** - Token price
5. **MC** - Market cap
6. **24H_VOLUME** - Daily trading volume
7. **CIRCULATING_SUPPLY_NATIVE** - Circulating supply

## Python SDK Usage
```python
from artemis import Artemis
client = Artemis(api_key=YOUR_KEY)

# List all assets
assets = client.asset.list_asset_symbols()

# Get supported metrics for an asset
metrics = client.asset.list_supported_metrics(symbol='usdc')

# Fetch data
data = client.fetch_metrics(
    metric_names='STABLECOIN_MC',
    symbols='usdc',
    start_date='2025-01-01',
    end_date='2025-01-10'
)
```

## Important Notes
- The specialized Snowflake metrics (ARTEMIS_STABLECOIN_TRANSFER_VOLUME, P2P_STABLECOIN_TRANSFER_VOLUME, etc.) mentioned in the docs don't appear to be available via the REST API
- These metrics might require direct Snowflake access or a different API tier
- The REST API provides general crypto asset metrics, not the detailed labeled wallet data

## What's Available vs What Was Expected
✓ Available: Supply, DAU, transactions, market data
✗ Not found via REST API: Artemis-filtered volumes, P2P volumes, address-level labeled data

## Next Steps
Consider:
1. Using available metrics (STABLECOIN_MC, DAU, DAILY_TXNS)
2. Contacting Artemis support about accessing Snowflake-based stablecoin metrics
3. Using the current estimation methodology until detailed metrics are accessible
