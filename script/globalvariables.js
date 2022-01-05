let imageMap = new MapExtended(); // Cache for images

let selectedImgModal = objectMixIn(new Set()); // List of selected Images to pass to main screen

let iconsArray = ['collections', 'architecture', 'boy', 'cake', 'catching_pokemon', 'clean_hands', 'co2', 'compost',
	'connect_without_contact', 'construction', 'cookie', 'coronavirus', 'cruelty_free', 'deck', 'downhill_skiing',
	'edit_notifications', 'elderly', 'elderly_woman', 'emoji_emotions', 'emoji_events', 'emoji_flags',
	'emoji_food_beverage', 'emoji_nature', 'emoji_objects', 'emoji_people', 'emoji_symbols', 'emoji_transportation',
	'engineering', 'facebook', 'female', 'fireplace', 'fitbit', 'follow_the_signs', 'front_hand', 'girl',
	'health_and_safety', 'heart_broken', 'hiking', 'history_edu', 'hive', 'ice_skating', 'interests', 'ios_share',
	'kayaking', 'king_bed', 'kitesurfing', 'location_city', 'luggage', 'male', 'man', 'masks', 'military_tech', 'mood',
	'mood_bad', 'nights_stay', 'no_luggage', 'nordic_walking', 'outdoor_grill', 'pages', 'paragliding', 'party_mode',
	'people', 'piano', 'pix', 'poll', 'precision_manufacturing', 'psychology', 'real_estate_agent', 'recommend',
	'recycling', 'reduce_capacity', 'remove_moderator', 'safety_divider', 'sanitizer', 'scale', 'school', 'science',
	'self_improvement', 'share', 'sick', 'single_bed', 'skateboarding', 'sledding', 'snowboarding', 'snowshoeing',
	'social_distance', 'south_america', 'sports', 'sports_baseball', 'sports_basketball', 'sports_cricket',
	'sports_esports', 'sports_football', 'sports_golf', 'sports_handball', 'sports_hockey', 'sports_kabaddi',
	'sports_martial_arts', 'sports_mma', 'sports_motorsports', 'sports_rugby', 'sports_soccer', 'sports_tennis',
	'sports_volleyball', 'surfing', 'switch_account', 'thumb_down_alt', 'thumb_up_alt', 'travel_explore', 'vaccines',
	'water_drop', 'waving_hand', 'whatsapp', 'whatshot', 'woman', 'workspace_premium'];
