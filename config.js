/* SentiQ configuration.
   youtubeApiKey: a YouTube Data API v3 key. This key ships to every visitor's browser,
   so restrict it in Google Cloud Console → Credentials:
     • Application restrictions: HTTP referrers → your site's domain (and http://localhost:5178/* for local testing)
     • API restrictions: YouTube Data API v3 only */
window.SENTIQ_CONFIG = {
  youtubeApiKey: "AIzaSyBEh7KHnjgh_ngh7dYZeZUBu7BAgwELxyY",
};
