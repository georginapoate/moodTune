// backend/seedDatabase.js
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { getLastFmData } = require('./src/services/lastfmService');
const { getOpenAIEmbedding } = require('./src/services/openaiService');
const { MongoClient } = require('mongodb');


const SEED_SONGS = [
  { artist: 'Queen', title: 'Bohemian Rhapsody', album: 'A Night at the Opera' },
  { artist: 'Michael Jackson', title: 'Billie Jean', album: 'Thriller' },
  { artist: 'Bob Dylan', title: 'Like a Rolling Stone', album: 'Highway 61 Revisited' },
  { artist: 'The Beatles', title: 'Hey Jude', album: 'Single' },
  { artist: 'Nirvana', title: 'Smells Like Teen Spirit', album: 'Nevermind' },
  { artist: 'Fleetwood Mac', title: 'Dreams', album: 'Rumours' },
  { artist: 'Marvin Gaye', title: "What's Going On", album: "What's Going On" },
  { artist: 'Aretha Franklin', title: 'Respect', album: 'I Never Loved a Man the Way I Love You' },
  { artist: 'The Police', title: 'Every Breath You Take', album: 'Synchronicity' },
  { artist: 'The Beach Boys', title: 'Good Vibrations', album: 'Smiley Smile' },
  { artist: 'Whitney Houston', title: 'I Wanna Dance with Somebody (Who Loves Me)', album: 'Whitney' },
  { artist: 'ABBA', title: 'Dancing Queen', album: 'Arrival' },
  { artist: 'OutKast', title: 'Hey Ya!', album: 'Speakerboxxx/The Love Below' },
  { artist: 'Backstreet Boys', title: 'I Want It That Way', album: 'Millennium' },
  { artist: 'Madonna', title: 'Like a Prayer', album: 'Like a Prayer' },
  { artist: 'Maroon 5', title: 'Sugar', album: 'V' },
  { artist: 'Ed Sheeran', title: 'Shape of You', album: '÷' },
  { artist: 'The Weeknd', title: 'Blinding Lights', album: 'After Hours' },
  { artist: 'Drake', title: 'One Dance', album: 'Views' },
  { artist: 'Luis Fonsi & Daddy Yankee', title: 'Despacito', album: 'Vida' },
  { artist: 'Taylor Swift', title: 'Cruel Summer', album: 'Lover' },
  { artist: 'Billie Eilish', title: 'Bad Guy', album: 'When We All Fall Asleep, Where Do We Go?' },
  { artist: 'Post Malone & Swae Lee', title: 'Sunflower', album: 'Hollywood\'s Bleeding' },
  { artist: 'Harry Styles', title: 'As It Was', album: 'Harry’s House' },
  { artist: 'Lewis Capaldi', title: 'Someone You Loved', album: 'Divinely Uninspired to a Hellish Extent' },
  { artist: 'The Chainsmokers & Coldplay', title: 'Something Just Like This', album: 'Memories…Do Not Open' },
  { artist: 'Imagine Dragons', title: 'Believer', album: 'Evolve' },
  { artist: 'Glass Animals', title: 'Heat Waves', album: 'Dreamland' },
  { artist: 'Tones And I', title: 'Dance Monkey', album: 'The Kids Are Coming' },
  { artist: 'Ariana Grande', title: '7 rings', album: 'thank u, next' },
  { artist: 'Kendrick Lamar', title: 'Money Trees', album: 'good kid, m.A.A.d city' },
  { artist: 'Carly Rae Jepsen', title: 'Call Me Maybe', album: 'Kiss' },
  { artist: 'Kelly Clarkson', title: 'Since U Been Gone', album: 'Breakaway' },
  { artist: 'Britney Spears', title: '...Baby One More Time', album: '...Baby One More Time' },
  { artist: 'Nicki Minaj', title: 'Super Bass', album: 'Pink Friday' },
  { artist: 'Prince', title: 'Purple Rain', album: 'Purple Rain' },
  { artist: 'Journey', title: 'Don’t Stop Believin’', album: 'Escape' },
  { artist: 'John Lennon', title: 'Imagine', album: 'Imagine' },
  { artist: 'Elton John', title: 'Rocket Man', album: 'Honky Château' },
  { artist: 'Bruce Springsteen', title: 'Born to Run', album: 'Born to Run' },
  { artist: 'Simon & Garfunkel', title: 'Bridge Over Troubled Water', album: 'Bridge Over Troubled Water' },
  { artist: 'David Bowie', title: 'Life on Mars?', album: 'Hunky Dory' },
  { artist: 'Radiohead', title: 'Creep', album: 'Pablo Honey' },
  { artist: 'Guns N’ Roses', title: 'Sweet Child O’ Mine', album: 'Appetite for Destruction' },
  { artist: 'Eagles', title: 'Hotel California', album: 'Hotel California' },
  { artist: 'Sam Cooke', title: 'A Change Is Gonna Come', album: 'Ain’t That Good News' },
  { artist: 'Bob Marley & The Wailers', title: 'No Woman, No Cry', album: 'Natty Dread' },
  { artist: 'Jeff Buckley', title: 'Hallelujah', album: 'Grace' },
  { artist: 'The Clash', title: 'London Calling', album: 'London Calling' },
  { artist: 'The Kinks', title: 'Waterloo Sunset', album: 'Something Else by The Kinks' },
  { artist: 'Sex Pistols', title: 'God Save the Queen', album: 'Never Mind the Bollocks' },
  { artist: 'Chubby Checker', title: 'The Twist', album: 'For ’Teen Twisters Only' },
  { artist: 'LeAnn Rimes', title: 'How Do I Live', album: 'You Light Up My Life: Inspirational Songs' },
  { artist: 'Los Del Río', title: 'Macarena (Bayside Boys Mix)', album: 'A mi me gusta' },
  { artist: 'Olivia Newton‑John', title: 'Physical', album: 'Physical' },
  { artist: 'Santana feat. Rob Thomas', title: 'Smooth', album: 'Supernatural' },
  { artist: 'LMFAO feat. Lauren Bennett & GoonRock', title: 'Party Rock Anthem', album: 'Sorry for Party Rocking' },
  { artist: 'Black Eyed Peas', title: 'I Gotta Feeling', album: 'The E.N.D.' },
  { artist: 'T-Pain feat. Yung Joc', title: 'Buy U a Drank', album: 'Epiphany' },
  { artist: 'Usher feat. Lil Jon & Ludacris', title: 'Yeah!', album: 'Confessions' },
  { artist: 'Shawn Mendes & Camila Cabello', title: 'Señorita', album: 'Shawn Mendes' },
  { artist: 'Imagine Dragons', title: 'Radioactive', album: 'Night Visions' },
  { artist: 'Avicii', title: 'Wake Me Up', album: 'True' },
  { artist: 'Major Lazer feat. MØ & DJ Snake', title: 'Lean On', album: 'Peace Is the Mission' },
  { artist: 'Coldplay', title: 'Viva la Vida', album: 'Viva la Vida or Death and All His Friends' },
  { artist: 'Rihanna feat. Jay‑Z', title: 'Umbrella', album: 'Good Girl Gone Bad' },
  { artist: 'Beyoncé feat. Jay‑Z', title: 'Crazy in Love', album: 'Dangerously in Love' },
  { artist: 'Dua Lipa', title: 'Don’t Start Now', album: 'Future Nostalgia' },
  { artist: 'Scooter', title: 'Hyper Hyper', album: '… and the Beat Goes On!' },
  { artist: 'Sly & The Family Stone', title: 'Family Affair', album: 'There’s a Riot Goin’ On' },
  { artist: 'Ben E. King', title: 'Stand by Me', album: 'Don’t Play That Song!' },
  { artist: 'Chuck Berry', title: 'Johnny B. Goode', album: 'Single' },
  { artist: 'Ray Charles', title: "What’d I Say", album: 'Single' },
  { artist: 'Dire Straits', title: 'Sultans of Swing', album: 'Dire Straits' },
  { artist: 'Simon & Garfunkel', title: 'The Sound of Silence', album: 'Sounds of Silence' },
  { artist: 'Etta James', title: 'At Last', album: 'At Last!' },
  { artist: 'Adele', title: 'Someone Like You', album: '21' },
  { artist: 'Sia', title: 'Chandelier', album: '1000 Forms of Fear' },
  { artist: 'Bruno Mars', title: 'Uptown Funk', album: 'Uptown Special' },
  { artist: 'Lady Gaga', title: 'Bad Romance', album: 'The Fame Monster' },
  { artist: 'Psy', title: 'Gangnam Style', album: 'Psy 6 (Six Rules), Part 1' },
  { artist: 'Johnny Cash', title: 'Ring of Fire', album: 'Ring of Fire: The Best of Johnny Cash' },
  { artist: 'Shakira', title: 'Waka Waka (This Time for Africa)', album: 'Sale el Sol' },
  { artist: 'Camila Cabello feat. Young Thug', title: 'Havana', album: 'Camila' },
  { artist: 'Elton John & Dua Lipa', title: 'Cold Heart', album: 'The Lockdown Sessions' },
  { artist: 'Billie Eilish & Khalid', title: 'Lovely', album: 'Single' }
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
    console.log('--- Starting Definitive Data Seeding Process ---');

    const client = new MongoClient(process.env.MONGO_URI);

    try {
      await client.connect();
      console.log('Connected to MongoDB');
      const db = client.db('moodtunes');
      const collection = db.collection('songs');
      console.log('Connected to the songs collection in MongoDB');
      
      await collection.deleteMany({});
      console.log('> Cleared existing songs from the collection.');


      for (const song of SEED_SONGS) {
          console.log(`\nProcessing: ${song.artist} - ${song.title}`);
  
          // Get Last.fm data
          const lastFmData = await getLastFmData(song.artist, song.title);
  
          // Call the scraper with all three correct arguments
          const pitchforkReview = await getPitchforkReview(song.artist, song.title, song.album);
          
          // getting the genius data
          const geniusData  = await getGeniusData(song.artist, song.title); 
  
          // Combine all data
          const combinedText = `
            Title: ${song.title};
            Artist: ${song.artist};
            Album: ${song.album};
            Tags: ${lastFmData.tags.join(', ')};
            Summary: ${lastFmData.summary};
            Review: ${pitchforkReview};
            About: ${geniusData .aboutText};
            Lyrics: ${geniusData .lyrics};
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

          await collection.insertOne(songDocument);
            console.log(`  > Successfully saved "${song.title}" to the database.`);
      }
    
    } catch (error) {
        console.error('An error occurred during the seeding process:', error);
    } finally {
        // --- Step 5: Ensure the database connection is closed ---
        await client.close();
        console.log('\n> Disconnected from MongoDB.');
        console.log('--- Seeding Process Finished ---');
    }

}

main();