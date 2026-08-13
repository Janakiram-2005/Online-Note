import { NoteDocument, WorkspaceMetadata } from '../types';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveWorkspaceConfig {
  rootFolderId: string;
  docsFolderId: string;
  metadataFileId?: string;
}

/**
 * Ensures 'MyNotes' root folder and 'Documents' subfolder exist in Google Drive.
 */
export async function initDriveWorkspace(accessToken: string): Promise<DriveWorkspaceConfig> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1. Search for root folder 'MyNotes'
  const rootQuery = encodeURIComponent(
    "name = 'MyNotes' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
  );
  const rootRes = await fetch(`${DRIVE_API_BASE}/files?q=${rootQuery}&fields=files(id,name)`, { headers });
  if (!rootRes.ok) {
    throw new Error(`Failed to query Google Drive: ${rootRes.statusText}`);
  }
  const rootData = await rootRes.json();

  let rootFolderId = '';
  if (rootData.files && rootData.files.length > 0) {
    rootFolderId = rootData.files[0].id;
  } else {
    // Create 'MyNotes' root folder
    const createRootRes = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'MyNotes',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    const createdRoot = await createRootRes.json();
    rootFolderId = createdRoot.id;
  }

  // 2. Search for 'Documents' inside 'MyNotes'
  const docsQuery = encodeURIComponent(
    `'${rootFolderId}' in parents and name = 'Documents' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const docsRes = await fetch(`${DRIVE_API_BASE}/files?q=${docsQuery}&fields=files(id,name)`, { headers });
  const docsData = await docsRes.json();

  let docsFolderId = '';
  if (docsData.files && docsData.files.length > 0) {
    docsFolderId = docsData.files[0].id;
  } else {
    // Create 'Documents' folder
    const createDocsRes = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Documents',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
      }),
    });
    const createdDocs = await createDocsRes.json();
    docsFolderId = createdDocs.id;
  }

  // 3. Search for 'app-metadata.json' inside 'MyNotes'
  const metaQuery = encodeURIComponent(
    `'${rootFolderId}' in parents and name = 'app-metadata.json' and trashed = false`
  );
  const metaRes = await fetch(`${DRIVE_API_BASE}/files?q=${metaQuery}&fields=files(id,name)`, { headers });
  const metaData = await metaRes.json();

  let metadataFileId = '';
  if (metaData.files && metaData.files.length > 0) {
    metadataFileId = metaData.files[0].id;
  } else {
    // Create empty app-metadata.json
    const initialMeta: WorkspaceMetadata = {
      favorites: [],
      recentDocs: [],
      folders: [],
      autoSaveInterval: 1500,
      theme: 'system',
      pinConfigured: true,
      driveConnected: true,
    };
    metadataFileId = await createOrUpdateJsonFile(
      accessToken,
      'app-metadata.json',
      initialMeta,
      [rootFolderId]
    );
  }

  return { rootFolderId, docsFolderId, metadataFileId };
}

/**
 * Saves a document to Google Drive inside the Documents folder.
 */
export async function saveDocToDrive(
  accessToken: string,
  doc: NoteDocument,
  docsFolderId: string
): Promise<string> {
  const fileName = `${doc.id}.json`;
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Search if file already exists in docsFolderId
  let existingFileId = doc.driveFileId;
  if (!existingFileId) {
    const q = encodeURIComponent(
      `'${docsFolderId}' in parents and name = '${fileName}' and trashed = false`
    );
    const searchRes = await fetch(`${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name)`, { headers });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        existingFileId = searchData.files[0].id;
      }
    }
  }

  if (existingFileId) {
    // Update existing file content
    const updateRes = await fetch(`${UPLOAD_API_BASE}/files/${existingFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doc),
    });
    if (!updateRes.ok) {
      throw new Error(`Failed to update doc in Drive: ${updateRes.statusText}`);
    }
    return existingFileId;
  } else {
    // Create new file via multipart upload
    return await createMultipartJsonFile(accessToken, fileName, doc, [docsFolderId]);
  }
}

/**
 * Loads all documents from Google Drive Documents folder.
 */
export async function loadDocsFromDrive(
  accessToken: string,
  docsFolderId: string
): Promise<NoteDocument[]> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const q = encodeURIComponent(
    `'${docsFolderId}' in parents and name contains '.json' and trashed = false`
  );
  const listRes = await fetch(`${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name,modifiedTime)`, {
    headers,
  });

  if (!listRes.ok) {
    throw new Error(`Failed to list documents in Drive: ${listRes.statusText}`);
  }

  const listData = await listRes.json();
  const files = listData.files || [];

  const docs: NoteDocument[] = [];
  for (const file of files) {
    try {
      const fileRes = await fetch(`${DRIVE_API_BASE}/files/${file.id}?alt=media`, { headers });
      if (fileRes.ok) {
        const doc: NoteDocument = await fileRes.json();
        doc.driveFileId = file.id;
        docs.push(doc);
      }
    } catch (e) {
      console.warn(`Failed to parse Drive file ${file.name}:`, e);
    }
  }

  return docs;
}

/**
 * Trashes a document file in Google Drive.
 */
export async function trashDocInDrive(accessToken: string, driveFileId: string): Promise<void> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${DRIVE_API_BASE}/files/${driveFileId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ trashed: true }),
  });
  if (!res.ok) {
    throw new Error(`Failed to trash file in Drive: ${res.statusText}`);
  }
}

/**
 * Restores a document file from Drive trash.
 */
export async function restoreDocInDrive(accessToken: string, driveFileId: string): Promise<void> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${DRIVE_API_BASE}/files/${driveFileId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ trashed: false }),
  });
  if (!res.ok) {
    throw new Error(`Failed to restore file in Drive: ${res.statusText}`);
  }
}

/**
 * Helper: Create multipart JSON file in Drive.
 */
async function createMultipartJsonFile(
  accessToken: string,
  fileName: string,
  content: any,
  parents: string[]
): Promise<string> {
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents,
  };

  const boundary = 'foo_bar_baz_mynotes_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(content) +
    closeDelimiter;

  const res = await fetch(`${UPLOAD_API_BASE}/files?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Failed to create file in Drive: ${res.statusText}`);
  }

  const data = await res.json();
  return data.id;
}

/**
 * Helper: Create or update JSON file
 */
async function createOrUpdateJsonFile(
  accessToken: string,
  fileName: string,
  content: any,
  parents: string[],
  existingFileId?: string
): Promise<string> {
  if (existingFileId) {
    await fetch(`${UPLOAD_API_BASE}/files/${existingFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    });
    return existingFileId;
  } else {
    return createMultipartJsonFile(accessToken, fileName, content, parents);
  }
}
