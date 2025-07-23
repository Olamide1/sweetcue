-- Seed gesture templates for the SweetCue app
-- These are pre-defined gestures that users can select from when creating reminders

-- Words of Affirmation gestures
INSERT INTO public.gestures (title, description, effort_level, cost_level, category, is_template, user_id) VALUES
('Write a love letter', 'Handwrite a heartfelt letter expressing your feelings', 'low', 'free', 'words_of_affirmation', true, NULL),
('Leave encouraging notes', 'Hide sweet notes around the house for them to find', 'low', 'free', 'words_of_affirmation', true, NULL),
('Compliment their strengths', 'Tell them specific things you admire about them', 'low', 'free', 'words_of_affirmation', true, NULL),
('Send a morning text', 'Send a sweet good morning message', 'low', 'free', 'words_of_affirmation', true, NULL),
('Express gratitude', 'Thank them for something they did recently', 'low', 'free', 'words_of_affirmation', true, NULL);

-- Quality Time gestures
INSERT INTO public.gestures (title, description, effort_level, cost_level, category, is_template, user_id) VALUES
('Plan a date night', 'Organize a special evening just for the two of you', 'medium', 'low', 'quality_time', true, NULL),
('Take a walk together', 'Go for a leisurely stroll and talk', 'low', 'free', 'quality_time', true, NULL),
('Cook dinner together', 'Prepare a meal as a team', 'medium', 'low', 'quality_time', true, NULL),
('Watch their favorite movie', 'Pick something they love and watch it together', 'low', 'free', 'quality_time', true, NULL),
('Play a board game', 'Have fun with a game you both enjoy', 'low', 'free', 'quality_time', true, NULL),
('Go on a weekend trip', 'Plan a short getaway together', 'high', 'high', 'quality_time', true, NULL);

-- Physical Touch gestures
INSERT INTO public.gestures (title, description, effort_level, cost_level, category, is_template, user_id) VALUES
('Give a massage', 'Offer a relaxing back or foot massage', 'medium', 'free', 'physical_touch', true, NULL),
('Hold hands', 'Simply hold their hand while walking or sitting', 'low', 'free', 'physical_touch', true, NULL),
('Give a hug', 'Offer a warm, meaningful embrace', 'low', 'free', 'physical_touch', true, NULL),
('Cuddle on the couch', 'Spend time snuggling while watching TV', 'low', 'free', 'physical_touch', true, NULL),
('Kiss them unexpectedly', 'Give them a sweet surprise kiss', 'low', 'free', 'physical_touch', true, NULL);

-- Acts of Service gestures
INSERT INTO public.gestures (title, description, effort_level, cost_level, category, is_template, user_id) VALUES
('Cook their favorite meal', 'Prepare a special dinner at home', 'medium', 'low', 'acts_of_service', true, NULL),
('Do their chores', 'Take care of a task they usually handle', 'medium', 'free', 'acts_of_service', true, NULL),
('Make them breakfast in bed', 'Surprise them with a morning meal', 'medium', 'low', 'acts_of_service', true, NULL),
('Run an errand for them', 'Handle something they need done', 'low', 'free', 'acts_of_service', true, NULL),
('Fix something broken', 'Repair something they use regularly', 'high', 'low', 'acts_of_service', true, NULL),
('Clean their car', 'Wash and detail their vehicle', 'high', 'low', 'acts_of_service', true, NULL);

-- Receiving Gifts gestures
INSERT INTO public.gestures (title, description, effort_level, cost_level, category, is_template, user_id) VALUES
('Buy their favorite flowers', 'Pick up a bouquet they love', 'low', 'low', 'receiving_gifts', true, NULL),
('Order their favorite coffee', 'Surprise deliver to their workplace', 'low', 'low', 'receiving_gifts', true, NULL),
('Get them a book they want', 'Purchase something from their wishlist', 'low', 'medium', 'receiving_gifts', true, NULL),
('Make a handmade gift', 'Create something personal and meaningful', 'high', 'free', 'receiving_gifts', true, NULL),
('Buy them a small treat', 'Pick up their favorite snack or dessert', 'low', 'low', 'receiving_gifts', true, NULL),
('Plan a surprise gift', 'Organize a special present for them', 'high', 'high', 'receiving_gifts', true, NULL);

-- General romantic gestures (no specific love language)
INSERT INTO public.gestures (title, description, effort_level, cost_level, category, is_template, user_id) VALUES
('Plan a surprise date', 'Organize a complete surprise outing', 'high', 'medium', 'romance', true, NULL),
('Create a photo album', 'Make a collection of your memories together', 'high', 'low', 'romance', true, NULL),
('Write a poem', 'Compose something romantic for them', 'medium', 'free', 'romance', true, NULL),
('Dance together', 'Put on music and slow dance', 'low', 'free', 'romance', true, NULL),
('Stargaze together', 'Find a quiet spot to look at the stars', 'low', 'free', 'romance', true, NULL),
('Make a playlist', 'Create a collection of songs that remind you of them', 'medium', 'free', 'romance', true, NULL); 