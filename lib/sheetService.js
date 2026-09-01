/**
 * Sheet Service — Data abstraction layer for spreadsheet workbooks.
 *
 * Currently backed by localStorage. All methods return Promises so that
 * swapping to a REST API later only requires changing this file.
 *
 * Workbook shape:
 * {
 *   id: string,
 *   name: string,
 *   sheets: [{ name: string, data: any[][], columns: object[] }],
 *   createdAt: string (ISO),
 *   updatedAt: string (ISO),
 * }
 */

const STORAGE_KEY = 'emaar_workbooks';

function generateId() {
  return 'wb_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(workbooks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workbooks));
}

/**
 * List all workbooks (metadata only — no sheet data).
 * @returns {Promise<Array<{id, name, sheetCount, createdAt, updatedAt}>>}
 */
export async function listWorkbooks() {
  const all = readAll();
  return Object.values(all)
    .map(({ id, name, sheets, createdAt, updatedAt }) => ({
      id,
      name,
      sheetCount: sheets?.length ?? 0,
      createdAt,
      updatedAt,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

/**
 * Get a single workbook with all sheet data.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getWorkbook(id) {
  const all = readAll();
  return all[id] ?? null;
}

/**
 * Create a new workbook with one blank sheet.
 * @param {string} name
 * @returns {Promise<object>} The created workbook.
 */
export async function createWorkbook(name) {
  const all = readAll();
  const id = generateId();
  const now = new Date().toISOString();

  const workbook = {
    id,
    name: name || 'Untitled Workbook',
    sheets: [
      {
        name: 'Sheet1',
        data: Array.from({ length: 50 }, () => Array(26).fill('')),
        columns: Array.from({ length: 26 }, (_, i) => ({
          title: String.fromCharCode(65 + i),
          width: 120,
        })),
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  all[id] = workbook;
  writeAll(all);
  return workbook;
}

/**
 * Update a workbook's sheet data.
 * @param {string} id
 * @param {object} data — Partial workbook fields to merge (e.g. { sheets }).
 * @returns {Promise<object>} The updated workbook.
 */
export async function updateWorkbook(id, data) {
  const all = readAll();
  if (!all[id]) throw new Error(`Workbook ${id} not found`);

  all[id] = {
    ...all[id],
    ...data,
    id, // prevent id overwrite
    updatedAt: new Date().toISOString(),
  };

  writeAll(all);
  return all[id];
}

/**
 * Rename a workbook.
 * @param {string} id
 * @param {string} name
 * @returns {Promise<object>}
 */
export async function renameWorkbook(id, name) {
  return updateWorkbook(id, { name });
}

/**
 * Delete a workbook.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteWorkbook(id) {
  const all = readAll();
  delete all[id];
  writeAll(all);
}
