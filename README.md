# Underperforming Ad Pauser

Automatically pauses the worst-performing ad in each ad group when its CPA significantly exceeds the best ad's CPA. Helps maintain ad quality without manual review.

## What it does

1. Queries all enabled ads with sufficient impressions using GAQL
2. Groups ads by ad group and compares CPA within each group
3. Pauses the worst ad when its CPA exceeds the best ad's CPA by the configured multiplier
4. Sends an email summary of all paused (or flagged) ads

## Setup

1. Copy `main_en.gs` (or `main_fr.gs`) into a new Google Ads Script
2. Update the `CONFIG` block with your email and thresholds
3. Run once in TEST_MODE to review flagged ads
4. Set `TEST_MODE: false` when ready
5. Schedule daily or weekly

## CONFIG reference

| Parameter | Default | Description |
|---|---|---|
| `TEST_MODE` | `true` | Log only — no ads are paused |
| `EMAIL` | `you@example.com` | Email recipient for reports |
| `MIN_IMPRESSIONS` | `1000` | Minimum impressions to evaluate an ad |
| `MIN_ADS` | `2` | Minimum eligible ads in an ad group |
| `CPA_THRESHOLD_MULTIPLIER` | `1.5` | Pause if CPA > best CPA * this value |
| `DATE_RANGE` | `LAST_30_DAYS` | Evaluation window |

## How it works

The script uses `AdsApp.search()` with GAQL to pull ad-level cost and conversion data. It groups results by ad group, sorts by CPA, and compares the worst performer against the best. If the ratio exceeds `CPA_THRESHOLD_MULTIPLIER`, the ad is paused (or flagged in test mode).

## Requirements

- Google Ads account with active Search campaigns
- Permission to send emails (MailApp)

## License

MIT — Thibault Fayol Consulting
