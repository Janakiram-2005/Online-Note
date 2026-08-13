import { NoteDocument, NoteBlock } from '../types';

/**
 * Converts a NoteDocument to a Markdown string.
 */
export function exportDocumentToMarkdown(doc: NoteDocument): string {
  let md = `# ${doc.icon ? doc.icon + ' ' : ''}${doc.title || 'Untitled Document'}\n\n`;

  for (const block of doc.blocks) {
    if (block.type === 'heading1') {
      md += `# ${block.content}\n\n`;
    } else if (block.type === 'heading2') {
      md += `## ${block.content}\n\n`;
    } else if (block.type === 'heading3') {
      md += `### ${block.content}\n\n`;
    } else if (block.type === 'bullet') {
      md += `- ${block.content}\n`;
    } else if (block.type === 'numbered') {
      md += `1. ${block.content}\n`;
    } else if (block.type === 'todo') {
      md += `- [${block.checked ? 'x' : ' '}] ${block.content}\n`;
    } else if (block.type === 'quote') {
      md += `> ${block.content}\n\n`;
    } else if (block.type === 'code') {
      md += `\`\`\`${block.language || ''}\n${block.content}\n\`\`\`\n\n`;
    } else if (block.type === 'divider') {
      md += `---\n\n`;
    } else if (block.type === 'callout') {
      md += `> ${block.calloutIcon || '💡'} ${block.content}\n\n`;
    } else if (block.type === 'image' && block.imageUrl) {
      md += `![${block.caption || 'image'}](${block.imageUrl})\n\n`;
    } else if (block.type === 'table' && block.tableData) {
      block.tableData.forEach((row, i) => {
        md += `| ${row.join(' | ')} |\n`;
        if (i === 0) {
          md += `| ${row.map(() => '---').join(' | ')} |\n`;
        }
      });
      md += `\n`;
    } else {
      md += `${block.content}\n\n`;
    }
  }

  return md;
}

/**
 * Parses raw Markdown content into NoteBlocks.
 */
export function parseMarkdownToBlocks(markdownText: string): NoteBlock[] {
  const lines = markdownText.split('\n');
  const blocks: NoteBlock[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLang = '';

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        blocks.push({
          id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          type: 'code',
          content: codeContent.join('\n'),
          language: codeLang,
        });
        codeContent = [];
        inCodeBlock = false;
      } else {
        // Open code block
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }

    if (!trimmed) return;

    if (trimmed.startsWith('# ')) {
      blocks.push({
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        type: 'heading1',
        content: trimmed.slice(2),
      });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        type: 'heading2',
        content: trimmed.slice(3),
      });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        type: 'heading3',
        content: trimmed.slice(4),
      });
    } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('* [ ] ')) {
      blocks.push({
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        type: 'todo',
        content: trimmed.slice(6),
        checked: false,
      });
    } else if (trimmed.startsWith('- [x] ') || trimmed.startsWith('* [x] ')) {
      blocks.push({
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        type: 'todo',
        content: trimmed.slice(6),
        checked: true,
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        type: 'bullet',
        content: trimmed.slice(2),
      });
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        type: 'numbered',
        content: trimmed.replace(/^\d+\.\s/, ''),
      });
    } else if (trimmed.startsWith('> ')) {
      blocks.push({
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        type: 'quote',
        content: trimmed.slice(2),
      });
    } else if (trimmed === '---' || trimmed === '***') {
      blocks.push({
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        type: 'divider',
        content: '',
      });
    } else {
      blocks.push({
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        type: 'paragraph',
        content: line,
      });
    }
  });

  if (blocks.length === 0) {
    blocks.push({
      id: 'block-' + Date.now(),
      type: 'paragraph',
      content: '',
    });
  }

  return blocks;
}
