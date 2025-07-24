const { OpenAI } = require("openai/client.js");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
  timeout: 10000, // Optional: Set a timeout for requests
});


async function getSongsRecommendations(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: 'system',
        content: `You are a music recommendation expert. Your task is to generate a list of 15 songs based on the user's prompt. You must consider the vibe, mood, genre, and lyrical themes implied by the prompt.

        You MUST respond with ONLY a valid JSON array of objects. Each object in the array represents a song and must have two keys: "artist" and "title".

        Do not include any introductory text, explanations, or markdown code fences like \`\`\`json. Your response must be the raw JSON array and nothing else.

        Example response format:
        [
          { "artist": "Artist Name", "title": "Song Title" },
          { "artist": "Another Artist", "title": "Another Song" }
        ]`
      },
      {
        role: 'user',
        content: prompt
      },
    ],
    // response_format: { type: "json_object" },
  });

  const choice = completion.choices[0]?.message?.content;
  const responseContent = choice || "";

  try {
    const parsedJson = JSON.parse(responseContent);
    const key = Object.keys(parsedJson).find(k => Array.isArray(parsedJson[k]));
        if (key) {
          return parsedJson[key];
        }
        // If the root is the array itself
        if (Array.isArray(parsedJson)) {
            return parsedJson;
        }

        throw new Error("JSON response from OpenAI is not a valid song array.");
  }
  catch (error) {
    console.error("Error parsing JSON response:", error);
    console.error("Raw OpenAI response:", responseContent);
    return [];
  }
}

module.exports = { getSongsRecommendations };