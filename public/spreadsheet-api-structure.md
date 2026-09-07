# Spreadsheet API Structure

Based on the frontend architecture of the Emaar Jewellers POS spreadsheet feature, you should implement a **REST API** with a standard list/detail pattern. This ensures that the main dashboard loads instantly (by only fetching lightweight metadata) and only fetches the heavy spreadsheet data when a specific file is opened.

Here is the exact API structure, URLs, and JSON objects you'll need.

---

## Base URL
`/api/workbooks` (or whatever prefix fits your backend, e.g., `/api/v1/workbooks`)

---

## 1. List Workbooks
**Endpoint:** `GET /api/workbooks`
**Purpose:** Fetches lightweight metadata for the dashboard list view. **Do not include the `sheets` array here** to keep the response fast.

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "wb_12345",
      "name": "October Sales",
      "sheetCount": 2,
      "createdAt": "2026-09-01T10:00:00.000Z",
      "updatedAt": "2026-09-01T10:15:00.000Z"
    },
    {
      "id": "wb_67890",
      "name": "Employee Shifts",
      "sheetCount": 1,
      "createdAt": "2026-08-25T14:30:00.000Z",
      "updatedAt": "2026-08-26T09:00:00.000Z"
    }
  ]
}
```

---

## 2. Get Single Workbook
**Endpoint:** `GET /api/workbooks/:id`
**Purpose:** Fetches the full spreadsheet including all cell data, columns, and sheet tabs when a user opens a file.

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "wb_12345",
    "name": "October Sales",
    "createdAt": "2026-09-01T10:00:00.000Z",
    "updatedAt": "2026-09-01T10:15:00.000Z",
    "sheets": [
      {
        "name": "Sheet1",
        "data": [
          ["Item", "Price", "Qty", "Total"],
          ["Gold Ring", 500, 2, "=B2*C2"],
          ["", "", "", ""]
        ],
        "columns": [
          { "title": "A", "width": 150 },
          { "title": "B", "width": 100 },
          { "title": "C", "width": 80 },
          { "title": "D", "width": 120 }
        ]
      }
    ]
  }
}
```

---

## 3. Create Workbook
**Endpoint:** `POST /api/workbooks`
**Purpose:** Creates a new empty workbook.

**Request Body:**
```json
{
  "name": "Untitled Workbook"
}
```

**Response:** `201 Created`
*(Should return the initialized workbook with one default blank sheet, matching the shape of the GET Single API)*
```json
{
  "status": "success",
  "data": {
    "id": "wb_99999",
    "name": "Untitled Workbook",
    "createdAt": "2026-09-01T10:20:00.000Z",
    "updatedAt": "2026-09-01T10:20:00.000Z",
    "sheets": [
      {
        "name": "Sheet1",
        "data": [
          ["", "", ""],
          ["", "", ""]
        ],
        "columns": [
          { "title": "A", "width": 120 },
          { "title": "B", "width": 120 },
          { "title": "C", "width": 120 }
        ]
      }
    ]
  }
}
```

---

## 4. Update Workbook (Auto-save & Rename)
**Endpoint:** `PATCH /api/workbooks/:id` (or `PUT`)
**Purpose:** Updates the workbook. This endpoint will be hit constantly by the frontend's debounced auto-save (saving cell data) AND when the user renames the file. 

**Request Body (When Auto-saving Data):**
```json
{
  "sheets": [
    {
      "name": "Sheet1",
      "data": [ ["Updated", "Data"] ],
      "columns": [ { "title": "A", "width": 120 } ]
    }
  ]
}
```

**Request Body (When Renaming):**
```json
{
  "name": "New Name for Workbook"
}
```

**Response:** `200 OK`
*(Returns the updated workbook object)*

---

## 5. Delete Workbook
**Endpoint:** `DELETE /api/workbooks/:id`
**Purpose:** Deletes a workbook.

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Workbook deleted successfully"
}
```

---

## Database Schema Recommendation
If you are using a SQL database (like PostgreSQL/MySQL), you can model it like this:

**Table:** `workbooks`
- `id` (Primary Key, String/UUID)
- `name` (String)
- `sheets` (JSON / JSONB)  <-- *Store the whole sheets array as JSON since it's unstructured spreadsheet data.*
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
