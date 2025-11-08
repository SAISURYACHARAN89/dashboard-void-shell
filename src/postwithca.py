import requests
import json
import time
from urllib.parse import quote
import sys
import os

class TwitterSearchAPI:
    def __init__(self, auth_token, ct0, twid):
        self.session = requests.Session()
        self.base_url = "https://x.com/i/api/graphql/4gROUrdRVzZmO2n_S-DKlA/SearchTimeline"
        
        # Set headers from the request
        self.headers = {
            'authority': 'x.com',
            'accept': '*/*',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
            'content-type': 'application/json',
            'origin': 'https://x.com',
            'referer': 'https://x.com/search?q=91h4FaxeMsTqRNnRBD5zdMDESXTapFcp3Sgug8TBpump',
            'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            'x-client-transaction-id': 'dBxl3pCzAJ9Ju/F1T1RSG5bt0CFnTEN9IF0eGOFOH3OJWd5rmt7u0F5QnLefjYh/niQ1wnDmeDvhgoxB36frq7/E+2badw',
            'x-csrf-token': ct0,
            'x-twitter-active-user': 'yes',
            'x-twitter-auth-type': 'OAuth2Session',
            'x-twitter-client-language': 'en',
        }
        
        # Set cookies
        self.cookies = {
            'auth_token': auth_token,
            'ct0': ct0,
            'twid': twid,
            'd_prefs': 'MjoxLGNvbnNlbnRfdmVyc2lvbjoyLHRleHRfdmVyc2lvbjoxMDAw',
            '__cuid': 'd9f285191ba7417b8b0668b4deb3ea1c',
            'guest_id': 'v1%3A175864037128521710',
            'personalization_id': '"v1_lZ2VF3rbJuzSps45G0TMuA=="',
            'lang': 'en',
            'dnt': '1'
        }
        
        # Update session cookies
        for key, value in self.cookies.items():
            self.session.cookies.set(key, value)

    def build_search_params(self, raw_query, count=20, product="Top"):
        """Build the parameters for the search request"""
        
        # Variables parameter
        variables = {
            "rawQuery": raw_query,
            "count": count,
            "querySource": "",
            "product": product,
            "withGrokTranslatedBio": False
        }
        
        # Features parameter (from the original request)
        features = {
            "rweb_video_screen_enabled": False,
            "payments_enabled": False,
            "profile_label_improvements_pcf_label_in_post_enabled": True,
            "responsive_web_profile_redirect_enabled": False,
            "rweb_tipjar_consumption_enabled": True,
            "verified_phone_label_enabled": True,
            "creator_subscriptions_tweet_preview_api_enabled": True,
            "responsive_web_graphql_timeline_navigation_enabled": True,
            "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
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
            "responsive_web_grok_image_annotation_enabled": True,
            "responsive_web_grok_imagine_annotation_enabled": True,
            "responsive_web_grok_community_note_auto_translation_is_enabled": False,
            "responsive_web_enhance_cards_enabled": False
        }
        
        params = {
            'variables': json.dumps(variables),
            'features': json.dumps(features)
        }
        
        return params

    def search_timeline(self, query, count=20, product="Top"):
        """Execute the search request"""
        
        params = self.build_search_params(query, count, product)
        
        try:
            response = self.session.get(
                self.base_url,
                params=params,
                headers=self.headers,
                timeout=30
            )
            
            # Check rate limiting
            if 'x-rate-limit-remaining' in response.headers:
                remaining = int(response.headers['x-rate-limit-remaining'])
                reset_time = int(response.headers['x-rate-limit-reset'])
                print(f"Rate limit: {remaining} requests remaining")
                
                if remaining == 0:
                    wait_time = reset_time - int(time.time())
                    print(f"Rate limit exceeded. Waiting {wait_time} seconds")
                    time.sleep(max(wait_time, 1))
                    return self.search_timeline(query, count, product)
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None

    def save_response(self, data, filename="twitter_search_response.json"):
        """Save the response to a JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Response saved to {filename}")

def parse_twitter_metrics(data):
    """Parse and extract only the required metrics from Twitter search data"""
    authors = {}
    total_posts = 0
    total_media_posts = 0
    total_normal_posts = 0

    try:
        instructions = (
            data.get("data", {})
            .get("search_by_raw_query", {})
            .get("search_timeline", {})
            .get("timeline", {})
            .get("instructions", [])
        )

        for instruction in instructions:
            entries = instruction.get("entries", [])
            for entry in entries:
                tweet_data = (
                    entry.get("content", {})
                    .get("itemContent", {})
                    .get("tweet_results", {})
                    .get("result", {})
                )
                if not tweet_data or tweet_data.get("__typename") != "Tweet":
                    continue

                total_posts += 1
                
                # Check media
                has_media = bool(
                    tweet_data.get("legacy", {})
                    .get("extended_entities", {})
                    .get("media")
                )
                if has_media:
                    total_media_posts += 1
                else:
                    total_normal_posts += 1

                # Get author info
                user_data = (
                    tweet_data.get("core", {})
                    .get("user_results", {})
                    .get("result", {})
                )
                username = user_data.get("core", {}).get("screen_name")
                
                if username and username not in authors:
                    authors[username] = {
                        "name": user_data.get("core", {}).get("name"),
                        "followers_count": user_data.get("legacy", {}).get("followers_count", 0)
                    }

        return {
            "unique_authors_count": len(authors),
            "total_posts_count": total_posts,
            "total_media_posts_count": total_media_posts,
            "total_normal_posts_count": total_normal_posts,
            "unique_authors": authors,
            "success": True
        }

    except Exception as e:
        print(f" Error parsing metrics: {e}")
        return {
            "unique_authors_count": 0,
            "total_posts_count": 0,
            "total_media_posts_count": 0,
            "total_normal_posts_count": 0,
            "unique_authors": {},
            "success": False
        }

def continuous_fetch(query, interval=20):
    """Continuously fetch and display metrics at specified interval"""
    # Configure console encoding for Windows
    if sys.platform == 'win32':
        try:
            # Try to use UTF-8 encoding
            sys.stdout.reconfigure(encoding='utf-8')
        except AttributeError:
            # Fallback for older Python versions
            import codecs
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)
    
    auth_token = "84c79d35cb2a902f89168422691d42a685e810cb"
    ct0 = "61f38a6545d11663e819f9f141229a157b4da9742e66762cb54e799b149de7d6ea6d327683a4ab7d5a59ee4f8841dd5395e95aaeefdca7847794a5df46ecb2a24c88a47849d6ef6e4f41e2c110e06232"
    twid = "u%3D1919992237397835776"
    
    api = TwitterSearchAPI(auth_token, ct0, twid)
    
    print("Starting continuous fetch for query:", query)
    print("Refresh interval:", interval, "seconds")
    print("=" * 50)
    
    while True:
        try:
            result = api.search_timeline(query)
            if result:
                metrics = parse_twitter_metrics(result)
                
                # Clear screen safely
                if sys.platform == 'win32':
                    os.system('cls')
                else:
                    os.system('clear')
                
                # Use only ASCII characters in output
                print("Metrics Update @", time.strftime('%H:%M:%S'))
                print("=" * 50)
                print("Total Posts........:", metrics['total_posts_count'])
                print("Media Posts........:", metrics['total_media_posts_count'])
                print("Normal Posts.......:", metrics['total_normal_posts_count'])
                print("Unique Authors.....:", metrics['unique_authors_count'])
                print("=" * 50)
                
                if metrics['unique_authors']:
                    print("\nAll Authors (sorted by followers):")
                    print("-" * 70)
                    print(f"{'Username':<20} {'Name':<25} {'Followers':>10}")
                    print("-" * 70)
                    
                    # Sort and display authors
                    sorted_authors = sorted(
                        metrics['unique_authors'].items(),
                        key=lambda x: x[1]['followers_count'],
                        reverse=True
                    )
                    
                    for username, data in sorted_authors:
                        try:
                            name = (data['name'] if data['name'] else 'N/A')[:24]
                            # Clean name of any problematic characters
                            name = ''.join(c for c in name if c.isprintable())
                            followers = f"{data['followers_count']:,}"
                            print(f"@{username:<19} {name:<25} {followers:>10}")
                        except UnicodeEncodeError:
                            # Fallback for problematic usernames/names
                            print(f"{'<encoding error>':<19} {'N/A':<25} {followers:>10}")
                    
                    # Statistics
                    total_followers = sum(data['followers_count'] for data in metrics['unique_authors'].values())
                    avg_followers = total_followers / len(metrics['unique_authors']) if metrics['unique_authors'] else 0
                    
                    print("-" * 70)
                    print("Total Authors....:", len(metrics['unique_authors']))
                    print("Total Followers..:", f"{total_followers:,}")
                    print("Average Followers:", f"{avg_followers:,.0f}")
                    print("-" * 70)
                
        except Exception as e:
            print("ERROR:", str(e))
        
        time.sleep(interval)

def main():
    search_query = "91h4FaxeMsTqRNnRBD5zdMDESXTapFcp3Sgug8TBpump"
    continuous_fetch(search_query)

if __name__ == "__main__":
    main()

# Make the API instance available for import
DEFAULT_AUTH_TOKEN = "84c79d35cb2a902f89168422691d42a685e810cb"
DEFAULT_CT0 = "61f38a6545d11663e819f9f141229a157b4da9742e66762cb54e799b149de7d6ea6d327683a4ab7d5a59ee4f8841dd5395e95aaeefdca7847794a5df46ecb2a24c88a47849d6ef6e4f41e2c110e06232"
DEFAULT_TWID = "u%3D1919992237397835776"

twitter_search_api = TwitterSearchAPI(
    auth_token=DEFAULT_AUTH_TOKEN,
    ct0=DEFAULT_CT0,
    twid=DEFAULT_TWID
)