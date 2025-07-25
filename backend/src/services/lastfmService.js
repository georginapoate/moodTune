const axios = require('axios');

async function getLastFmData(artist, title) {
  const url = `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${process.env.LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&format=json`;
  
  try {
    const response = await axios.get(url);
    const track = response.data.track;

    if (!track || !track.toptags) {
        console.warn(`  > Warning: No Last.fm data found for ${artist} - ${title}`);
        return { tags: [], summary: '' };
    }

    const tags = track.toptags.tag.map(tag => tag.name);
    // Clean up the summary text from the wiki
    const summary = track.wiki ? track.wiki.summary.split('<a href=')[0].trim() : '';
    console.log(` > Retrieved the summary and tags for ${artist} - ${title} from Last.fm`);

    return { tags, summary };
  } catch (error) {
        console.error(`  > Error fetching Last.fm data for ${artist} - ${title}: ${error}.`);
        return { tags: [], summary: '' };
  }
}

async function findAlbumName(artist, title) {
    try {
        const url = `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${process.env.LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&format=json`;
        const response = await axios.get(url);
        if (response.data.track && response.data.track.album) {
            return response.data.track.album.title;
        }
        return null;
    } catch (error) {
        console.error(`  > Error fetching album name for ${artist} - ${title}: ${error.message}`);
        return null;
    }
}

module.exports = { getLastFmData, findAlbumName };