# save as axiom_search.py
import requests
import json
import re

BASE_URL = "https://api2.axiom.trade/search-v3"

# Put the cookies you showed here. KEEP THESE SECRET in production.
COOKIES = {
    # Replace the values below with your actual cookie strings.
    "auth-refresh-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6ImE1OTczNTczLTZkNzYtNGFhNy1hN2FjLWM1NTlhMzYyMjkxZSIsImlhdCI6MTc1NzA5MDM2N30.eyAxIxtMo71JhCjX9hQ-nuld1wX9TYJx_gc7lOHoOf0",
    "auth-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiMWJiMzA2NzYtMzViZS00ZDQ4LWFlY2QtODZmM2NiMDI3NmY2IiwiaWF0IjoxNzYyMDgzMjk4LCJleHAiOjE3NjIwODQyNTh9.5jTjKpMrOuqrHchJ1IOv1BCw7HoRss3JHFrMi8EXYIA",
}

# Use the same headers you captured in the browser request.
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://axiom.trade",
    "Referer": "https://axiom.trade/",
    "Sec-CH-UA": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": '"Windows"',
    # 'User-Agent' often helpful to mimic the browser
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    # These CORS preflight style headers are normally browser-managed,
    # but we include them to be closer to the original request.
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "Connection": "keep-alive",
    # If the site expects a specific priority header:
    "Priority": "u=1,i",
}
def classify_twitter_url(url: str):
    """Identify X link type and extract the key (id or username)."""
    if not url or "x.com" not in url:
        return None, None

    # Community
    match = re.search(r"x\.com/i/communities/(\d+)", url)
    if match:
        return "community", match.group(1)

    # Post
    match = re.search(r"x\.com/[^/]+/status/(\d+)", url)
    if match:
        return "post", match.group(1)

    # Single account
    match = re.search(r"x\.com/([A-Za-z0-9_]+)", url)
    if match:
        return "single_account", match.group(1)

    return None, None
def axiom_search(search_query: str):
    """Query Axiom API and process token data."""
    params = {
        "searchQuery": search_query,
        "isOg": "false",
        "isPumpSearch": "false",
        "isBonkSearch": "false",
        "isBagsSearch": "false",
        "isUsd1Search": "false",
        "onlyBonded": "false",
    }

    resp = requests.get(BASE_URL, params=params, headers=HEADERS, cookies=COOKIES)
    resp.raise_for_status()
    data = resp.json()

    results = []

    for token in data:
        pair_address = token.get("pairAddress")
        twitter_url = token.get("twitter")

        x_type, key = classify_twitter_url(twitter_url)

        results.append({
            "pairAddress": pair_address,
            "x_type": x_type,
            "key": key,
            "twitter_url": twitter_url
        })

    print(json.dumps(results, indent=2))
    return results


if __name__ == "__main__":
    # Example usage: change 'klm' to any search term or a contract address
    query = "EEweXXwiUvNe1JEKsBbCxH6LqjL1RZtnKHAUh3Xcpump"  # <-- replace with contract address or other query
    axiom_search(query)
