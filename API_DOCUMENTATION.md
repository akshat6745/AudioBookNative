# Novel Reader API Documentation

## Base URL
```
http://localhost:8000
```

## Endpoints

### 1. Novel Management

#### 1.1 Get All Novels
```
GET /novels
```
Returns a list of all available novels from both Google Doc and uploaded EPUBs.

Response format:
```json
[
  {
    "id": null,
    "title": "novel-name",
    "author": null,
    "chapterCount": null,
    "source": "google_doc"
  },
  {
    "id": "firebase-doc-id",
    "title": "Novel Title",
    "author": "Author Name",
    "chapterCount": 85,
    "source": "epub_upload"
  }
]
```

#### 1.2 Upload EPUB Novel
```
POST /upload-epub
Content-Type: multipart/form-data
```
Upload and parse an EPUB file for storage in the database.

Request:
- Form data with key "file" containing the EPUB file

Response:
```json
{
  "title": "Novel Title",
  "author": "Author Name",
  "chapterCount": 85,
  "message": "Novel successfully uploaded and stored"
}
```

### 2. Chapter Management

#### 2.1 Get Chapters List
```
GET /chapters-with-pages/{novel_name}?page={page_number}
```
Get a paginated list of chapters for a novel. Works for both Google Doc novels and uploaded EPUBs.

Parameters:
- novel_name: The title of the novel (URL encoded)
- page: Page number (optional, defaults to 1)

Response for web novels:
```json
{
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Chapter 1",
      "link": "https://novelfire.net/..."
    }
  ],
  "total_pages": 10,
  "current_page": 1
}
```

Response for EPUB novels:
```json
{
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Chapter 1",
      "id": "1"
    }
  ],
  "total_pages": 2,
  "current_page": 1
}
```

#### 2.2 Get Chapter Content
```
GET /chapter?chapterNumber={number}&novelName={name}
```
Get the content of a specific chapter. Works for both Google Doc novels and uploaded EPUBs.

Parameters:
- chapterNumber: The chapter number
- novelName: The title of the novel (URL encoded)

Response:
```json
{
  "content": [
    "Paragraph 1",
    "Paragraph 2",
    "..."
  ]
}
```

### 3. Text-to-Speech

#### 3.1 Convert Text to Speech
```
POST /tts
```
Convert text to speech using Edge TTS.

Request:
```json
{
  "text": "Text to convert to speech",
  "voice": "en-US-ChristopherNeural"
}
```

Response:
- Audio file (audio/mp3)

### 4. User Management

#### 4.1 User Login
```
POST /userLogin
```
Login with username and password.

Request:
```json
{
  "username": "user",
  "password": "pass"
}
```

Response:
```json
{
  "status": "success",
  "message": "Login successful"
}
```

#### 4.2 User Registration
```
POST /register
```
Register a new user.

Request:
```json
{
  "username": "user",
  "password": "pass"
}
```

Response:
```json
{
  "status": "success",
  "message": "User registered successfully"
}
```

#### 4.3 Save Reading Progress
```
POST /user/progress
```
Save user's reading progress for a novel.

Request:
```json
{
  "username": "user",
  "novelName": "novel-title",
  "lastChapterRead": 10,
  "lastParagraphRead": 5  // Optional - tracks position within chapter
}
```

Response:
```json
{
  "status": "success",
  "message": "Progress saved"
}
```

#### 4.4 Get User Progress
```
GET /user/progress?username={username}
```
Get all reading progress for a user.

Response:
```json
{
  "progress": [
    {
      "novelName": "novel-title",
      "lastChapterRead": 10,
      "lastParagraphRead": 5  // Optional
    }
  ]
}
```

#### 4.5 Get Novel Progress
```
GET /user/progress/{novelName}?username={username}
```
Get user's reading progress for a specific novel.

Response:
```json
{
  "novelName": "novel-title",
  "lastChapterRead": 10
}
```

## Data Structures

### Novel Types
1. Google Doc Novels:
   - Sourced from a Google Document
   - Content fetched from novelfire.net
   - Minimal metadata

2. EPUB Novels:
   - Uploaded through the /upload-epub endpoint
   - Content stored in Firestore
   - Full metadata including author and chapter count

### Database Structure (Firestore)
```
novels/
  {novel_id}/
    title: string
    author: string
    chapterCount: number
    source: "epub_upload"
    id: string
    chapters/
      {chapter_number}/
        chapterNumber: number
        chapterTitle: string
        content: string[]
        id: string

users/
  {user_id}/
    username: string
    password: string
    progress: [
      {
        novelName: string
        lastChapterRead: number
        lastParagraphRead?: number  // Optional
      }
    ]
```

## Changes from Previous Version

1. Added EPUB upload and parsing functionality
2. Integrated Firestore storage for EPUB novels
3. Unified chapter fetching interface for both novel sources
4. Added novel metadata support (author, chapter count)
5. Improved chapter content storage and retrieval
6. Added source tracking for novels

## Frontend Considerations

1. Novel List:
   - Display novels from both sources
   - Show additional metadata for EPUB novels
   - Implement upload functionality for EPUB files

2. Chapter List:
   - Handle both link-based and stored chapters
   - Implement pagination for both sources
   - Display chapter numbers and titles consistently

3. Chapter Reading:
   - Unified display for both content sources
   - Preserve paragraph structure
   - Integrate TTS functionality

4. User Features:
   - Reading progress tracking
   - Login/Registration
   - Progress synchronization
