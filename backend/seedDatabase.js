// backend/seedDatabase.js
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { getLastFmData } = require('./src/services/lastfmService');
const { getOpenAIEmbedding } = require('./src/services/openaiService');
const { seedSongsCollection} = require('../backend/src/services/dbService');
const { connectDB, closeDbConnection } = require('./src/db/connection');

const SEED_SONGS = [
  { artist: 'Queen', title: 'Bohemian Rhapsody', album: 'A Night at the Opera' },
  { artist: 'John Lennon', title: 'Imagine', album: 'Imagine' },
  { artist: 'Eagles', title: 'Hotel California', album: 'Hotel California' },
  { artist: 'Led Zeppelin', title: 'Stairway to Heaven', album: 'Led Zeppelin IV' },
  { artist: 'Nirvana', title: 'Smells Like Teen Spirit', album: 'Nevermind' },
  { artist: 'Michael Jackson', title: 'Billie Jean', album: 'Thriller' },
  { artist: 'The Beatles', title: 'Hey Jude', album: 'Single' },
  { artist: 'Bob Dylan', title: 'Like a Rolling Stone', album: 'Highway 61 Revisited' },
  { artist: 'Guns N’ Roses', title: 'Sweet Child O’ Mine', album: 'Appetite for Destruction' },
  { artist: 'Oasis', title: 'Wonderwall', album: '(What’s the Story) Morning Glory?' },
  { artist: 'The Beatles', title: 'Let It Be', album: 'Let It Be' },
  { artist: 'Pink Floyd', title: 'Comfortably Numb', album: 'The Wall' },
  { artist: 'R.E.M.', title: 'Losing My Religion', album: 'Out of Time' },
  { artist: 'Metallica', title: 'Enter Sandman', album: 'Metallica' },
  { artist: 'Prince', title: 'Purple Rain', album: 'Purple Rain' },
  { artist: 'Pink Floyd', title: 'Another Brick in the Wall', album: 'The Wall' },
  { artist: 'Bon Jovi', title: 'Livin’ on a Prayer', album: 'Slippery When Wet' },
  { artist: 'Metallica', title: 'Nothing Else Matters', album: 'Metallica' },
  { artist: 'Guns N’ Roses', title: 'November Rain', album: 'Use Your Illusion I' },
  { artist: 'Pink Floyd', title: 'Wish You Were Here', album: 'Wish You Were Here' },
  { artist: 'Bob Dylan', title: 'Knocking on Heaven’s Door', album: 'Pat Garrett & Billy the Kid' },
  { artist: 'AC/DC', title: 'Highway to Hell', album: 'Highway to Hell' },
  { artist: 'AC/DC', title: 'Back in Black', album: 'Back in Black' },
  { artist: 'The Police', title: 'Every Breath You Take', album: 'Synchronicity' },
  { artist: 'Whitney Houston', title: 'I Will Always Love You', album: 'The Bodyguard' },
  { artist: 'Celine Dion', title: 'My Heart Will Go On', album: 'Let’s Talk About Love' },
  { artist: 'Ed Sheeran', title: 'Shape of You', album: '÷' },
  { artist: 'Adele', title: 'Rolling in the Deep', album: '21' },
  { artist: 'Adele', title: 'Someone Like You', album: '21' },
  { artist: 'Adele', title: 'Set Fire to the Rain', album: '21' },
  { artist: 'Ed Sheeran', title: 'Thinking Out Loud', album: 'x' },
  { artist: 'Mark Ronson ft. Bruno Mars', title: 'Uptown Funk', album: 'Uptown Special' },
  { artist: 'The Weeknd', title: 'Blinding Lights', album: 'After Hours' },
  { artist: 'The Weeknd', title: 'Save Your Tears', album: 'After Hours' },
  { artist: 'The Weeknd', title: 'Can’t Feel My Face', album: 'Beauty Behind the Madness' },
  { artist: 'The Weeknd', title: 'Starboy', album: 'Starboy' },
  { artist: 'Lady Gaga & Bradley Cooper', title: 'Shallow', album: 'A Star Is Born' },
  { artist: 'Lady Gaga', title: 'Poker Face', album: 'The Fame' },
  { artist: 'Lady Gaga', title: 'Bad Romance', album: 'The Fame Monster' },
  { artist: 'Lady Gaga', title: 'Just Dance', album: 'The Fame' },
  { artist: 'Beyoncé', title: 'Halo', album: 'I Am... Sasha Fierce' },
  { artist: 'Beyoncé', title: 'Crazy in Love', album: 'Dangerously in Love' },
  { artist: 'Beyoncé', title: 'Single Ladies', album: 'I Am... Sasha Fierce' },
  { artist: 'Beyoncé', title: 'Formation', album: 'Lemonade' },
  { artist: 'Rihanna ft. Jay-Z', title: 'Umbrella', album: 'Good Girl Gone Bad' },
  { artist: 'Rihanna', title: 'Diamonds', album: 'Unapologetic' },
  { artist: 'Rihanna ft. Mikky Ekko', title: 'Stay', album: 'Unapologetic' },
  { artist: 'Rihanna ft. Calvin Harris', title: 'We Found Love', album: 'Talk That Talk' },
  { artist: 'Journey', title: 'Don’t Stop Believin’', album: 'Escape' },
  { artist: 'Survivor', title: 'Eye of the Tiger', album: 'Eye of the Tiger' },
  { artist: 'Toto', title: 'Africa', album: 'Toto IV' },
  { artist: 'a-ha', title: 'Take On Me', album: 'Hunting High and Low' },
  { artist: 'Eurythmics', title: 'Sweet Dreams (Are Made of This)', album: 'Sweet Dreams (Are Made of This)' },
  { artist: 'Tears for Fears', title: 'Everybody Wants to Rule the World', album: 'Songs from the Big Chair' },
  { artist: 'Cyndi Lauper', title: 'Time After Time', album: 'She’s So Unusual' },
  { artist: 'Cyndi Lauper', title: 'Girls Just Want to Have Fun', album: 'She’s So Unusual' },
  { artist: 'Michael Jackson', title: 'Thriller', album: 'Thriller' },
  { artist: 'Michael Jackson', title: 'Beat It', album: 'Thriller' },
  { artist: 'Michael Jackson', title: 'Smooth Criminal', album: 'Bad' },
  { artist: 'Michael Jackson', title: 'Black or White', album: 'Dangerous' },
  { artist: 'Michael Jackson', title: 'Man in the Mirror', album: 'Bad' },
  { artist: 'Michael Jackson', title: 'Earth Song', album: 'HIStory' },
  { artist: 'Coolio', title: 'Gangsta’s Paradise', album: 'Gangsta’s Paradise' },
  { artist: '2Pac ft. Dr. Dre', title: 'California Love', album: 'All Eyez on Me' },
  { artist: '2Pac', title: 'Changes', album: 'Greatest Hits' },
  { artist: 'Eminem', title: 'Lose Yourself', album: '8 Mile' },
  { artist: 'Eminem ft. Dido', title: 'Stan', album: 'The Marshall Mathers LP' },
  { artist: 'Eminem', title: 'Without Me', album: 'The Eminem Show' },
  { artist: 'Eminem ft. Rihanna', title: 'Love the Way You Lie', album: 'Recovery' },
  { artist: 'Eminem', title: 'Mockingbird', album: 'Encore' },
  { artist: 'Kanye West', title: 'Stronger', album: 'Graduation' },
  { artist: 'Kanye West', title: 'Gold Digger', album: 'Late Registration' },
  { artist: 'Kanye West', title: 'Jesus Walks', album: 'The College Dropout' },
  { artist: 'Kanye West', title: 'All of the Lights', album: 'My Beautiful Dark Twisted Fantasy' },
  { artist: 'Linkin Park', title: 'Numb', album: 'Meteora' },
  { artist: 'Linkin Park', title: 'In the End', album: 'Hybrid Theory' },
  { artist: 'Linkin Park', title: 'Crawling', album: 'Hybrid Theory' },
  { artist: 'Linkin Park', title: 'Breaking the Habit', album: 'Meteora' },
  { artist: 'Linkin Park', title: 'Somewhere I Belong', album: 'Meteora' },
  { artist: 'Green Day', title: 'Boulevard of Broken Dreams', album: 'American Idiot' },
  { artist: 'Green Day', title: 'American Idiot', album: 'American Idiot' },
  { artist: 'Green Day', title: '21 Guns', album: '21st Century Breakdown' },
  { artist: 'Green Day', title: 'Wake Me Up When September Ends', album: 'American Idiot' },
  { artist: 'Coldplay', title: 'Fix You', album: 'X&Y' },
  { artist: 'Coldplay', title: 'Yellow', album: 'Parachutes' },
  { artist: 'Coldplay', title: 'Clocks', album: 'A Rush of Blood to the Head' },
  { artist: 'Coldplay', title: 'The Scientist', album: 'A Rush of Blood to the Head' },
  { artist: 'Coldplay', title: 'Viva La Vida', album: 'Viva la Vida or Death and All His Friends' },
  { artist: 'Coldplay', title: 'Paradise', album: 'Mylo Xyloto' },
  { artist: 'Coldplay', title: 'Sky Full of Stars', album: 'Ghost Stories' },
  { artist: 'Imagine Dragons', title: 'Radioactive', album: 'Night Visions' },
  { artist: 'Imagine Dragons', title: 'Demons', album: 'Night Visions' },
  { artist: 'Imagine Dragons', title: 'Believer', album: 'Evolve' },
  { artist: 'Imagine Dragons', title: 'Thunder', album: 'Evolve' },
  { artist: 'Imagine Dragons', title: 'On Top of the World', album: 'Night Visions' },
  { artist: 'Billie Eilish', title: 'Bad Guy', album: 'When We All Fall Asleep, Where Do We Go?' },
  { artist: 'Billie Eilish', title: 'Everything I Wanted', album: 'Single' },
  { artist: 'Billie Eilish', title: 'Happier Than Ever', album: 'Happier Than Ever' },
  { artist: 'Dua Lipa', title: 'Don’t Start Now', album: 'Future Nostalgia' },
  { artist: 'Dua Lipa', title: 'Levitating', album: 'Future Nostalgia' },
  { artist: 'Dua Lipa', title: 'Physical', album: 'Future Nostalgia' },
  { artist: 'Harry Styles', title: 'Watermelon Sugar', album: 'Fine Line' },
  { artist: 'Harry Styles', title: 'Adore You', album: 'Fine Line' },
  { artist: 'Harry Styles', title: 'As It Was', album: 'Harry’s House' },
  { artist: 'Taylor Swift', title: 'Love Story', album: 'Fearless' },
  { artist: 'Taylor Swift', title: 'You Belong With Me', album: 'Fearless' },
  { artist: 'Taylor Swift', title: 'Cruel Summer', album: 'Lover' },
  { artist: 'Taylor Swift', title: 'All Too Well', album: 'Red' },
  { artist: 'Taylor Swift', title: 'Anti-Hero', album: 'Midnights' },
  { artist: 'Ed Sheeran', title: 'Perfect', album: '÷' },
  { artist: 'Ed Sheeran', title: 'Photograph', album: 'x' },
  { artist: 'Ed Sheeran', title: 'Galway Girl', album: '÷' },
  { artist: 'Ariana Grande', title: '7 rings', album: 'thank u, next' },
  { artist: 'Ariana Grande', title: 'Positions', album: 'Positions' },
  { artist: 'Ariana Grande', title: 'No Tears Left to Cry', album: 'Sweetener' },
  { artist: 'Kendrick Lamar', title: 'HUMBLE.', album: 'DAMN.' },
  { artist: 'Kendrick Lamar', title: 'DNA.', album: 'DAMN.' },
  { artist: 'Kendrick Lamar', title: 'Alright', album: 'To Pimp a Butterfly' },
  { artist: 'Post Malone', title: 'Circles', album: 'Hollywood\'s Bleeding' },
  { artist: 'Post Malone', title: 'Sunflower', album: 'Hollywood\'s Bleeding' },
  { artist: 'Post Malone', title: 'Rockstar', album: 'Beerbongs & Bentleys' },
  { artist: 'Shawn Mendes', title: 'Stitches', album: 'Handwritten' },
  { artist: 'Shawn Mendes', title: 'Señorita', album: 'Shawn Mendes' },
  { artist: 'Shawn Mendes', title: 'In My Blood', album: 'Shawn Mendes' },
  { artist: 'Camila Cabello', title: 'Havana', album: 'Camila' },
  { artist: 'Camila Cabello', title: 'Never Be the Same', album: 'Camila' },
  { artist: 'Camila Cabello', title: 'Bam Bam', album: 'Familia' },
  { artist: 'Lil Nas X', title: 'Montero (Call Me By Your Name)', album: 'Montero' },
  { artist: 'Lil Nas X', title: 'Industry Baby', album: 'Single' },
  { artist: 'Lil Nas X', title: 'Old Town Road', album: '7 EP' },
  { artist: 'Demi Lovato', title: 'Sorry Not Sorry', album: 'Tell Me You Love Me' },
  { artist: 'Demi Lovato', title: 'Skyscraper', album: 'Unbroken' },
  { artist: 'Demi Lovato', title: 'Confident', album: 'Confident' },
  { artist: 'Sia', title: 'Chandelier', album: '1000 Forms of Fear' },
  { artist: 'Sia', title: 'Elastic Heart', album: '1000 Forms of Fear' },
  { artist: 'Sia', title: 'Cheap Thrills', album: 'This Is Acting' },
  { artist: 'Kanye West', title: 'Heartless', album: '808s & Heartbreak' },
  { artist: 'Bruno Mars', title: '24K Magic', album: '24K Magic' },
  { artist: 'Bruno Mars', title: 'That’s What I Like', album: '24K Magic' },
  { artist: 'Mark Ronson', title: 'Uptown Funk', album: 'Uptown Special' },
  { artist: 'Lady Gaga', title: 'Shallow', album: 'A Star Is Born' },
  { artist: 'Lady Gaga', title: 'Rain on Me', album: 'Chromatica' },
  { artist: 'Lady Gaga', title: 'Stupid Love', album: 'Chromatica' },
  { artist: 'Imagine Dragons', title: 'Whatever It Takes', album: 'Evolve' },
  { artist: 'Imagine Dragons', title: 'Natural', album: 'Origins' },
  { artist: 'Coldplay', title: 'Viva la Vida', album: 'Viva la Vida or Death and All His Friends' },
  { artist: 'Coldplay', title: 'Hymn for the Weekend', album: 'A Head Full of Dreams' },
  { artist: 'Coldplay', title: 'Adventure of a Lifetime', album: 'A Head Full of Dreams' },
  { artist: 'Coldplay', title: 'Something Just Like This', album: 'Memories…Do Not Open' },
  { artist: 'The Chainsmokers', title: 'Closer', album: 'Collage' },
  { artist: 'The Chainsmokers', title: 'Don’t Let Me Down', album: 'Collage' },
  { artist: 'The Chainsmokers & Coldplay', title: 'Something Just Like This', album: 'Memories…Do Not Open' },
  { artist: 'Maroon 5', title: 'Sugar', album: 'V' },
  { artist: 'Maroon 5', title: 'Memories', album: 'Jordi' },
  { artist: 'Maroon 5', title: 'Girls Like You', album: 'Red Pill Blues' },
  { artist: 'Maroon 5', title: 'Animals', album: 'V' },
  { artist: 'Selena Gomez', title: 'Lose You to Love Me', album: 'Rare' },
  { artist: 'Selena Gomez', title: 'Love You Like a Love Song', album: 'When the Sun Goes Down' },
  { artist: 'Selena Gomez', title: 'Hands to Myself', album: 'Revival' },
  { artist: 'Shakira', title: 'Hips Don’t Lie', album: 'Oral Fixation, Vol. 2' },
  { artist: 'Shakira', title: 'Waka Waka (This Time for Africa)', album: 'Sale el Sol' },
  { artist: 'Shakira', title: 'Whenever, Wherever', album: 'Laundry Service' },
  { artist: 'Justin Bieber', title: 'Peaches', album: 'Justice' },
  { artist: 'Justin Bieber', title: 'Sorry', album: 'Purpose' },
  { artist: 'Justin Bieber', title: 'Love Yourself', album: 'Purpose' },
  { artist: 'Justin Bieber', title: 'What Do You Mean?', album: 'Purpose' },
  { artist: 'Ava Max', title: 'Sweet but Psycho', album: 'Heaven & Hell' },
  { artist: 'Ava Max', title: 'Kings & Queens', album: 'Heaven & Hell' },
  { artist: 'Ava Max', title: 'My Head & My Heart', album: 'Diamonds & Dancefloors' },
  { artist: 'Halsey', title: 'Without Me', album: 'Manic' },
  { artist: 'Halsey', title: 'Graveyard', album: 'Manic' },
  { artist: 'Halsey', title: 'Nightmare', album: 'Hopeless Fountain Kingdom' },
  { artist: 'Halsey', title: 'Gasoline', album: 'Badlands' },
  { artist: 'Miley Cyrus', title: 'Wrecking Ball', album: 'Bangerz' },
  { artist: 'Miley Cyrus', title: 'Party in the U.S.A.', album: 'The Time of Our Lives' },
  { artist: 'Miley Cyrus', title: 'Midnight Sky', album: 'Plastic Hearts' },
  { artist: 'Miley Cyrus', title: 'The Climb', album: 'Hannah Montana: The Movie' },
  { artist: 'Khalid', title: 'Location', album: 'American Teen' },
  { artist: 'Khalid', title: 'Talk', album: 'Free Spirit' },
  { artist: 'Khalid', title: 'Better', album: 'Free Spirit' },
  { artist: 'Khalid', title: 'Young Dumb & Broke', album: 'American Teen' },
  { artist: 'Lewis Capaldi', title: 'Someone You Loved', album: 'Divinely Uninspired to a Hellish Extent' },
  { artist: 'Lewis Capaldi', title: 'Before You Go', album: 'Divinely Uninspired to a Hellish Extent' },
  { artist: 'Lewis Capaldi', title: 'Hold Me While You Wait', album: 'Divinely Uninspired to a Hellish Extent' },
  { artist: 'Sam Smith', title: 'Stay With Me', album: 'In the Lonely Hour' },
  { artist: 'Sam Smith', title: 'Unholy', album: 'Gloria' },
  { artist: 'Sam Smith', title: 'Too Good at Goodbyes', album: 'The Thrill of It All' },
  { artist: 'Sam Smith', title: 'I’m Not the Only One', album: 'In the Lonely Hour' },
  { artist: 'Sam Smith', title: 'Lay Me Down', album: 'In the Lonely Hour' },
  { artist: 'Sam Smith', title: 'How Do You Sleep?', album: 'Gloria' },
  { artist: 'Rihanna', title: 'We Found Love', album: 'Talk That Talk' },
  { artist: 'Rihanna', title: 'Only Girl (In The World)', album: 'Loud' },
  { artist: 'Rihanna', title: 'Umbrella', album: 'Good Girl Gone Bad' },
  { artist: 'Beyoncé', title: 'Halo', album: 'I Am… Sasha Fierce' },
  { artist: 'Beyoncé', title: 'Single Ladies (Put a Ring on It)', album: 'I Am… Sasha Fierce' },
  { artist: 'Adele', title: 'Hello', album: '25' },
  { artist: 'Adele', title: 'Easy on Me', album: '30' },
  { artist: 'Sia', title: 'Alive', album: 'This Is Acting' },
  { artist: 'Sia', title: 'Bird Set Free', album: 'This Is Acting' },
  { artist: 'Halsey', title: 'Colors', album: 'Badlands' },
  { artist: 'Billie Eilish', title: 'Your Power', album: 'Happier Than Ever' },
  { artist: 'Billie Eilish', title: 'No Time To Die', album: 'Single' },
  { artist: 'Dua Lipa', title: 'Break My Heart', album: 'Future Nostalgia' },
  { artist: 'Dua Lipa', title: 'Hallucinate', album: 'Future Nostalgia' },
  { artist: 'Harry Styles', title: 'Golden', album: 'Fine Line' },
  { artist: 'Harry Styles', title: 'Falling', album: 'Fine Line' },
  { artist: 'Harry Styles', title: 'Lights Up', album: 'Fine Line' },
  { artist: 'Ed Sheeran', title: 'Castle on the Hill', album: '÷' },
  { artist: 'Ed Sheeran', title: 'Bad Habits', album: '=' },
  { artist: 'Ariana Grande', title: 'Into You', album: 'Dangerous Woman' },
  { artist: 'Ariana Grande', title: 'Side to Side', album: 'Dangerous Woman' },
  { artist: 'Ariana Grande', title: 'Problem', album: 'My Everything' },
  { artist: 'Kendrick Lamar', title: 'Bitch, Don’t Kill My Vibe', album: 'good kid, m.A.A.d city' },
  { artist: 'Kendrick Lamar', title: 'Poetic Justice', album: 'good kid, m.A.A.d city' },
  { artist: 'Kendrick Lamar', title: 'Swimming Pools (Drank)', album: 'good kid, m.A.A.d city' },
  { artist: 'Post Malone', title: 'Wow.', album: 'Hollywood\'s Bleeding' },
  { artist: 'Post Malone', title: 'Better Now', album: 'Beerbongs & Bentleys' },
  { artist: 'Post Malone', title: 'Congratulations', album: 'Stoney' },
  { artist: 'Shawn Mendes', title: 'Treat You Better', album: 'Illuminate' },
  { artist: 'Shawn Mendes', title: 'Mercy', album: 'Illuminate' },
  { artist: 'Shawn Mendes', title: 'Life of the Party', album: 'Handwritten' },
  { artist: 'Camila Cabello', title: 'Crying in the Club', album: 'Camila' },
  { artist: 'Camila Cabello', title: 'Shameless', album: 'Camila' },
  { artist: 'Camila Cabello', title: 'Liar', album: 'Camila' },
  { artist: 'Lil Nas X', title: 'Panini', album: '7 EP' },
  { artist: 'Lil Nas X', title: 'Sun Goes Down', album: 'Montero' },
  { artist: 'Lil Nas X', title: 'Holiday', album: 'Montero' },
  { artist: 'Demi Lovato', title: 'Stone Cold', album: 'Confident' },
  { artist: 'Demi Lovato', title: 'Heart Attack', album: 'Demi' },
  { artist: 'Demi Lovato', title: 'Give Your Heart a Break', album: 'Unbroken' },
  { artist: 'Sia', title: 'Never Give Up', album: 'Music – Songs from and Inspired by the Motion Picture' },
  { artist: 'Sia', title: 'Fire Meet Gasoline', album: '1000 Forms of Fear' },
  { artist: 'Sia', title: 'Reaper', album: '1000 Forms of Fear' },
  { artist: 'Kanye West', title: 'Power', album: 'My Beautiful Dark Twisted Fantasy' },
  { artist: 'Kanye West', title: 'Flashing Lights', album: 'Graduation' },
  { artist: 'Kanye West', title: 'Love Lockdown', album: '808s & Heartbreak' },
  { artist: 'Bruno Mars', title: 'Grenade', album: 'Doo-Wops & Hooligans' },
  { artist: 'Bruno Mars', title: 'Just the Way You Are', album: 'Doo-Wops & Hooligans' },
  { artist: 'Bruno Mars', title: 'Versace on the Floor', album: '24K Magic' },
  { artist: 'Lady Gaga', title: 'Born This Way', album: 'Born This Way' },
  { artist: 'The Chainsmokers', title: 'Paris', album: 'Collage' },
  { artist: 'The Chainsmokers', title: 'Something Just Like This', album: 'Memories…Do Not Open' },
  { artist: 'Travis Scott', title: 'SICKO MODE', album: 'Astroworld' },
  { artist: 'Travis Scott', title: 'Goosebumps', album: 'Birds in the Trap Sing McKnight' },
  { artist: 'Travis Scott', title: 'Highest in the Room', album: 'Single' },
  { artist: 'Cardi B', title: 'I Like It', album: 'Invasion of Privacy' },
  { artist: 'Cardi B', title: 'WAP', album: 'Single' },
  { artist: 'Cardi B', title: 'Up', album: 'Single' },
  { artist: 'Doja Cat', title: 'Say So', album: 'Hot Pink' },
  { artist: 'Doja Cat', title: 'Kiss Me More', album: 'Planet Her' },
  { artist: 'Doja Cat', title: 'Woman', album: 'Planet Her' },
  { artist: 'Billie Eilish', title: 'Bury a Friend', album: 'When We All Fall Asleep, Where Do We Go?' },
  { artist: 'Ariana Grande', title: 'God is a woman', album: 'Sweetener' },
  { artist: 'Ed Sheeran', title: 'Shivers', album: '=' },
  { artist: 'Shawn Mendes', title: 'Senorita', album: 'Shawn Mendes' },
  { artist: 'Travis Scott', title: 'Antidote', album: 'Rodeo' },
  { artist: 'Demi Lovato', title: 'Cool for the Summer', album: 'Demi' },
  { artist: 'The Weeknd', title: 'Heartless', album: 'After Hours' },
  { artist: 'The Weeknd', title: 'In Your Eyes', album: 'After Hours' },
  { artist: 'The Weeknd', title: 'Call Out My Name', album: 'My Dear Melancholy,' },
  { artist: 'Beyoncé', title: 'Drunk in Love', album: 'Beyoncé' },
  { artist: 'Beyoncé', title: 'Partition', album: 'Beyoncé' },
  { artist: 'Rihanna', title: 'Work', album: 'Anti' },
  { artist: 'Rihanna', title: 'Where Have You Been', album: 'Talk That Talk' },
  { artist: 'Taylor Swift', title: 'Cardigan', album: 'Folklore' },
  { artist: 'Taylor Swift', title: 'Willow', album: 'Evermore' },
  { artist: 'Post Malone', title: 'Goodbyes', album: 'Hollywood\'s Bleeding' },
  { artist: 'Halsey', title: 'Graveyard', album: 'If I Can’t Have Love, I Want Power' },
  { artist: 'Shakira', title: 'Chantaje', album: 'El Dorado' },
  { artist: 'Camila Cabello', title: 'My Oh My', album: 'Romance' },
  { artist: 'Lizzo', title: 'Truth Hurts', album: 'Cuz I Love You' },
  { artist: 'Lizzo', title: 'Good as Hell', album: 'Cuz I Love You' },
  { artist: 'Lizzo', title: 'Juice', album: 'Cuz I Love You' },
  { artist: 'Iron & Wine', title: 'Naked as We Came', album: 'Our Endless Numbered Days' },
  { artist: 'Bon Iver', title: 'Holocene', album: 'Bon Iver, Bon Iver' },
  { artist: 'Sufjan Stevens', title: 'Mystery of Love', album: 'Call Me by Your Name OST' },
  { artist: 'Angus & Julia Stone', title: 'Chateau', album: 'Snow' },
  { artist: 'Ben Howard', title: 'Only Love', album: 'Every Kingdom' },
  { artist: 'Phoebe Bridgers', title: 'Motion Sickness', album: 'Stranger in the Alps' },
  { artist: 'Mumford & Sons', title: 'I Will Wait', album: 'Babel' },
  { artist: 'José González', title: 'Heartbeats', album: 'Veneer' },
  { artist: 'The Paper Kites', title: 'Bloom', album: 'States' },
  { artist: 'Daughter', title: 'Youth', album: 'If You Leave' },
  { artist: 'London Grammar', title: 'Strong', album: 'If You Wait' },
  { artist: 'Angus & Julia Stone', title: 'Big Jet Plane', album: 'Down the Way' },
  { artist: 'Iron & Wine', title: 'Flightless Bird, American Mouth', album: 'The Shepherd\'s Dog' },
  { artist: 'Fleet Foxes', title: 'Tiger Mountain Peasant Song', album: 'Fleet Foxes' },
  { artist: 'Ray LaMontagne', title: 'Trouble', album: 'Trouble' },
  { artist: 'Nick Drake', title: 'Pink Moon', album: 'Pink Moon' },
  { artist: 'Elliott Smith', title: 'Between the Bars', album: 'Either/Or' },
  { artist: 'James Blake', title: 'Retrograde', album: 'Overgrown' },
  { artist: 'Bon Iver', title: 'Skinny Love', album: 'For Emma, Forever Ago' },
  { artist: 'Sia', title: 'Breathe Me', album: 'Colour the Small One' },
  { artist: 'The National', title: 'I Need My Girl', album: 'Trouble Will Find Me' },
  { artist: 'Leon Bridges', title: 'River', album: 'Coming Home' },
  { artist: 'Norah Jones', title: 'Come Away With Me', album: 'Come Away With Me' },
  { artist: 'José González', title: 'Crosses', album: 'Veneer' },
  { artist: 'Angus & Julia Stone', title: 'Heart Beats Slow', album: 'Angus & Julia Stone' },
  { artist: 'Keaton Henson', title: 'You', album: 'Dear...' },
  { artist: 'Passenger', title: 'Let Her Go', album: 'All the Little Lights' },
  { artist: 'Vance Joy', title: 'Riptide', album: 'Dream Your Life Away' },
  { artist: 'Lana Del Rey', title: 'Mariners Apartment Complex', album: 'Norman Fucking Rockwell!' },
  { artist: 'Lana Del Rey', title: 'Video Games', album: 'Born to Die' },
  { artist: 'Angus & Julia Stone', title: 'Draw Your Swords', album: 'Down the Way' },
  { artist: 'The Cinematic Orchestra', title: 'To Build a Home', album: 'Ma Fleur' },
  { artist: 'Regina Spektor', title: 'Samson', album: 'Songs' },
  { artist: 'The xx', title: 'Intro', album: 'xx' },
  { artist: 'The xx', title: 'Angels', album: 'I See You' },
  { artist: 'Alt-J', title: 'Taro', album: 'An Awesome Wave' },
  { artist: 'Alt-J', title: 'Breezeblocks', album: 'An Awesome Wave' },
  { artist: 'Sigur Rós', title: 'Hoppípolla', album: 'Takk...' },
  { artist: 'Sigur Rós', title: 'Sæglópur', album: 'Takk...' },
  { artist: 'Angus & Julia Stone', title: 'A Heartbreak', album: 'Snow' },
  { artist: 'FKA twigs', title: 'Cellophane', album: 'Magdalene' },
  { artist: 'FKA twigs', title: 'Two Weeks', album: 'LP1' },
  { artist: 'James Vincent McMorrow', title: 'Higher Love', album: 'Post Tropical' },
  { artist: 'James Blake', title: 'The Wilhelm Scream', album: 'James Blake' },
  { artist: 'Daughter', title: 'Landfill', album: 'If You Leave' },
  { artist: 'Ben Howard', title: 'Keep Your Head Up', album: 'Every Kingdom' },
  { artist: 'Iron & Wine', title: 'Such Great Heights', album: 'Our Endless Numbered Days' },
  { artist: 'Sufjan Stevens', title: 'Should Have Known Better', album: 'Carrie & Lowell' },
  { artist: 'Mumford & Sons', title: 'The Cave', album: 'Sigh No More' },
  { artist: 'Norah Jones', title: 'Don’t Know Why', album: 'Come Away With Me' },
  { artist: 'Ray LaMontagne', title: 'Jolene', album: 'Trouble' },
  { artist: 'Nick Drake', title: 'River Man', album: 'Five Leaves Left' },
  { artist: 'Bon Iver', title: 'Re: Stacks', album: 'For Emma, Forever Ago' },
  { artist: 'Keaton Henson', title: 'Small Hands', album: 'Dear...' },
  { artist: 'The Paper Kites', title: 'Featherstone', album: 'twelvefour' },
  { artist: 'José González', title: 'Stay Alive', album: 'Vestiges & Claws' },
  { artist: 'Passenger', title: 'Scare Away the Dark', album: 'Whispers' },
  { artist: 'London Grammar', title: 'Wasting My Young Years', album: 'If You Wait' },
  { artist: 'Dua Lipa', title: 'Levitating (acoustic)', album: 'Future Nostalgia' },
  { artist: 'Lorde', title: 'Liability', album: 'Melodrama' },
  { artist: 'Lorde', title: 'Ribs', album: 'Pure Heroine' },
  { artist: 'Lorde', title: 'Supercut', album: 'Melodrama' },
  { artist: 'Birdy', title: 'Skinny Love', album: 'Birdy' },
  { artist: 'Birdy', title: 'People Help the People', album: 'Birdy' },
  { artist: 'Birdy', title: 'Wings', album: 'Fire Within' },
  { artist: 'Aurora', title: 'Runaway', album: 'All My Demons Greeting Me as a Friend' },
  { artist: 'Aurora', title: 'Queendom', album: 'A Different Kind of Human' },
  { artist: 'Aurora', title: 'Conqueror', album: 'All My Demons Greeting Me as a Friend' },
  { artist: 'Hozier', title: 'Take Me to Church', album: 'Hozier' },
  { artist: 'Hozier', title: 'Cherry Wine', album: 'Hozier' },
  { artist: 'Hozier', title: 'Movement', album: 'Hozier' },
  { artist: 'Rhye', title: 'Open', album: 'Woman' },
  { artist: 'Rhye', title: 'The Fall', album: 'Blood' },
  { artist: 'Rhye', title: 'Song For You', album: 'Woman' },
  { artist: 'José González', title: 'Killing for Love', album: 'Vestiges & Claws' },
  { artist: 'Sufjan Stevens', title: 'Death with Dignity', album: 'Carrie & Lowell' },
  { artist: 'Nick Drake', title: 'Place to Be', album: 'Pink Moon' },
  { artist: 'Nick Drake', title: 'Things Behind the Sun', album: 'Pink Moon' },
  { artist: 'Foy Vance', title: 'Guiding Light', album: 'The Wild Swan' },
  { artist: 'Foy Vance', title: 'She Burns', album: 'The Wild Swan' },
  { artist: 'Foy Vance', title: 'Home', album: 'Joy of Nothing' },
  { artist: 'Damien Rice', title: '9 Crimes', album: '9' },
  { artist: 'Damien Rice', title: 'Cannonball', album: 'O' },
  { artist: 'Damien Rice', title: 'The Blower\'s Daughter', album: 'O' },
  { artist: 'Ray LaMontagne', title: 'Let It Be Me', album: 'Gossip in the Grain' },
  { artist: 'Nick Cave & The Bad Seeds', title: 'Into My Arms', album: 'The Boatman’s Call' },
  { artist: 'Nick Cave & The Bad Seeds', title: 'The Ship Song', album: 'The Good Son' },
  { artist: 'Nick Cave & The Bad Seeds', title: 'Jubilee Street', album: 'Push the Sky Away' },
  { artist: 'Sufjan Stevens', title: 'Fourth of July', album: 'Carrie & Lowell' },
  { artist: 'Angus & Julia Stone', title: 'Yellow Brick Road', album: 'Down the Way' },
  { artist: 'Iron & Wine', title: 'Passing Afternoon', album: 'The Shepherd\'s Dog' },
  { artist: 'Bon Iver', title: 'Calgary', album: 'Bon Iver, Bon Iver' },
  { artist: 'Daughter', title: 'Smother', album: 'If You Leave' },
  { artist: 'The Paper Kites', title: 'Electric Indigo', album: 'twelvefour' },
  { artist: 'London Grammar', title: 'Nightcall', album: 'If You Wait' },
  { artist: 'Angus & Julia Stone', title: 'For You', album: 'Snow' },
  { artist: 'James Blake', title: 'Limit to Your Love', album: 'James Blake' },
  { artist: 'Phoebe Bridgers', title: 'Garden Song', album: 'Punisher' },
  { artist: 'Phoebe Bridgers', title: 'Kyoto', album: 'Punisher' },
  { artist: 'Aurora', title: 'Forgotten Love', album: 'All My Demons Greeting Me as a Friend' },
  { artist: 'Hozier', title: 'From Eden', album: 'Hozier' },
  { artist: 'Rhye', title: 'Count to Five', album: 'Woman' },
  { artist: 'Foy Vance', title: 'Be the Song', album: 'The Wild Swan' },
  { artist: 'Damien Rice', title: 'I Don’t Want To Change You', album: 'O' },
  { artist: 'Nick Cave & The Bad Seeds', title: 'Into My Arms', album: 'The Boatman’s Call' }
];

/**
 * THE DEFINITIVE PITCHFORK SCRAPER
 * Tries to find a specific track review first. If that fails, it uses the
 * artist/album page navigation workflow to find the album review.
 */
async function getPitchforkReview(artist, title, album) {
  try {
    let reviewUrl = '';

    // --- STRATEGY 1: Try to find a direct track review first. ---
    // Some tracks, especially singles, have their own review pages.
    console.log(`  > Searching for a direct review for track: '${title}'...`);
    const trackSearchUrl = `https://pitchfork.com/search/?query=${encodeURIComponent(`${artist} ${title}`)}&type=track`;
    const trackSearchResponse = await axios.get(trackSearchUrl);
    const $trackSearch = cheerio.load(trackSearchResponse.data);
    const trackReviewUrl = $trackSearch('a[href*="/reviews/tracks/"]').first().attr('href');

    if (trackReviewUrl) {
      reviewUrl = trackReviewUrl;
    } else {
      // --- STRATEGY 2: If no track review, use the album workflow. ---
      console.log(`  > No track review found. Searching for album '${album}' on artist's page...`);

      // Step 2a: Find the main artist page.
      const artistSearchUrl = `https://pitchfork.com/search/?query=${encodeURIComponent(artist)}`;
      const artistSearchResponse = await axios.get(artistSearchUrl);
      const $artistSearch = cheerio.load(artistSearchResponse.data);
      const artistPageUrl = $artistSearch('a[href^="/artists/"]').first().attr('href');

      if (!artistPageUrl) {
        console.log(`  > Could not find an artist page link for '${artist}'.`);
        return '';
      }

      // Step 2b: Go to the artist page and find the album link.
      const fullArtistPageUrl = `https://pitchfork.com${artistPageUrl}`;
      const artistPageResponse = await axios.get(fullArtistPageUrl);
      const $artistPage = cheerio.load(artistPageResponse.data);

      $artistPage('div.review').each((i, el) => {
        const albumTitle = $artistPage(el).find('h2.review__title').text().trim();
        if (albumTitle.toLowerCase() === album.toLowerCase()) {
          reviewUrl = $artistPage(el).find('a.review__link').attr('href');
          return false; // Stop the loop
        }
      });
    }

    if (!reviewUrl) {
      console.log(`  > Could not find any review for '${title}' or '${album}'.`);
      return '';
    }

    // --- FINAL STEP: Scrape the found URL ---
    const fullReviewUrl = `https://pitchfork.com${reviewUrl}`;
    console.log(`  > Found review link: ${fullReviewUrl}`);
    const reviewPage = await axios.get(fullReviewUrl);
    const $review = cheerio.load(reviewPage.data);
    const reviewText = $review('div.body__inner-container').text().trim();

    console.log(`  > Successfully scraped review content.`);
    return reviewText;

  } catch (error) {
    console.error(`! An error occurred during the Pitchfork scraping process for ${artist}:`, error.message);
    return '';
  }
}
async function getGeniusData(artist, title) {
  try {
    const formatForUrl = (str) =>
      str
        .toLowerCase()
        .replace(/&/g, 'and') // Handle ampersands
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    const formattedArtist = formatForUrl(artist);
    const formattedTitle = formatForUrl(title);
    const songUrl = `https://genius.com/${formattedArtist}-${formattedTitle}-lyrics`;

    console.log(`  > Attempting to scrape Genius: ${songUrl}`);
    const response = await axios.get(songUrl);
    const $ = cheerio.load(response.data);

    // --- Scrape Lyrics ---
    $('div[data-lyrics-container="true"]').find('br').replaceWith('\n');
    const lyrics = $('div[data-lyrics-container="true"]').text().trim();

    // --- Scrape "About" Section ---
    // The 'About' content is in a div with a specific class structure.
    const aboutText = $('div[class^="SongDescription__Content"]').text().trim();

    console.log(`  > Successfully scraped data from Genius (Lyrics: ${lyrics.length > 0}, About: ${aboutText.length > 0}).`);

    return { lyrics, aboutText };

  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`  > Genius page not found for ${artist} - ${title}.`);
    } else {
      console.error(`! An error occurred scraping Genius:`, error.message);
    }
    return { lyrics: '', aboutText: '' }; // Return empty object on failure
  }
}

async function main() {
  const uniqueSongsMap = new Map();
  SEED_SONGS.forEach(song => {
    const key = `${song.artist}|${song.title}`.toLowerCase(); // Create a unique key
    if (!uniqueSongsMap.has(key)) {
      uniqueSongsMap.set(key, song);
    }
  });
  const UNIQUE_SEED_SONGS = Array.from(uniqueSongsMap.values());
  console.log(`Original song count: ${SEED_SONGS.length}, Unique song count: ${UNIQUE_SEED_SONGS.length}`);
  
  console.log('--- Starting Definitive Data Seeding Process ---');
  const songDocuments = [];

  try {
    for (const song of UNIQUE_SEED_SONGS) {
      console.log(`\nProcessing: ${song.artist} - ${song.title}`);

      // Get Last.fm data
      const lastFmData = await getLastFmData(song.artist, song.title);

      // Call the scraper with all three correct arguments
      const pitchforkReview = await getPitchforkReview(song.artist, song.title, song.album);

      // getting the genius data
      const geniusData = await getGeniusData(song.artist, song.title);

      // Combine all data
      const combinedText = `
            Title: ${song.title};
            Artist: ${song.artist};
            Album: ${song.album};
            Tags: ${lastFmData.tags.join(', ')};
            Summary: ${lastFmData.summary};
            Review: ${pitchforkReview};
            About: ${geniusData.aboutText};
            Lyrics: ${geniusData.lyrics};
          `.replace(/\s+/g, ' ').trim();


      console.log("--- COMBINED DATA PREVIEW ---");
      console.log(combinedText.substring(0, 500) + '...');
      console.log("----------------------------");

      console.log('  > Generating OpenAI embedding...');
      const embedding = await getOpenAIEmbedding(combinedText);

      if (!embedding) {
        console.log(`! Failed to generate embedding for ${song.title}. Skipping.`);
        continue; // Skip to the next song if embedding fails
      }
      console.log(`  > Embedding generated successfully (Vector size: ${embedding.length}).`);
      // snippet of embedding for debugging
      console.log(`  > Embedding preview: ${embedding.slice(0, 5).join(', ')}...`);

      // Prepare entry for database
      const songDocument = {
        artist: song.artist,
        title: song.title,
        album: song.album,
        sourceText: combinedText,
        embedding: embedding,
        lastFmTags: lastFmData.tags,
        lastFmSummary: lastFmData.summary,
        pitchforkReview: pitchforkReview,
      };

      songDocuments.push(songDocument);

      if (songDocuments.length > 0) {
        await seedSongsCollection(songDocuments);
      }
    }

  } catch (error) {
    console.error('An error occurred during the seeding process:', error);
  } finally {
    await closeDbConnection();
    console.log('--- Seeding Process Finished ---');
  }

}

main();