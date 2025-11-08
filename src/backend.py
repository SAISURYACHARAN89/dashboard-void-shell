import re
import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_socketio import SocketIO
import requests
import json
import os
import threading
import time
from datetime import datetime
import sys
import gzip
from io import BytesIO
import brotli
import pathlib
import axiom_search
from postwithca import twitter_search_api, parse_twitter_metrics  # Fixed import

# Ensure Windows console supports UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

# ✅ Initialize Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = 'abc123'

# ✅ Explicit CORS setup
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# ✅ Socket.IO setup with all origins allowed
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet",
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25
)

# -------------------------
# CONFIG & GLOBALS
# -------------------------
DATA_SOURCE = "axiom"
ENABLE_SEARCH_FETCH = True

# Important: do NOT pre-fill. We wait for user input.
SEARCH_QUERY = None

# Initialize variables
PAIR_ADDRESS = None
community_id = None
screen_name = None
tweet_id = None
x_data_type = None
key_value = None

BASE_DIR = pathlib.Path(__file__).parent.resolve()
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Use a safe default file until a pair is configured
JSON_FILE = DATA_DIR / "pending.json"
CONFIG_FILE = DATA_DIR / "dashboard_config.json"

fetch_interval = 3  # seconds
search_fetch_interval = 10  # seconds for Twitter search only
last_search_fetch_time = 0

def _set_json_file_from_pair():
    """Switch JSON_FILE to use the current PAIR_ADDRESS once configured."""
    global JSON_FILE
    JSON_FILE = DATA_DIR / f"{PAIR_ADDRESS}.json" if PAIR_ADDRESS else (DATA_DIR / "pending.json")

# Alpha.ai API endpoints and headers
alpha_headers = {
    "accept": "application/json, text/plain, */*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-US,en;q=0.9",
    "exchange-client": "pc",
    "origin": "https://alph.ai",
    "referer": "https://alph.ai/",
    "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "x-request-timestamp": str(int(time.time() * 1000))
}

alpha_cookies = {
    "sajssdk_2015_cross_new_user": "1",
    "sensorsdata2015jssdkcross": "%7B%22distinct_id%22%3A%22199c20c45438f6-09339f140436c8-26061951-1327104-199c20c454414af%22%2C%22first_id%22%3A%22%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%2C%22%24latest_landing_page%22%3A%22https%3A%2F%2Falph.ai%2Fbsc%2Ftoken%2F1DEV-0x0b3b65fabd234cafeb9e98b02826bf8607224444%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTk5YzIwYzQ1NDM4ZjYtMDkzMzlmMTQwNDM2YzgtMjYwNjE5NTEtMTMyNzEwNC0xOTljMjBjNDU0NDE0YWYifQ%3D%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%22%2C%22value%22%3A%22%22%7D%7D"
}

# Alpha.ai API endpoints
alpha_endpoints = {
    "token_detail": "https://b.alph.ai/smart-web-gateway/token/token-detail",
    "holders_stats": "https://b.alph.ai/smart-web-gateway/coin/detail/holders/stats"
}

# Axiom API endpoints (will be updated after config)
axiom_endpoints = {
    "pair_info": "https://api9.axiom.trade/pair-info",
    "token_info": "https://api9.axiom.trade/token-info",
    "pair_stats": "https://api9.axiom.trade/pair-stats",
    "token_holders": "https://api10.axiom.trade/token-info"
}

# Axiom API config
axiom_headers = {
    "accept": "application/json, text/plain, */*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    "origin": "https://axiom.trade",
    "referer": "https://axiom.trade/",
    "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
}

axiom_cookies = {
    "auth-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiMWJiMzA2NzYtMzViZS00ZDQ4LWFlY2QtODZmM2NiMDI3NmY2IiwiaWF0IjoxNzU4MjY3ODU3LCJleHAiOjE3NTgyNjg4MTd9.oWDeaZX2cYKM8PpwW7srMjQE0D3Y1_sqDjDA3jIMGUM",
    "auth-refresh-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6ImE1OTczNTczLTZkNzYtNGFhNy1hN2FjLWM1NTlhMzYyMjkxZSIsImlhdCI6MTc1NzA5MDM2N30.eyAxIxtMo71JhCjX9hQ-nuld1wX9TYJx_gc7lOHoOf0"
}

# X.com API config
x_headers = {
    "authority": "x.com",
    "accept": "*/*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-US,en;q=0.9",
    "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
    "content-type": "application/json",
    "cookie": "__cf_bm=1cSqGaxpaI2wXhphsKu3VOKJEPy98lvHCtpgn.MQQOU-1760418552.1970627-1.0.1.1-ugaOxwFL5IngTnaMgS1TQdBMZipeyFdAMrARA27i3e...",
    "priority": "u=1, i",
    "referer": "https://x.com/",
    "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "x-client-transaction-id": "VVinetZu5QWNAKq6fhLKjdDRBJ3S7hft2q23iXSRKI4ztNg8uLuhKxIkhqyOU1GD5nsty1FL6ZUJYk3Ak3RqSCnr+g7JVg",
    "x-csrf-token": "61f38a6545d11663e819f9f141229a157b4da9742e66762cb54e799b149de7d6ea6d327...",
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-client-language": "en"
}

# Initialize X URLs
x_urls = {
    "timeline": (
        "https://x.com/i/api/graphql/Nyt-88UX4-pPCImZNUl9RQ/CommunityTweetsTimeline"
        f"?variables=%7B%22communityId%22%3A%22{community_id}%22%2C%22count%22%3A20%2C%22displayLocation%22%3A%22Community%22%2C%22rankingMode%22%3A%22Relevance%22%2C%22withCommunity%22%3Atrue%7D"
        "&features=%7B%22rweb_video_screen_enabled%22%3Afalse%2C%22payments_enabled%22%3Afalse%2C%22rweb_xchat_enabled%22%3Afalse%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Atrue%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22premium_content_api_read_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22responsive_web_grok_analyze_button_fetch_trends_enabled%22%3Afalse%2C%22responsive_web_grok_analyze_post_followups_enabled%22%3Atrue%2C%22responsive_web_jetfuel_frame%22%3Atrue%2C%22responsive_web_grok_share_attachment_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22responsive_web_grok_show_grok_translated_post%22%3Atrue%2C%22responsive_web_grok_analysis_button_from_backend%22%3Atrue%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_grok_image_annotation_enabled%22%3Atrue%2C%22responsive_web_grok_imagine_annotation_enabled%22%3Atrue%2C%22responsive_web_grok_community_note_auto_translation_is_enabled%22%3Afalse%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D"
    ),
    "fetchOne": (
        "https://x.com/i/api/graphql/pbuqwPzh0Ynrw8RQY3esYA/CommunitiesFetchOneQuery"
        f"?variables=%7B%22communityId%22%3A%22{community_id}%22%2C%22withDmMuting%22%3Afalse%2C%22withGrokTranslatedBio%22%3Afalse%7D"
        "&features=%7B%22payments_enabled%22%3Afalse%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Atrue%7D"
    ),
}

COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
PRICE_UPDATE_INTERVAL = 600  # 10 minutes in seconds

# Global cache for SOL price
cached_sol_price = {
    "price": 0,
    "last_updated": 0
}

# -------------------------
# TWITTER SEARCH
# -------------------------
def fetch_twitter_search_metrics(query=None):
    """Parse Twitter search results and extract metrics."""
    try:
        q = query or SEARCH_QUERY
        if not q:
            return get_empty_search_metrics()

        print(f"🔍 Starting search for: {q}")
        search_results = twitter_search_api.search_timeline(q)

        if not search_results:
            print("❌ No search results returned")
            return get_empty_search_metrics()

        metrics = parse_twitter_metrics(search_results)
        if metrics and metrics.get("success"):
            print(f"✅ Found {metrics['total_posts_count']} posts from {metrics['unique_authors_count']} authors")
            return metrics

        return get_empty_search_metrics()
    except Exception as e:
        print(f"❌ Error in search metrics: {e}")
        return get_empty_search_metrics()

def get_empty_search_metrics():
    return {
        "total_posts_count": 0,
        "total_media_posts_count": 0,
        "total_normal_posts_count": 0,
        "unique_authors_count": 0,
        "unique_authors": {},
        "success": False
    }

# -------------------------
# ALPHA.AI DATA FETCHING
# -------------------------
def fetch_alpha_data():
    data = {}
    # Fetch token detail
    try:
        token_detail_params = {
            "chain": "bsc",  # Adjust if needed
            "token": PAIR_ADDRESS,
            "language": "en_US"
        }
        resp = requests.get(
            alpha_endpoints["token_detail"],
            params=token_detail_params,
            headers=alpha_headers,
            cookies=alpha_cookies,
            timeout=15
        )
        print(f"[alpha_token_detail] Status {resp.status_code}, Length {len(resp.content)}")
        if resp.status_code == 200:
            token_data = resp.json()
            data["token_detail"] = token_data
            print(f"✅ Fetched Alpha.ai token detail")
        else:
            data["token_detail"] = {}
            print(f"❌ Alpha.ai token detail failed: {resp.status_code}")
    except Exception as e:
        print(f"❌ Error fetching Alpha.ai token detail: {e}")
        data["token_detail"] = {}

    # Fetch holders stats
    try:
        holders_params = {
            "chain": "solana",
            "token": PAIR_ADDRESS
        }
        resp = requests.get(
            alpha_endpoints["holders_stats"],
            params=holders_params,
            headers=alpha_headers,
            cookies=alpha_cookies,
            timeout=15
        )
        print(f"[alpha_holders_stats] Status {resp.status_code}, Length {len(resp.content)}")
        if resp.status_code == 200:
            holders_data = resp.json()
            data["holders_stats"] = holders_data
            print(f"✅ Fetched Alpha.ai holders stats")
        else:
            data["holders_stats"] = {}
            print(f"❌ Alpha.ai holders stats failed: {resp.status_code}")
    except Exception as e:
        print(f"❌ Error fetching Alpha.ai holders stats: {e}")
        data["holders_stats"] = {}

    return data

def process_alpha_data(alpha_data):
    token_detail = alpha_data.get("token_detail", {}).get("data", {})
    holders_stats = alpha_data.get("holders_stats", {}).get("data", {})

    token_info = {
        "tokenAddress": PAIR_ADDRESS,
        "tokenchain": token_detail.get("chain"),
        "tokenname": token_detail.get("tokenFullName"),
        "marketcap": token_detail.get("marketCap"),
        "tokentime": token_detail.get("tokenCreateTime"),
        "twitter": token_detail.get("tokenMediaVo", {}).get("twitter"),
        "holderCount": holders_stats.get("totalHolders"),
        "top10HoldersPercent": holders_stats.get("top10Percent"),
        "sniperPercent": holders_stats.get("snipersPercent"),
        "insiderTradingPercent": holders_stats.get("insidersTradingPercent"),
        "bundleWalletPercent": holders_stats.get("bundlerWalletPercent"),
    }
    return token_info

# -------------------------
# AXIOM DATA FETCHING
# -------------------------
def _axiom_url(base, key="pairAddress", value=None):
    if not value:
        return f"{base}"
    sep = "&" if "?" in base else "?"
    return f"{base}{sep}{key}={value}"

def fetch_axiom_data():
    data = {}
    # Build URLs lazily using current PAIR_ADDRESS
    endpoints = {
        "pair_info": _axiom_url("https://api9.axiom.trade/pair-info", "pairAddress", PAIR_ADDRESS),
        "token_info": _axiom_url("https://api9.axiom.trade/token-info", "pairAddress", PAIR_ADDRESS),
        "pair_stats": _axiom_url("https://api9.axiom.trade/pair-stats", "pairAddress", PAIR_ADDRESS),
        "token_holders": _axiom_url("https://api10.axiom.trade/token-info", "pairAddress", PAIR_ADDRESS),
    }
    for name, url in endpoints.items():
        try:
            resp = requests.get(url, headers=axiom_headers, cookies=axiom_cookies, timeout=15)
            if resp.status_code == 200:
                data[name] = resp.json()
            else:
                data[name] = {}
        except Exception as e:
            print(f"❌ Error fetching Axiom {name}: {e}")
            data[name] = {}
    return data

def process_axiom_data(axiom_data):
    pair_info = axiom_data.get("pair_info", {})
    token_info = axiom_data.get("token_info", {})
    token_holders = axiom_data.get("token_holders", {})
    pair_stats = axiom_data.get("pair_stats", [])
    first_stats = pair_stats[0] if pair_stats else {}
    sol_price_usd = cached_sol_price["price"]

    # Calculate fib levels
    fib62 = 0
    fib50 = 0
    min_mc = 5750
    max_mc = min_mc

    if os.path.exists(JSON_FILE):
        try:
            with open(JSON_FILE, "r", encoding="utf-8") as f:
                max_mc = min_mc
                for line in f:
                    try:
                        entry = json.loads(line)
                        mc = entry.get("axiom", {}).get("marketCapUSD", 0)
                        if mc > max_mc:
                            max_mc = mc
                    except:
                        continue
            fib62 = min_mc + 0.62 * (max_mc - min_mc)
            fib50 = min_mc + 0.50 * (max_mc - min_mc)
        except Exception as e:
            print(f"❌ Error calculating fib levels: {e}")

    # Extract token metrics
    top10_holders_percent = token_holders.get("top10HoldersPercent", 0)
    insiders_hold_percent = token_holders.get("insidersHoldPercent", 0)
    bundlers_hold_percent = token_holders.get("bundlersHoldPercent", 0)
    snipers_hold_percent = token_holders.get("snipersHoldPercent", 0)

    # Process wallet ages
    holders_info = []
    wallet_age_counts = {"baby": 0, "adult": 0, "old": 0}
    total_holders_count = token_info.get("numHolders", 0)

    try:
        holder_url = f"https://api6.axiom.trade/holder-data-v3?pairAddress={PAIR_ADDRESS}&onlyTrackedWallets=false"
        holder_resp = requests.get(holder_url, headers=axiom_headers, cookies=axiom_cookies, timeout=15)
        if holder_resp.status_code == 200:
            holder_json = holder_resp.json()
            if isinstance(holder_json, dict):
                holder_json = [holder_json]
            if isinstance(holder_json, list):
                seen_wallets = set()
                for h in holder_json:
                    if not h or not isinstance(h, dict):
                        continue
                    wallet = h.get("walletAddress")
                    if not wallet or wallet in seen_wallets:
                        continue
                    seen_wallets.add(wallet)
                    funded_at = None
                    wf = h.get("walletFunding")
                    if isinstance(wf, dict):
                        funded_at = wf.get("fundedAt")
                    age_category = categorize_wallet_age(funded_at)
                    wallet_age_counts[age_category] += 1
                    holders_info.append({
                        "walletAddress": wallet,
                        "fundedAt": funded_at,
                        "ageCategory": age_category
                    })
            total_holders_count = token_info.get("numHolders", len(holder_json))
    except Exception as e:
        print(f"❌ Error fetching holders fundedAt: {e}")
        if total_holders_count > 0:
            wallet_age_counts = {
                "baby": max(1, int(total_holders_count * 0.4)),
                "adult": max(1, int(total_holders_count * 0.3)),
                "old": max(1, int(total_holders_count * 0.3))
            }

    return {
        "tokenAddress": pair_info.get("tokenAddress"),
        "tokenName": pair_info.get("tokenName"),
        "tokenTicker": pair_info.get("tokenTicker"),
        "dexPaid": pair_info.get("dexPaid"),
        "twitter": pair_info.get("twitter"),
        "tokenImage": pair_info.get("tokenImage"),
        "createdAt": pair_info.get("createdAt"),
        "marketCapSol": (first_stats.get("priceSol", 0) * pair_info.get("supply", 0)) if first_stats else None,
        "marketCapUSD": ((first_stats.get("priceSol", 0) * pair_info.get("supply", 0)) * sol_price_usd) if first_stats else None,
        "fibLevel62": fib62,
        "fibLevel50": fib50,
        "volumeSol": first_stats.get("buyVolumeSol", 0) - first_stats.get("sellVolumeSol", 0),
        "volumeUSD": ((first_stats.get("buyVolumeSol", 0) - first_stats.get("sellVolumeSol", 0)) * sol_price_usd),
        "netCount": first_stats.get("buyCount", 0) - first_stats.get("sellCount", 0),
        "buyVolumeSol": first_stats.get("buyVolumeSol", 0),
        "buyVolumeUSD": first_stats.get("buyVolumeSol", 0) * sol_price_usd,
        "sellVolumeSol": first_stats.get("sellVolumeSol", 0),
        "sellVolumeUSD": first_stats.get("sellVolumeSol", 0) * sol_price_usd,
        "liquiditySol": pair_info.get("initialLiquiditySol"),
        "liquidityUSD": pair_info.get("initialLiquiditySol", 0) * sol_price_usd if pair_info.get("initialLiquiditySol") else 0,
        "numHolders": token_info.get("numHolders"),
        "supply": pair_info.get("supply"),
        "solPriceUSD": sol_price_usd,
        "priceLastUpdated": cached_sol_price["last_updated"],
        "holders": holders_info,
        "walletAgeCounts": wallet_age_counts,
        "totalHolders": total_holders_count,
        "top10HoldersPercent": top10_holders_percent,
        "insidersHoldPercent": insiders_hold_percent,
        "bundlersHoldPercent": bundlers_hold_percent,
        "snipersHoldPercent": snipers_hold_percent
    }

# -------------------------
# MARKET CAP DROP CHECK
# -------------------------
low_mc_start_time = None
peak_mc_seen = 0

def update_sol_price():
    while True:
        try:
            response = requests.get(COINGECKO_URL, timeout=10)
            if response.status_code == 200:
                data = response.json()
                cached_sol_price["price"] = data['solana']['usd']
                cached_sol_price["last_updated"] = time.time()
                print(f"✅ Updated SOL price: ${cached_sol_price['price']}")
        except Exception as e:
            print(f"❌ Error updating SOL price: {e}")
        time.sleep(PRICE_UPDATE_INTERVAL)

def get_sol_usd_price():
    try:
        resp = requests.get(COINGECKO_URL, timeout=10)
        if resp.status_code == 200:
            return resp.json().get("solana", {}).get("usd", 0)
    except Exception as e:
        print(f"❌ Error fetching SOL price: {e}")
    return 0

# -------------------------
# X DATA FETCHING
# -------------------------
def fetch_x_community_data():
    data = {}
    for name, url in x_urls.items():
        try:
            resp = requests.get(url, headers=x_headers, timeout=15)
            if resp.status_code == 200:
                raw = resp.json()
                if name == "fetchOne":
                    community = raw.get("data", {}).get("communityResults", {}).get("result", {})
                    admin = community.get("admin_results", {}).get("result", {})
                    core = admin.get("core", {})
                    legacy = admin.get("legacy", {})
                    data[name] = {
                        "id": community.get("id_str"),
                        "name": community.get("name"),
                        "description": community.get("description"),
                        "member_count": community.get("member_count"),
                        "admin": {
                            "name": core.get("name"),
                            "screen_name": core.get("screen_name"),
                            "followers": legacy.get("followers_count"),
                            "statuses": legacy.get("statuses_count"),
                            "bio": legacy.get("description"),
                        },
                    }
                elif name == "timeline":
                    tweets = []
                    instructions = raw.get("data", {}).get("communityResults", {}).get("result", {}).get("ranked_community_timeline", {}).get("timeline", {}).get("instructions", [])
                    for ins in instructions:
                        if ins.get("type") != "TimelineAddEntries":
                            continue
                        for entry in ins.get("entries", []):
                            tweet = entry.get("content", {}).get("itemContent", {}).get("tweet_results", {}).get("result", {})
                            if not tweet or tweet.get("__typename") != "Tweet":
                                continue
                            legacy = tweet.get("legacy", {})
                            user_legacy = tweet.get("core", {}).get("user_results", {}).get("result", {}).get("legacy", {})
                            user_core = tweet.get("core", {}).get("user_results", {}).get("result", {}).get("core", {})
                            tweets.append({
                                "tweet_id": tweet.get("rest_id"),
                                "text": legacy.get("full_text"),
                                "created_at": legacy.get("created_at"),
                                "author_name": user_core.get("name"),
                                "author_screen": user_core.get("screen_name"),
                                "followers_count": user_legacy.get("followers_count"),
                                "retweet_count": legacy.get("retweet_count"),
                                "reply_count": legacy.get("reply_count"),
                                "favorite_count": legacy.get("favorite_count"),
                                "views": tweet.get("views", {}).get("count", "0"),
                            })
                    data[name] = tweets
                else:
                    data[name] = raw
            else:
                data[name] = {}
        except Exception as e:
            print(f"❌ Error fetching X {name}: {e}")
            data[name] = {}
    return data

def fetch_x_single_account_data(screen_name_param=None):
    """Fetch profile and timeline data for a single X account"""
    data = {}

    screen = screen_name_param or screen_name
    if not screen:
        return {"profile": {"error": "No screen name"}, "timeline": []}

    x_headers_local = {
        "authorization": x_headers["authorization"],
        "x-csrf-token": x_headers.get("x-csrf-token", ""),
        "x-twitter-active-user": "yes",
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-client-language": "en",
        "user-agent": x_headers["user-agent"],
        "accept": "*/*"
    }

    cookies = {
        "d_prefs": "MjoxLGNvbnNlbnRfdmVyc2lvbjoyLHRleHRfdmVyc2lvbjoxMDAw",
        "__cuid": "d9f285191ba7417b8b0668b4deb3ea1c",
        "kdt": "bCVzebeRicfFpAjpz0l2iW5RHQ82C02b3ft88dxy",
        "lang": "en",
        "dnt": "1",
        "guest_id": "v1:175864037128521710",
        "auth_token": "84c79d35cb2a902f89168422691d42a685e810cb",
        "ct0": x_headers.get("x-csrf-token", ""),
        "twid": "u=1919992237397835776"
    }

    # --- Fetch user profile ---
    try:
        profile_url = (
            f"https://x.com/i/api/graphql/96tVxbPqMZDoYB5pmzezKA/UserByScreenName"
            f"?variables={json.dumps({'screen_name': screen, 'withGrokTranslatedBio': False})}"
            f"&features={json.dumps({'hidden_profile_subscriptions_enabled': True,'payments_enabled': False,'profile_label_improvements_pcf_label_in_post_enabled': True,'rweb_tipjar_consumption_enabled': True,'verified_phone_label_enabled': True,'subscriptions_verification_info_is_identity_verified_enabled': True,'subscriptions_verification_info_verified_since_enabled': True,'highlights_tweets_tab_ui_enabled': True,'responsive_web_twitter_article_notes_tab_enabled': True,'subscriptions_feature_can_gift_premium': True,'creator_subscriptions_tweet_preview_api_enabled': True,'responsive_web_graphql_skip_user_profile_image_extensions_enabled': False,'responsive_web_graphql_timeline_navigation_enabled': True})}"
            f"&fieldToggles={json.dumps({'withAuxiliaryUserLabels': True})}"
        )
        resp = requests.get(profile_url, headers=x_headers_local, cookies=cookies, timeout=15)
        print(f"[single_account_profile] Status {resp.status_code}, Length {len(resp.content)}")
        raw = resp.json()
        user_result = raw.get("data", {}).get("user", {}).get("result", {})
        core = user_result.get("core", {})
        legacy = user_result.get("legacy", {})
        data["profile"] = {
            "created_at": core.get("created_at"),
            "rest_id": user_result.get("rest_id"),
            "name": core.get("name"),
            "screen_name": core.get("screen_name"),
            "favourites_count": legacy.get("favourites_count"),
            "friends_count": legacy.get("friends_count"),
            "media_count": legacy.get("media_count"),
            "followers_count": legacy.get("followers_count"),
            "statuses_count": legacy.get("statuses_count"),
            "description": legacy.get("description"),
            "verified": user_result.get("verification", {}).get("verified", False)
        }
        print(f"✅ Fetched profile for {data['profile']['screen_name']}")
    except Exception as e:
        print(f"❌ Error fetching/parsing user profile: {e}")
        data["profile"] = {"error": str(e)}

    # --- Fetch user timeline ---
    try:
        if "rest_id" not in data.get("profile", {}):
            raise ValueError("Missing user rest_id; cannot fetch timeline.")

        timeline_url = "https://x.com/i/api/graphql/oBjKz90dxeaKJLDRsW9RPw/UserTweets"
        variables = {
            "userId": data["profile"].get("rest_id"),
            "count": 20,
            "includePromotedContent": True,
            "withQuickPromoteEligibilityTweetFields": True,
            "withVoice": True
        }
        features = {
            "rweb_video_screen_enabled": False,
            "payments_enabled": False,
            "profile_label_improvements_pcf_label_in_post_enabled": True,
            "rweb_tipjar_consumption_enabled": True,
            "verified_phone_label_enabled": True,
            "creator_subscriptions_tweet_preview_api_enabled": True,
            "responsive_web_graphql_timeline_navigation_enabled": True,
            "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
            "premium_content_api_read_enabled": False,
            "communities_web_enable_tweet_community_results_fetch": True,
            "c9s_tweet_anatomy_moderator_badge_enabled": True,
            "responsive_web_grok_analyze_post_followups_enabled": True,
            "responsive_web_jetfuel_frame": True,
            "responsive_web_grok_share_attachment_enabled": True,
            "articles_preview_enabled": True,
            "responsive_web_edit_tweet_api_enabled": True,
            "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
            "view_counts_everywhere_api_enabled": True,
            "longform_notetweets_consumption_enabled": True,
            "responsive_web_twitter_article_tweet_consumption_enabled": True,
            "responsive_web_grok_analysis_button_from_backend": True,
            "freedom_of_speech_not_reach_fetch_enabled": True,
            "standardized_nudges_misinfo": True,
            "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
            "longform_notetweets_rich_text_read_enabled": True,
            "longform_notetweets_inline_media_enabled": True,
            "responsive_web_grok_image_annotation_enabled": True,
            "responsive_web_grok_imagine_annotation_enabled": True,
            "responsive_web_grok_community_note_auto_translation_is_enabled": False,
            "responsive_web_enhance_cards_enabled": False
        }
        field_toggles = {"withArticlePlainText": False}

        resp = requests.get(
            timeline_url,
            headers=x_headers_local,
            cookies=cookies,
            params={
                "variables": json.dumps(variables),
                "features": json.dumps(features),
                "fieldToggles": json.dumps(field_toggles)
            },
            timeout=15
        )
        print(f"[single_account_timeline] Status {resp.status_code}, Length {len(resp.content)}")
        raw = resp.json()

        tweets = []
        instructions = (
            raw.get("data", {})
               .get("user", {})
               .get("result", {})
               .get("timeline", {})
               .get("timeline", {})
               .get("instructions", [])
        )
        for ins in instructions:
            if ins.get("type") != "TimelineAddEntries":
                continue
            for entry in ins.get("entries", []):
                tweet = (
                    entry.get("content", {})
                         .get("itemContent", {})
                         .get("tweet_results", {})
                         .get("result", {})
                )
                if not tweet or tweet.get("__typename") != "Tweet":
                    continue
                legacy = tweet.get("legacy", {})
                user = tweet.get("core", {}).get("user_results", {}).get("result", {})
                user_legacy = user.get("legacy", {})
                user_core = user.get("core", {})
                tweets.append({
                    "tweet_id": tweet.get("rest_id"),
                    "text": legacy.get("full_text"),
                    "created_at": legacy.get("created_at"),
                    "author_name": user_core.get("name"),
                    "author_screen": user_core.get("screen_name"),
                    "followers_count": user_legacy.get("followers_count"),
                    "retweet_count": legacy.get("retweet_count"),
                    "reply_count": legacy.get("reply_count"),
                    "favorite_count": legacy.get("favorite_count"),
                    "quote_count": legacy.get("quote_count"),
                    "bookmark_count": legacy.get("bookmark_count"),
                    "views": tweet.get("views", {}).get("count", 0),
                })

        data["timeline"] = tweets
        print(f"✅ Fetched {len(tweets)} timeline tweets")
    except Exception as e:
        print(f"❌ Error fetching/parsing timeline: {e}")
        data["timeline"] = {"error": str(e)}

    return data

def fetch_post_data(tweet_id_param=None):
    """Fetch detailed data for a specific post/tweet"""
    data = {}
    tid = tweet_id_param or tweet_id
    if not tid:
        print("❌ No tweet ID provided for post data")
        return {"post": {"error": "No tweet ID provided"}}
    try:
        url = f"https://x.com/i/api/graphql/URPP6YZ5eDCjdVMSREn4gg/TweetResultByRestId"
        params = {
            "variables": json.dumps({
                "tweetId": tid,
                "includePromotedContent": True,
                "withBirdwatchNotes": True,
                "withVoice": True,
                "withCommunity": True
            }),
            "features": json.dumps({
                "creator_subscriptions_tweet_preview_api_enabled": True,
                "premium_content_api_read_enabled": False,
                "communities_web_enable_tweet_community_results_fetch": True,
                "c9s_tweet_anatomy_moderator_badge_enabled": True,
                "responsive_web_grok_analyze_button_fetch_trends_enabled": False,
                "responsive_web_grok_analyze_post_followups_enabled": True,
                "responsive_web_jetfuel_frame": True,
                "responsive_web_grok_share_attachment_enabled": True,
                "articles_preview_enabled": True,
                "responsive_web_edit_tweet_api_enabled": True,
                "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
                "view_counts_everywhere_api_enabled": True,
                "longform_notetweets_consumption_enabled": True,
                "responsive_web_twitter_article_tweet_consumption_enabled": True,
                "tweet_awards_web_tipping_enabled": False,
                "responsive_web_grok_show_grok_translated_post": False,
                "responsive_web_grok_analysis_button_from_backend": True,
                "creator_subscriptions_quote_tweet_preview_enabled": False,
                "freedom_of_speech_not_reach_fetch_enabled": True,
                "standardized_nudges_misinfo": True,
                "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
                "longform_notetweets_rich_text_read_enabled": True,
                "longform_notetweets_inline_media_enabled": True,
                "payments_enabled": False,
                "profile_label_improvements_pcf_label_in_post_enabled": True,
                "rweb_tipjar_consumption_enabled": True,
                "verified_phone_label_enabled": True,
                "responsive_web_grok_image_annotation_enabled": True,
                "responsive_web_grok_imagine_annotation_enabled": True,
                "responsive_web_grok_community_note_auto_translation_is_enabled": False,
                "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
                "responsive_web_graphql_timeline_navigation_enabled": True,
                "responsive_web_enhance_cards_enabled": False
            })
        }
        resp = requests.get(url, headers=x_headers, params=params, timeout=15)
        print(f"[post_data] Status {resp.status_code}, Length {len(resp.content)}")
        if resp.status_code != 200:
            print(f"❌ Post data fetch failed: {resp.status_code} - {resp.text[:200]}")
            return {"post": {"error": f"HTTP {resp.status_code}", "message": resp.text[:200]}}
        raw = resp.json()
        tweet_result = raw.get("data", {}).get("tweetResult", {}).get("result", {})
        if not tweet_result:
            print("❌ No tweet result found in response")
            return {"post": {"error": "No tweet data found"}}
        legacy = tweet_result.get("legacy", {})
        core = tweet_result.get("core", {})
        user_results = core.get("user_results", {}).get("result", {})
        user_legacy = user_results.get("legacy", {})
        user_core = user_results.get("core", {})
        data["post"] = {
            "rest_id": tweet_result.get("rest_id"),
            "created_at": legacy.get("created_at"),
            "full_text": legacy.get("full_text"),
            "favorite_count": legacy.get("favorite_count", 0),
            "quote_count": legacy.get("quote_count", 0),
            "reply_count": legacy.get("reply_count", 0),
            "retweet_count": legacy.get("retweet_count", 0),
            "bookmark_count": legacy.get("bookmark_count", 0),
            "views_count": tweet_result.get("views", {}).get("count", 0),
            "user": {
                "rest_id": user_results.get("rest_id"),
                "name": user_core.get("name"),
                "screen_name": user_core.get("screen_name"),
                "created_at": user_core.get("created_at"),
                "followers_count": user_legacy.get("followers_count", 0),
                "friends_count": user_legacy.get("friends_count", 0),
                "favourites_count": user_legacy.get("favourites_count", 0),
                "statuses_count": user_legacy.get("statuses_count", 0),
                "media_count": user_legacy.get("media_count", 0),
                "listed_count": user_legacy.get("listed_count", 0),
                "description": user_legacy.get("description"),
                "verified": user_results.get("verification", {}).get("verified", False),
                "is_blue_verified": user_results.get("is_blue_verified", False),
                "profile_image_url": user_results.get("avatar", {}).get("image_url"),
            }
        }
        print(f"✅ Fetched post data for tweet {data['post']['rest_id']}")
    except Exception as e:
        print(f"❌ Error fetching post data: {e}")
        data["post"] = {"error": str(e)}
    return data

def fetch_x_data():
    """Main X data fetcher that routes to appropriate function based on data type"""
    if x_data_type == "community":
        return fetch_x_community_data()
    elif x_data_type == "single_account":
        return fetch_x_single_account_data()
    elif x_data_type == "post":
        return fetch_post_data()
    else:
        return {"error": "Unknown X data type"}

# -------------------------
# BACKGROUND FETCHERS
# -------------------------
def categorize_wallet_age(funded_at):
    if not funded_at:
        return "unknown"
    try:
        funded_date = datetime.fromisoformat(funded_at.replace('Z', '+00:00'))
        current_date = datetime.now(funded_date.tzinfo)
        age_days = (current_date - funded_date).days
        if age_days <= 30:
            return "baby"
        elif age_days <= 180:
            return "adult"
        else:
            return "old"
    except:
        return "unknown"

def fetch_platform_data():
    """Fetch data from the configured platform (Axiom or Alpha.ai)"""
    if not PAIR_ADDRESS:
        print("⛔ Waiting for user contract before fetching...")
        time.sleep(2)
        return {}

    if DATA_SOURCE == "alpha":
        print("🔍 Fetching data from Alpha.ai...")
        alpha_data = fetch_alpha_data()
        return process_alpha_data(alpha_data)
    else:  # Default to Axiom
        print("🔍 Fetching data from Axiom...")
        axiom_data = fetch_axiom_data()
        return process_axiom_data(axiom_data)

def fetch_all_data():
    """Fetch platform + X data, include twitter search metrics, save and emit result"""
    while True:
        try:
            platform_data = fetch_platform_data()
            x_data = fetch_x_data()

            # Process X data
            unique_authors = set()
            author_followers = []
            timeline_data = []

            if x_data_type == "community":
                timeline_data = x_data.get("timeline", [])
            elif x_data_type == "single_account":
                timeline_data = x_data.get("timeline", [])
                profile = x_data.get("profile", {})
                if profile and not profile.get("error"):
                    unique_authors.add(profile.get("screen_name", ""))
                    author_followers.append({
                        "author": profile.get("screen_name", ""),
                        "followers": profile.get("followers_count", 0),
                        "author_name": profile.get("name", "")
                    })
            elif x_data_type == "post":
                post = x_data.get("post", {})
                if post and not post.get("error"):
                    author = post.get("user", {}).get("screen_name", "")
                    followers = post.get("user", {}).get("followers_count", 0)
                    if author:
                        unique_authors.add(author)
                        author_followers.append({
                            "author": author,
                            "followers": followers,
                            "author_name": post.get("user", {}).get("name", "")
                        })
                    timeline_data.append({
                        "tweet_id": post.get("rest_id"),
                        "text": post.get("full_text"),
                        "created_at": post.get("created_at"),
                        "author_name": post.get("user", {}).get("name"),
                        "author_screen": author,
                        "followers_count": followers,
                        "retweet_count": post.get("retweet_count"),
                        "reply_count": post.get("reply_count"),
                        "favorite_count": post.get("favorite_count"),
                        "quote_count": post.get("quote_count"),
                        "bookmark_count": post.get("bookmark_count"),
                        "views": post.get("views_count", 0),
                    })

            # Count unique authors
            for item in timeline_data:
                author = item.get("author_screen")
                followers = item.get("followers_count", 0)
                if author and author not in unique_authors:
                    unique_authors.add(author)
                    author_followers.append({
                        "author": author,
                        "followers": followers,
                        "author_name": item.get("author_name", "")
                    })

            # ADD SEARCH METRICS (respect interval)
            search_metrics = {}
            if ENABLE_SEARCH_FETCH:
                global last_search_fetch_time
                now = time.time()
                if now - last_search_fetch_time >= search_fetch_interval:
                    search_metrics = fetch_twitter_search_metrics()
                    last_search_fetch_time = now
                else:
                    # Skip until interval passes
                    search_metrics = {}
                    remaining = int(search_fetch_interval - (now - last_search_fetch_time))
                    if remaining > 0:
                        print(f"⏭️ Skipping search fetch, next in {remaining}s")

            # Build result
            result = {
                "timestamp": datetime.now().isoformat(),
                "x_data_type": x_data_type,
                "data_source": DATA_SOURCE,
                "platform_data": platform_data,
                "x_data": x_data,
                "unique_authors": len(unique_authors),
                "author_followers": author_followers,
                "search_metrics": search_metrics
            }

            # Persist
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            daily_file = DATA_DIR / f"data_{timestamp[:8]}.json"
            try:
                with open(JSON_FILE, "a", encoding="utf-8") as f:
                    f.write(json.dumps(result, ensure_ascii=False) + "\n")
                with open(daily_file, "a", encoding="utf-8") as f:
                    f.write(json.dumps(result, ensure_ascii=False) + "\n")
            except Exception as e:
                print(f"❌ Error saving result files: {e}")

            cleanup_old_files()

            try:
                socketio.emit('data_update', result)
            except Exception as e:
                print(f"❌ Error emitting socket update: {e}")

            print(f"✅ Emitted and saved data at {result['timestamp']}")
            print(f"📊 X Data Type: {x_data_type}")
            print(f"🔧 Data Source: {DATA_SOURCE}")
            if ENABLE_SEARCH_FETCH and search_metrics:
                print(f"🔍 Search: {search_metrics.get('total_posts_count', 0)} posts, unique authors: {search_metrics.get('unique_authors_count', 0)}")

            return result  # single iteration (background_fetcher loops)
        except Exception as e:
            print(f"❌ Fetch failed, retrying in 5s: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(5)

def fetch_all_viewData():
    x_data_local = fetch_x_data()
    total_views = 0
    unique_authors = set()

    timeline_data = []
    if x_data_type == "community":
        timeline_data = x_data_local.get("timeline", [])
    elif x_data_type == "single_account":
        timeline_data = x_data_local.get("timeline", [])
        profile = x_data_local.get("profile", {})
        if profile and not profile.get("error"):
            unique_authors.add(profile.get("screen_name", ""))
    elif x_data_type == "post":
        post = x_data_local.get("post", {})
        if post and not post.get("error"):
            author = post.get("user", {}).get("screen_name", "")
            if author:
                unique_authors.add(author)
            timeline_data.append({
                "tweet_id": post.get("rest_id"),
                "text": post.get("full_text"),
                "created_at": post.get("created_at"),
                "author_name": post.get("user", {}).get("name"),
                "author_screen": author,
                "followers_count": post.get("user", {}).get("followers_count", 0),
                "retweet_count": post.get("retweet_count"),
                "reply_count": post.get("reply_count"),
                "favorite_count": post.get("favorite_count"),
                "quote_count": post.get("quote_count"),
                "bookmark_count": post.get("bookmark_count"),
                "views": post.get("views_count", 0),
            })
    for t in timeline_data:
        views = t.get("views", 0)
        try:
            views_int = int(views)
            total_views += views_int
        except (ValueError, TypeError):
            pass

        author = t.get("author_screen")
        if author:
            unique_authors.add(author)

    return {
        "total_views": total_views,
        "unique_authors": len(unique_authors)
    }

def check_exit_condition(curr_mc):
    global low_mc_start_time, peak_mc_seen
    if curr_mc > peak_mc_seen:
        peak_mc_seen = curr_mc
    cond1 = curr_mc < 6500
    cond2 = (peak_mc_seen > 0 and curr_mc < 0.1 * peak_mc_seen)
    if cond1 or cond2:
        if low_mc_start_time is None:
            low_mc_start_time = time.time()
        else:
            elapsed = time.time() - low_mc_start_time
            if elapsed >= 180:
                print(f"❌ MarketCapUSD drop detected for 3 minutes continuously. Exiting... "
                      f"(curr_mc={curr_mc}, peak_mc={peak_mc_seen})")
                os._exit(1)
    else:
        low_mc_start_time = None

def background_fetcher():
    while True:
        try:
            result = fetch_all_data()
            if result and "platform_data" in result:
                curr_mc = result["platform_data"].get("marketCapUSD", 0) or 0
                check_exit_condition(curr_mc)
            view_stats = fetch_all_viewData()
            print(f"📊 Timeline Stats → Views: {view_stats['total_views']} | Unique Authors: {view_stats['unique_authors']}")
        except Exception as e:
            print(f"❌ Error in background_fetcher: {e}")
        time.sleep(fetch_interval)

# -------------------------
# API ROUTES
# -------------------------
@app.route("/api/x-data")
def get_x_data():
    return jsonify({
        "success": True,
        "pair_address": PAIR_ADDRESS,
        "x_data_type": x_data_type,
        "key": key_value,
        "community_id": community_id,
        "screen_name": screen_name,
        "tweet_id": tweet_id
    })

@app.route("/api/debug/search-test")
def debug_search_test():
    try:
        test_query = "solana"
        print(f"🧪 Testing search with query: {test_query}")
        search_results = twitter_search_api.search_timeline(test_query)
        if search_results:
            twitter_search_api.save_response(search_results, "debug_search_response.json")
            # parse_twitter_authors was referenced earlier but not imported;
            # keeping a simple structure here to avoid NameError.
            return jsonify({
                "status": "success",
                "query": test_query,
                "response_keys": list(search_results.keys()) if isinstance(search_results, dict) else [],
                "has_data": isinstance(search_results, dict) and ("data" in search_results),
                "endpoint": getattr(twitter_search_api, "base_url", "unknown")
            })
        else:
            return jsonify({
                "status": "failed",
                "query": test_query,
                "error": "No results returned",
                "endpoint": getattr(twitter_search_api, "base_url", "unknown")
            })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "endpoint": getattr(twitter_search_api, "base_url", "unknown")
        }), 500

@app.route("/api/marketcap")
def marketcap_data():
    try:
        history_data = []
        if os.path.exists(JSON_FILE):
            with open(JSON_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()[-100:]
                for line in lines:
                    try:
                        data = json.loads(line)
                        timestamp = datetime.fromisoformat(data["timestamp"])
                        history_data.append({
                            "timestamp": timestamp.isoformat(),
                            "time": timestamp.strftime("%H:%M"),
                            "marketCapUSD": data.get("platform_data", {}).get("marketCapUSD", 0),
                            "marketCapSol": data.get("platform_data", {}).get("marketCapSol", 0),
                            "volumeUSD": data.get("platform_data", {}).get("volumeUSD", 0),
                            "priceSol": data.get("platform_data", {}).get("marketCapSol", 0) / data.get("platform_data", {}).get("supply", 1) if data.get("platform_data", {}).get("supply") else 0
                        })
                    except Exception:
                        continue

        latest = get_latest_data()
        current_mc = latest.get("platform_data", {}).get("marketCapUSD", 0)
        return jsonify({
            "current": {
                "marketCapUSD": current_mc,
                "marketCapSol": latest.get("platform_data", {}).get("marketCapSol", 0),
                "volumeUSD": latest.get("platform_data", {}).get("volumeUSD", 0),
                "lastUpdated": latest.get("timestamp", "")
            },
            "history": history_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/debug/post-data")
def debug_post_data():
    try:
        post_data = fetch_post_data()
        return jsonify({
            "tweet_id": tweet_id,
            "post_data_structure": str(post_data),
            "has_post": "post" in post_data,
            "post_keys": list(post_data.get("post", {}).keys()) if post_data.get("post") else [],
            "has_error": "error" in post_data.get("post", {})
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/debug/search-data")
def debug_search_data():
    try:
        search_data = twitter_search_api.search_timeline("DDpYogprNvKtLFfH8pyMgX8gT5LNVkA3GRaxEcBwpump")
        return jsonify({
            "search_response_type": type(search_data).__name__,
            "has_data_key": "data" in search_data if isinstance(search_data, dict) else False,
            "search_data_structure": str(search_data)[:500] if search_data else "None"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/tokeninfo")
def token_info_data():
    try:
        latest = get_latest_data()
        p = latest.get("platform_data", {})
        return jsonify({
            "tokenAddress": p.get("tokenAddress"),
            "tokenName": p.get("tokenName"),
            "tokenTicker": p.get("tokenTicker"),
            "twitter": p.get("twitter"),
            "tokenImage": p.get("tokenImage"),
            "createdAt": p.get("createdAt"),
            "bndpercentage": p.get("bundlersHoldPercent"),
            "top10": p.get("top10HoldersPercent"),
            "insidersHoldPercent": p.get("insidersHoldPercent"),
            "snipersHoldPercent": p.get("snipersHoldPercent"),
            "dexPaid": p.get("dexPaid")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/buys-sells")
def buys_sells_data():
    try:
        history_data = []
        if os.path.exists(JSON_FILE):
            with open(JSON_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()[-50:]
                for line in lines:
                    try:
                        data = json.loads(line)
                        timestamp = datetime.fromisoformat(data["timestamp"])
                        history_data.append({
                            "timestamp": timestamp.isoformat(),
                            "time": timestamp.strftime("%H:%M"),
                            "buyVolume": data.get("platform_data", {}).get("buyVolumeUSD", 0),
                            "sellVolume": data.get("platform_data", {}).get("sellVolumeUSD", 0),
                            "netVolume": data.get("platform_data", {}).get("volumeUSD", 0),
                            "buyCount": data.get("platform_data", {}).get("buyCount", 0),
                            "sellCount": data.get("platform_data", {}).get("sellCount", 0)
                        })
                    except Exception:
                        continue

        latest = get_latest_data()
        return jsonify({
            "current": {
                "buyVolume": latest.get("platform_data", {}).get("buyVolumeUSD", 0),
                "sellVolume": latest.get("platform_data", {}).get("sellVolumeUSD", 0),
                "netVolume": latest.get("platform_data", {}).get("volumeUSD", 0),
                "buyCount": latest.get("platform_data", {}).get("buyCount", 0),
                "sellCount": latest.get("platform_data", {}).get("sellCount", 0),
                "lastUpdated": latest.get("timestamp", "")
            },
            "history": history_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/wallet-age")
def wallet_age_data():
    try:
        latest = get_latest_data()
        wallet_age = latest.get("platform_data", {}).get("walletAgeCounts", {})
        holders_data = latest.get("platform_data", {}).get("holders", [])
        return jsonify({
            "distribution": wallet_age,
            "totalHolders": latest.get("platform_data", {}).get("totalHolders", 0),
            "holders": holders_data[:50],
            "lastUpdated": latest.get("timestamp", "")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/social")
def social_data():
    try:
        history_data = []
        if os.path.exists(JSON_FILE):
            with open(JSON_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()[-50:]
                for line in lines:
                    try:
                        data = json.loads(line)
                        timestamp = datetime.fromisoformat(data["timestamp"])
                        x_data_local = data.get("x_data", {})
                        timeline_data = []
                        if data.get("x_data_type") == "community":
                            timeline_data = x_data_local.get("timeline", [])
                        elif data.get("x_data_type") == "single_account":
                            timeline_data = x_data_local.get("timeline", [])
                        elif data.get("x_data_type") == "post":
                            post = x_data_local.get("post", {})
                            if post and not post.get("error"):
                                timeline_data = [post]
                        total_views = sum(int(t.get("views", 0) or t.get("views_count", 0)) for t in timeline_data if isinstance(t.get("views"), (int, float)))
                        total_likes = sum(t.get("favorite_count", 0) for t in timeline_data)
                        total_retweets = sum(t.get("retweet_count", 0) for t in timeline_data)
                        total_replies = sum(t.get("reply_count", 0) for t in timeline_data)
                        total_quotes = sum(t.get("quote_count", 0) for t in timeline_data)
                        total_bookmarks = sum(t.get("bookmark_count", 0) for t in timeline_data)
                        history_data.append({
                            "timestamp": timestamp.isoformat(),
                            "time": timestamp.strftime("%H:%M"),
                            "views": total_views,
                            "likes": total_likes,
                            "retweets": total_retweets,
                            "replies": total_replies,
                            "quotes": total_quotes,
                            "bookmarks": total_bookmarks,
                            "uniqueAuthors": data.get("unique_authors", 0)
                        })
                    except Exception:
                        continue

        latest = get_latest_data()
        x_data_local = latest.get("x_data", {})
        timeline_data = []
        if latest.get("x_data_type") == "community":
            timeline_data = x_data_local.get("timeline", [])
        elif latest.get("x_data_type") == "single_account":
            timeline_data = x_data_local.get("timeline", [])
        elif latest.get("x_data_type") == "post":
            post = x_data_local.get("post", {})
            if post and not post.get("error"):
                timeline_data = [post]

        current_views = sum(int(t.get("views", 0) or t.get("views_count", 0)) for t in timeline_data if t.get("views") or t.get("views_count"))
        current_likes = sum(t.get("favorite_count", 0) for t in timeline_data)
        current_retweets = sum(t.get("retweet_count", 0) for t in timeline_data)
        current_replies = sum(t.get("reply_count", 0) for t in timeline_data)
        current_quotes = sum(t.get("quote_count", 0) for t in timeline_data)
        current_bookmarks = sum(t.get("bookmark_count", 0) for t in timeline_data)

        member_count = 0
        if latest.get("x_data_type") == "community":
            member_count = x_data_local.get("fetchOne", {}).get("member_count", 0)
        elif latest.get("x_data_type") == "single_account":
            profile = x_data_local.get("profile", {})
            if profile and not profile.get("error"):
                member_count = profile.get("followers_count", 0)
        elif latest.get("x_data_type") == "post":
            post = x_data_local.get("post", {})
            if post and not post.get("error"):
                member_count = post.get("user", {}).get("followers_count", 0)

        search_metrics = latest.get("search_metrics", {})
        response_data = {
            "current": {
                "views": current_views,
                "likes": current_likes,
                "retweets": current_retweets,
                "replies": current_replies,
                "quotes": current_quotes,
                "bookmarks": current_bookmarks,
                "uniqueAuthors": latest.get("unique_authors", 0),
                "memberCount": member_count,
                "lastUpdated": latest.get("timestamp", "")
            },
            "history": history_data
        }
        if search_metrics:
            response_data["search_metrics"] = {
                "total_likes": search_metrics.get("total_likes", 0),
                "total_retweets": search_metrics.get("total_retweets", 0),
                "total_replies": search_metrics.get("total_replies", 0),
                "total_quotes": search_metrics.get("total_quotes", 0),
                "total_bookmarks": search_metrics.get("total_bookmarks", 0),
                "total_views": search_metrics.get("total_views", 0),
                "total_tweets": search_metrics.get("total_tweets", 0),
                "unique_authors_count": search_metrics.get("unique_authors_count", 0),
                "unique_authors": search_metrics.get("unique_authors", {}),
                "success": search_metrics.get("success", False)
            }
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/twitter-search")
def twitter_search():
    try:
        latest = get_latest_data()
        search_metrics = latest.get("search_metrics", {})
        if not search_metrics:
            return jsonify({
                "total_posts_count": 0,
                "total_media_posts_count": 0,
                "total_normal_posts_count": 0,
                "unique_authors_count": 0,
                "unique_authors": {},
                "success": False
            })
        return jsonify({
            "total_posts_count": search_metrics.get("total_posts_count", 0),
            "total_media_posts_count": search_metrics.get("total_media_posts_count", 0),
            "total_normal_posts_count": search_metrics.get("total_normal_posts_count", 0),
            "unique_authors_count": search_metrics.get("unique_authors_count", 0),
            "unique_authors": {
                username: {
                    "name": author_data.get("name", ""),
                    "followers_count": author_data.get("followers_count", 0)
                }
                for username, author_data in search_metrics.get("unique_authors", {}).items()
            },
            "success": search_metrics.get("success", False)
        })
    except Exception as e:
        print(f"❌ Error in Twitter search endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/toggle-search", methods=["POST"])
def toggle_search():
    global ENABLE_SEARCH_FETCH
    data = request.get_json()
    ENABLE_SEARCH_FETCH = data.get("enabled", True)
    return jsonify({"enabled": ENABLE_SEARCH_FETCH})

@app.route("/api/metrics")
def metrics_data():
    try:
        latest = get_latest_data()
        p = latest.get("platform_data", {})
        x_local = latest.get("x_data", {})
        member_count = 0
        if latest.get("x_data_type") == "community":
            member_count = x_local.get("fetchOne", {}).get("member_count", 0)
        elif latest.get("x_data_type") == "single_account":
            profile = x_local.get("profile", {})
            if profile and not profile.get("error"):
                member_count = profile.get("followers_count", 0)
        elif latest.get("x_data_type") == "post":
            post = x_local.get("post", {})
            if post and not post.get("error"):
                member_count = post.get("user", {}).get("followers_count", 0)
        return jsonify({
            "marketCapUSD": p.get("marketCapUSD", 0),
            "volumeUSD": p.get("volumeUSD", 0),
            "holders": p.get("numHolders", 0),
            "liquidityUSD": p.get("initialLiquiditySol", 0) * cached_sol_price["price"] if p.get("initialLiquiditySol") else 0,
            "uniqueAuthors": latest.get("unique_authors", 0),
            "memberCount": member_count,
            "solPrice": p.get("solPriceUSD", 0),
            "lastUpdated": latest.get("timestamp", "")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_latest_data():
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, "rb") as f:
            try:
                f.seek(-2, os.SEEK_END)
                while f.read(1) != b"\n":
                    f.seek(-2, os.SEEK_CUR)
            except OSError:
                f.seek(0)
            last_line = f.readline().decode().strip()
            if last_line:
                return json.loads(last_line)
    return {}

@app.route("/api/holders")
def holders_data():
    try:
        if os.path.exists(JSON_FILE):
            with open(JSON_FILE, "rb") as f:
                try:
                    f.seek(-2, os.SEEK_END)
                    while f.read(1) != b"\n":
                        f.seek(-2, os.SEEK_CUR)
                except OSError:
                    f.seek(0)
                last_line = f.readline().decode().strip()
                latest = json.loads(last_line) if last_line else {}
        else:
            latest = {}

        history_data = []
        if os.path.exists(JSON_FILE):
            with open(JSON_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()[-100:]
                for line in lines:
                    try:
                        data = json.loads(line)
                        timestamp = datetime.fromisoformat(data["timestamp"])
                        history_data.append({
                            "timestamp": timestamp.isoformat(),
                            "time": timestamp.strftime("%H:%M"),
                            "value": data.get("platform_data", {}).get("numHolders", 0),
                            "marketCap": data.get("platform_data", {}).get("marketCapUSD", 0),
                            "uniqueAuthors": data.get("unique_authors", 0),
                            "totalViews": sum(t.get("views", 0) for t in data.get("x_data", {}).get("timeline", []) if isinstance(t.get("views"), (int, float)))
                        })
                    except Exception as e:
                        print(f"Error parsing history data: {e}")
                        continue

        current_holders = latest.get("platform_data", {}).get("numHolders", 0)
        wallet_age_data = latest.get("platform_data", {}).get("walletAgeCounts", {})

        percent_change = 0
        holder_increase = 0
        if len(history_data) >= 2:
            previous_holders = history_data[-2]["value"]
            if previous_holders > 0:
                percent_change = ((current_holders - previous_holders) / previous_holders) * 100
                holder_increase = current_holders - previous_holders

        return jsonify({
            "current": {
                "holderCount": current_holders,
                "percentChange": round(percent_change, 2),
                "holderIncrease": holder_increase,
                "lastUpdated": latest.get("timestamp", ""),
                "walletAgeDistribution": wallet_age_data,
                "totalHolders": latest.get("platform_data", {}).get("totalHolders", 0)
            },
            "history": history_data,
            "timeline": latest.get("x_data", {}).get("timeline", [])
        })
    except Exception as e:
        print(f"Error in holders endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/data")
def latest_data_route():
    try:
        if os.path.exists(JSON_FILE):
            with open(JSON_FILE, "rb") as f:
                try:
                    f.seek(-2, os.SEEK_END)
                    while f.read(1) != b"\n":
                        f.seek(-2, os.SEEK_CUR)
                except OSError:
                    f.seek(0)
                last_line = f.readline().decode().strip()
                if last_line:
                    return jsonify(json.loads(last_line))
        return jsonify({"error": "No data available", "timestamp": datetime.now().isoformat()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/history")
def history_data():
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
            last_50 = [json.loads(line) for line in lines[-50:]]
            return jsonify(last_50)
    return jsonify([])

# -------------------------
# CONFIGURATION
# -------------------------
dashboard_config = {
    "pair_address": None,
    "community_id": None,
    "screen_name": None,
    "tweet_id": None,
    "x_data_type": None,
    "data_source": "axiom",
    "x_headers": None
}

CONFIG_FILE = "dashboard_config.json"

def load_saved_config():
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                saved_config = json.load(f)
                dashboard_config.update(saved_config)
                return True
    except Exception as e:
        print(f"Error loading config: {e}")
    return False

def save_config(config):
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f)
        return True
    except Exception as e:
        print(f"Error saving config: {e}")
        return False

def extract_community_id_from_url(twitter_url):
    try:
        if not twitter_url:
            return None
        print(f"🔗 Processing Twitter URL: {twitter_url}")
        if "communities/" in twitter_url:
            parts = twitter_url.split("communities/")
            if len(parts) > 1:
                cid = parts[1].split('/')[0].split('?')[0].strip()
                if cid.isdigit():
                    print(f"✅ Extracted community ID: {cid}")
                    return cid
                else:
                    print(f"❌ Invalid community ID format: {cid}")
        print(f"❌ Could not extract community ID from URL: {twitter_url}")
        return None
    except Exception as e:
        print(f"❌ Error extracting community ID from URL: {e}")
        return None

def extract_screen_name_from_url(twitter_url):
    try:
        if not twitter_url:
            return None
        print(f"🔗 Processing Twitter URL for screen name: {twitter_url}")
        if "x.com/" in twitter_url:
            parts = twitter_url.split("x.com/")
        elif "twitter.com/" in twitter_url:
            parts = twitter_url.split("twitter.com/")
        else:
            return None
        if len(parts) > 1:
            sn = parts[1].split('/')[0].split('?')[0].strip()
            if sn and not sn.startswith('i/') and not sn.startswith('search'):
                print(f"✅ Extracted screen name: {sn}")
                return sn
        print(f"❌ Could not extract screen name from URL: {twitter_url}")
        return None
    except Exception as e:
        print(f"❌ Error extracting screen name from URL: {e}")
        return None

def extract_tweet_id_from_url(twitter_url):
    try:
        if not twitter_url:
            return None
        print(f"🔗 Processing Twitter URL for tweet ID: {twitter_url}")
        if "/status/" in twitter_url:
            parts = twitter_url.split("/status/")
            if len(parts) > 1:
                tid = parts[1].split('/')[0].split('?')[0].strip()
                if tid and tid.isdigit():
                    print(f"✅ Extracted tweet ID: {tid}")
                    return tid
        print(f"❌ Could not extract tweet ID from URL: {twitter_url}")
        return None
    except Exception as e:
        print(f"❌ Error extracting tweet ID from URL: {e}")
        return None

def update_x_urls_with_community_id(cid):
    global x_urls
    if not cid:
        print("❌ No community ID provided for X URLs")
        return
    x_urls = {
        "timeline": (
            "https://x.com/i/api/graphql/Nyt-88UX4-pPCImZNUl9RQ/CommunityTweetsTimeline"
            f"?variables=%7B%22communityId%22%3A%22{cid}%22%2C%22count%22%3A20%2C%22displayLocation%22%3A%22Community%22%2C%22rankingMode%22%3A%22Relevance%22%2C%22withCommunity%22%3Atrue%7D"
            "&features=%7B%22rweb_video_screen_enabled%22%3Afalse%2C%22payments_enabled%22%3Afalse%2C%22rweb_xchat_enabled%22%3Afalse%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Atrue%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22premium_content_api_read_enabled%22%3Afalse%2C%22communities_web_enable_tweet_community_results_fetch%22%3Atrue%2C%22c9s_tweet_anatomy_moderator_badge_enabled%22%3Atrue%2C%22responsive_web_grok_analyze_button_fetch_trends_enabled%22%3Afalse%2C%22responsive_web_grok_analyze_post_followups_enabled%22%3Atrue%2C%22responsive_web_jetfuel_frame%22%3Atrue%2C%22responsive_web_grok_share_attachment_enabled%22%3Atrue%2C%22articles_preview_enabled%22%3Atrue%2C%22responsive_web_edit_tweet_api_enabled%22%3Atrue%2C%22graphql_is_translatable_rweb_tweet_is_translatable_enabled%22%3Atrue%2C%22view_counts_everywhere_api_enabled%22%3Atrue%2C%22longform_notetweets_consumption_enabled%22%3Atrue%2C%22responsive_web_twitter_article_tweet_consumption_enabled%22%3Atrue%2C%22tweet_awards_web_tipping_enabled%22%3Afalse%2C%22responsive_web_grok_show_grok_translated_post%22%3Atrue%2C%22responsive_web_grok_analysis_button_from_backend%22%3Atrue%2C%22creator_subscriptions_quote_tweet_preview_enabled%22%3Afalse%2C%22freedom_of_speech_not_reach_fetch_enabled%22%3Atrue%2C%22standardized_nudges_misinfo%22%3Atrue%2C%22tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled%22%3Atrue%2C%22longform_notetweets_rich_text_read_enabled%22%3Atrue%2C%22longform_notetweets_inline_media_enabled%22%3Atrue%2C%22responsive_web_grok_image_annotation_enabled%22%3Atrue%2C%22responsive_web_grok_imagine_annotation_enabled%22%3Atrue%2C%22responsive_web_grok_community_note_auto_translation_is_enabled%22%3Afalse%2C%22responsive_web_enhance_cards_enabled%22%3Afalse%7D"
        ),
        "fetchOne": (
            "https://x.com/i/api/graphql/pbuqwPzh0Ynrw8RQY3esYA/CommunitiesFetchOneQuery"
            f"?variables=%7B%22communityId%22%3A%22{cid}%22%2C%22withDmMuting%22%3Afalse%2C%22withGrokTranslatedBio%22%3Afalse%7D"
            "&features=%7B%22payments_enabled%22%3Afalse%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Atrue%7D"
        ),
    }
    print(f"🔗 Updated X URLs with community ID: {cid}")
    print(f"📡 Timeline URL: {x_urls['timeline'][:100]}...")
    print(f"📡 FetchOne URL: {x_urls['fetchOne'][:100]}...")

@app.route("/api/config", methods=["POST"])
def update_config():
    try:
        config = request.get_json()
        print("📩 Incoming config:", config, flush=True)

        # Allow frontend to send { "search_query": "..." } as sole input
        if config.get("search_query") and not config.get("pairAddress"):
            config["pairAddress"] = config["search_query"]

        if not config.get("pairAddress"):
            return jsonify({"error": "Missing required field: pairAddress"}), 400

        pair_address = config["pairAddress"]
        user_community_id = config.get("communityId")
        user_screen_name = config.get("screenName")
        user_tweet_id = config.get("tweetId")
        data_source = config.get("dataSource", "axiom")  # Default to axiom

        # Update globals
        global PAIR_ADDRESS, community_id, screen_name, tweet_id, x_data_type, DATA_SOURCE, SEARCH_QUERY
        PAIR_ADDRESS = pair_address
        SEARCH_QUERY = pair_address  # use the contract as default search query
        DATA_SOURCE = data_source

        # Update file target now that pair is known
        _set_json_file_from_pair()

        # Determine X data type (auto if needed) by reading platform data twitter URL
        twitter_url = None
        x_data_type = None

        if not user_community_id and not user_screen_name and not user_tweet_id:
            print("🔍 No X identifier provided, fetching platform data to extract from Twitter URL...")
            platform_data = fetch_platform_data()
            twitter_url = platform_data.get("twitter")
            if twitter_url:
                if "communities/" in twitter_url:
                    extracted_community_id = extract_community_id_from_url(twitter_url)
                    if extracted_community_id:
                        user_community_id = extracted_community_id
                        x_data_type = "community"
                        print(f"✅ Auto-detected community: {user_community_id}")
                elif "/status/" in twitter_url:
                    extracted_tweet_id = extract_tweet_id_from_url(twitter_url)
                    if extracted_tweet_id:
                        user_tweet_id = extracted_tweet_id
                        x_data_type = "post"
                        print(f"✅ Auto-detected post: {user_tweet_id}")
                else:
                    extracted_screen_name = extract_screen_name_from_url(twitter_url)
                    if extracted_screen_name:
                        user_screen_name = extracted_screen_name
                        x_data_type = "single_account"
                        print(f"✅ Auto-detected single account: {user_screen_name}")

        # Use provided identifiers if available
        if user_community_id:
            x_data_type = "community"
            community_id = user_community_id
            update_x_urls_with_community_id(community_id)
        elif user_screen_name:
            x_data_type = "single_account"
            screen_name = user_screen_name
        elif user_tweet_id:
            x_data_type = "post"
            tweet_id = user_tweet_id

        if not x_data_type:
            return jsonify({
                "error": "Could not determine X data type",
                "twitterUrl": twitter_url,
                "suggestion": "Please provide communityId, screenName, or tweetId manually"
            }), 400

        # Update dashboard config
        dashboard_config["pair_address"] = PAIR_ADDRESS
        dashboard_config["community_id"] = community_id
        dashboard_config["screen_name"] = screen_name
        dashboard_config["tweet_id"] = tweet_id
        dashboard_config["x_data_type"] = x_data_type
        dashboard_config["data_source"] = DATA_SOURCE

        print(f"✅ Configuration updated successfully!")
        print(f"   Pair Address: {PAIR_ADDRESS}")
        print(f"   Data Source: {DATA_SOURCE}")
        print(f"   X Data Type: {x_data_type}")
        if x_data_type == "community":
            print(f"   Community ID: {community_id}")
        elif x_data_type == "single_account":
            print(f"   Screen Name: {screen_name}")
        elif x_data_type == "post":
            print(f"   Tweet ID: {tweet_id}")
        print(f"   Twitter URL: {twitter_url}")

        # Start background fetching if not already running
        if not server_status["is_running"]:
            try:
                cached_sol_price["price"] = get_sol_usd_price()
                cached_sol_price["last_updated"] = time.time()

                threading.Thread(target=update_sol_price, daemon=True).start()
                threading.Thread(target=background_fetcher, daemon=True).start()

                server_status["is_running"] = True
                server_status["is_configured"] = True
                server_status["start_time"] = datetime.now().isoformat()
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "message": f"Failed to start fetching: {str(e)}"
                }), 500

        return jsonify({
            "status": "success",
            "message": "Configuration updated and fetching started",
            "config": {
                "pairAddress": PAIR_ADDRESS,
                "dataSource": DATA_SOURCE,
                "xDataType": x_data_type,
                "communityId": community_id,
                "screenName": screen_name,
                "tweetId": tweet_id,
                "twitterUrl": twitter_url,
                "autoDiscovered": config.get("communityId") is None and config.get("screenName") is None and config.get("tweetId") is None
            }
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/config", methods=["GET"])
def get_config():
    return jsonify({
        "pairAddress": dashboard_config["pair_address"],
        "communityId": dashboard_config["community_id"],
        "screenName": dashboard_config["screen_name"],
        "tweetId": dashboard_config["tweet_id"],
        "xDataType": dashboard_config["x_data_type"],
        "dataSource": dashboard_config["data_source"]
    })

@app.route("/api/download")
def download_data():
    if os.path.exists(JSON_FILE):
        return send_file(
            JSON_FILE,
            mimetype='application/json',
            as_attachment=True,
            download_name='trading_data.json'
        )
    return jsonify({"error": "No data available"}), 404

def cleanup_old_files():
    daily_files = sorted(DATA_DIR.glob("data_*.json"))
    if len(daily_files) > 7:
        for old_file in daily_files[:-7]:
            old_file.unlink()

server_status = {
    "is_running": False,        # important: start stopped
    "start_time": datetime.now().isoformat(),
    "is_configured": False
}

@app.route("/api/status")
def status():
    return jsonify({
        "status": "active" if server_status["is_running"] else "idle",
        "started_at": server_status["start_time"],
        "uptime_seconds": (datetime.now() - datetime.fromisoformat(server_status["start_time"])).total_seconds(),
        "socket_connected": server_status["is_running"],
        "data_source": DATA_SOURCE
    })

# -------------------------
# MAIN
# -------------------------
if __name__ == "__main__":
    print("🚀 Starting Flask server with Socket.IO...")
    print("⏳ Waiting for /api/config before starting background fetchers...")
    _set_json_file_from_pair()  # ensure pending.json until configured
    print("✅ Server starting on http://0.0.0.0:5050")
    print("🔌 Socket.IO is enabled and waiting for connections...")
    print(f"🔧 Current data source (default): {DATA_SOURCE}")

    socketio.run(
        app,
        host="0.0.0.0",
        port=5050,
        debug=True,
        use_reloader=False,
        allow_unsafe_werkzeug=True
    )
