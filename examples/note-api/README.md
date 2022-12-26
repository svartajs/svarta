# Note taking API example

## Routes

### GET /api/note - Lists all notes

### GET /api/note/[id] - Gets a note

### POST /api/note/[id] - Creates a note, request body should be { text: string }

Example request body:
```json
{ 
  "text": "string"
}
```

### DELETE /api/note/[id] - Deletes a note

