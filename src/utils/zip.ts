import JSZip from 'jszip';
import { NoteDocument, NoteFolder } from '../types';
import { exportDocumentToMarkdown } from './markdown';

export const exportFolderToZip = async (folder: NoteFolder, documents: NoteDocument[]) => {
  const zip = new JSZip();
  const folderDocs = documents.filter((d) => d.folderId === folder.id && !d.isTrashed);

  if (folderDocs.length === 0) {
    alert('Folder is empty. Nothing to zip.');
    return;
  }

  const folderObj = zip.folder(folder.name.replace(/[^a-z0-9_-]/gi, '_'));

  if (!folderObj) return;

  folderDocs.forEach((doc) => {
    const md = exportDocumentToMarkdown(doc);
    const fileName = `${(doc.title || 'Untitled').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()}.md`;
    folderObj.file(fileName, md);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folder.name.replace(/[^a-z0-9_-]/gi, '_')}.zip`;
  a.click();
  URL.revokeObjectURL(url);
};
