import requests
import json
import time
from urllib.parse import quote

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

def main():
    # Replace these with your actual credentials from the browser
    AUTH_TOKEN = "84c79d35cb2a902f89168422691d42a685e810cb"
    CT0_TOKEN = "61f38a6545d11663e819f9f141229a157b4da9742e66762cb54e799b149de7d6ea6d327683a4ab7d5a59ee4f8841dd5395e95aaeefdca7847794a5df46ecb2a24c88a47849d6ef6e4f41e2c110e06232"
    TWID = "u%3D1919992237397835776"
    
    # Initialize the API client
    twitter_api = TwitterSearchAPI(AUTH_TOKEN, CT0_TOKEN, TWID)
    
    # Search query (the same as in your request)
    search_query = "91h4FaxeMsTqRNnRBD5zdMDESXTapFcp3Sgug8TBpump"
    
    print(f"Searching for: {search_query}")
    
    # Execute the search
    result = twitter_api.search_timeline(search_query)
    
    if result:
        print("Search completed successfully!")
        print(f"Response keys: {list(result.keys())}")
        
        
        # Save the full response
        twitter_api.save_response(result)
        
        # You can process the result here
        if 'data' in result:
            print("Data found in response")
            # Add your data processing logic here
            
    else:
        print("Search failed!")

if __name__ == "__main__":
    main()