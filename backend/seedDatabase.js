// backend/seedDatabase.js
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { getLastFmData } = require('./src/services/lastfmService');

const SEED_SONGS = [
    { artist: 'Fleetwood Mac', title: 'Dreams', album: 'Rumours' },
    { artist: 'Kendrick Lamar', title: 'Money Trees', album: 'good kid, m.A.A.d city' },
    { artist: 'The Strokes', title: 'Last Nite', album: 'Is This It' },
    { artist: 'Daft Punk', title: 'One More Time', album: 'Discovery' },
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

async function main() {
    console.log('--- Starting Definitive Data Seeding Process ---');
    const allSongData = [];

    for (const song of SEED_SONGS) {
        console.log(`\nProcessing: ${song.artist} - ${song.title}`);

        // Get Last.fm data
        const lastFmData = await getLastFmData(song.artist, song.title);

        // --- THIS IS THE FIX ---
        // Call the scraper with all three correct arguments
        const pitchforkReview = await getPitchforkReview(song.artist, song.title, song.album);
        
        // Combine all data
        const combinedText = `
          Title: ${song.title};
          Artist: ${song.artist};
          Album: ${song.album};
          Tags: ${lastFmData.tags.join(', ')};
          Summary: ${lastFmData.summary};
          Review: ${pitchforkReview}
        `.replace(/\s+/g, ' ').trim();

        // Prepare entry for database
        const songEntry = {
          artist: song.artist,
          title: song.title,
          album: song.album,
          sourceText: combinedText,
        };

        console.log("--- COMBINED DATA PREVIEW ---");
        console.log(songEntry.sourceText.substring(0, 500) + '...');
        console.log("----------------------------");

        allSongData.push(songEntry);
    }
    console.log('\n--- Data Seeding Process Finished ---');
    console.log('Next step is finally here: Generate embeddings and save to MongoDB.');
}

main();