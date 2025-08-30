# povTunes 🎵

A full-stack web application that generates a custom Spotify playlist based on a creative text prompt, like "a rainy afternoon in a cozy coffee shop."

## Tech Stack

*   **Frontend:** React
*   **Backend:** Node.js, Express.js
*   **APIs:**
    *   OpenAI API (GPT-3.5-Turbo) for song suggestion
    *   Spotify Web API for authentication and playlist creation

---

## How It Works

1.  User authenticates with their Spotify account via OAuth 2.0.
2.  User submits a text prompt from the React frontend.
3.  The Node.js backend sends the prompt to the OpenAI API to generate a list of suitable songs (artist and title).
4.  The backend searches for each of these songs on Spotify to find their unique Track IDs.
5.  The backend creates a new, private Spotify playlist for the user and adds all the found tracks.
6.  The URL for the new playlist is returned to the frontend for the user to enjoy.

---

## Setup and Installation

### Prerequisites

*   Node.js and npm (or yarn)
*   Git
*   API keys for OpenAI and Spotify Developer

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd moodtunes
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` directory and add your secret keys:
    ```
    PORT=5001
    OPENAI_API_KEY="your_openai_key"
    SPOTIFY_CLIENT_ID="your_spotify_client_id"
    SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
    SPOTIFY_CALLBACK_URL="http://localhost:5001/api/auth/callback"
    ```

3.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

You will need two separate terminal windows.

1.  **Run the Backend Server:**
    ```bash
    # In terminal 1, from the /backend directory
    npm run dev
    ```

2.  **Run the Frontend App:**
    ```bash
    # In terminal 2, from the /frontend directory
    npm start
    ```

The application will be available at `http://localhost:3000`.