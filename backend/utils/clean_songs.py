import json

def deduplicate_songs(input_file_path, output_file_path):
    try:
        with open(input_file_path, 'r', encoding='utf-8') as f:
            songs = json.load(f)
        print(f"Successfully read {len(songs)} songs from '{input_file_path}'.")
    except FileNotFoundError:
        print(f"Error: The file '{input_file_path}' was not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: The file '{input_file_path}' is not a valid JSON file.")
        return

    unique_songs = []
    seen_songs = set()
    duplicate_count = 0

    for song in songs:
        if 'artist' not in song or 'title' not in song:
            print(f"Skipping an item because it's missing 'artist' or 'title': {song}")
            continue

        identifier = (song['artist'].lower(), song['title'].lower())

        if identifier not in seen_songs:
            seen_songs.add(identifier)
            unique_songs.append(song)
        else:
            duplicate_count += 1
            print(f"  - Found duplicate: {song['artist']} - {song['title']}")

    print(f"\nDe-duplication complete.")
    print(f"  - Original songs: {len(songs)}")
    print(f"  - Duplicates found: {duplicate_count}")
    print(f"  - Unique songs: {len(unique_songs)}")

    try:
        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(unique_songs, f, indent=2, ensure_ascii=False)
        print(f"\nSuccessfully wrote {len(unique_songs)} unique songs to '{output_file_path}'.")
    except IOError as e:
        print(f"Error writing to file '{output_file_path}': {e}")


if __name__ == "__main__":
    input_filename = "SEED_SONGS.json"
    output_filename = "SEED_SONGS_CLEANED.json" 

    deduplicate_songs(input_filename, output_filename)