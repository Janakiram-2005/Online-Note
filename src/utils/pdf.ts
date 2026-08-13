import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { NoteDocument } from '../types';

/**
 * Generates and downloads a clean PDF document for a NoteDocument.
 */
export async function exportDocumentToPdf(doc: NoteDocument): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.padding = '40px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1c1917';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Title section
  const headerHtml = `
    <div style="margin-bottom: 24px; border-bottom: 2px solid #e7e5e4; padding-bottom: 16px;">
      <div style="font-size: 36px; margin-bottom: 8px;">${doc.icon || '📝'}</div>
      <h1 style="font-size: 28px; font-weight: 800; margin: 0; color: #1c1917;">${doc.title || 'Untitled Document'}</h1>
      <div style="font-size: 11px; color: #78716c; margin-top: 6px;">Updated on ${new Date(doc.updatedAt).toLocaleDateString(undefined, {
        dateStyle: 'medium',
      })} • Created with MyNotes</div>
    </div>
  `;

  // Blocks HTML
  let blocksHtml = '<div style="display: flex; flex-direction: column; gap: 12px;">';

  for (const block of doc.blocks) {
    if (block.type === 'heading1') {
      blocksHtml += `<h2 style="font-size: 22px; font-weight: 700; margin-top: 16px; margin-bottom: 4px; color: #1c1917;">${escapeHtml(block.content)}</h2>`;
    } else if (block.type === 'heading2') {
      blocksHtml += `<h3 style="font-size: 18px; font-weight: 600; margin-top: 12px; margin-bottom: 4px; color: #292524;">${escapeHtml(block.content)}</h3>`;
    } else if (block.type === 'heading3') {
      blocksHtml += `<h4 style="font-size: 15px; font-weight: 600; margin-top: 8px; margin-bottom: 2px; color: #44403c;">${escapeHtml(block.content)}</h4>`;
    } else if (block.type === 'todo') {
      const checked = block.checked ? '☑' : '☐';
      const textStyle = block.checked ? 'text-decoration: line-through; color: #a8a29e;' : 'color: #1c1917;';
      blocksHtml += `<div style="font-size: 14px; margin: 2px 0; ${textStyle}"><span style="margin-right: 8px; font-size: 16px;">${checked}</span>${escapeHtml(block.content)}</div>`;
    } else if (block.type === 'bullet') {
      blocksHtml += `<div style="font-size: 14px; margin: 2px 0; padding-left: 16px; color: #1c1917;">• ${escapeHtml(block.content)}</div>`;
    } else if (block.type === 'numbered') {
      blocksHtml += `<div style="font-size: 14px; margin: 2px 0; padding-left: 16px; color: #1c1917;">1. ${escapeHtml(block.content)}</div>`;
    } else if (block.type === 'quote') {
      blocksHtml += `<blockquote style="font-size: 14px; italic; border-left: 3px solid #5A5A40; margin: 8px 0; padding-left: 12px; color: #44403c; background: #f5f5f4; padding-top: 8px; padding-bottom: 8px; border-radius: 4px;">"${escapeHtml(block.content)}"</blockquote>`;
    } else if (block.type === 'code') {
      blocksHtml += `<pre style="font-family: monospace; font-size: 12px; background: #1c1917; color: #f5f5f4; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 8px 0;"><code>${escapeHtml(block.content)}</code></pre>`;
    } else if (block.type === 'divider') {
      blocksHtml += `<hr style="border: none; border-top: 1px solid #e7e5e4; margin: 16px 0;" />`;
    } else if (block.type === 'callout') {
      blocksHtml += `
        <div style="background: #f5f5f0; border: 1px solid #e7e5df; border-radius: 8px; padding: 12px; display: flex; gap: 10px; align-items: flex-start; margin: 8px 0;">
          <span style="font-size: 18px;">${block.calloutIcon || '💡'}</span>
          <div style="font-size: 14px; color: #1c1917; line-height: 1.5;">${escapeHtml(block.content)}</div>
        </div>
      `;
    } else if (block.type === 'image' && block.imageUrl) {
      blocksHtml += `
        <div style="margin: 12px 0; text-align: center;">
          <img src="${block.imageUrl}" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #e7e5e4;" />
          ${block.caption ? `<div style="font-size: 12px; color: #78716c; margin-top: 4px; font-style: italic;">${escapeHtml(block.caption)}</div>` : ''}
        </div>
      `;
    } else if (block.type === 'table' && block.tableData) {
      let tableRows = '';
      block.tableData.forEach((row, rowIndex) => {
        tableRows += '<tr>';
        row.forEach((cell) => {
          const isHeader = rowIndex === 0;
          const cellTag = isHeader ? 'th' : 'td';
          const bg = isHeader ? '#f5f5f4' : '#ffffff';
          tableRows += `<${cellTag} style="border: 1px solid #d6d3d1; padding: 8px 12px; text-align: left; background-color: ${bg}; font-size: 13px; font-weight: ${isHeader ? '600' : '400'};">${escapeHtml(cell)}</${cellTag}>`;
        });
        tableRows += '</tr>';
      });
      blocksHtml += `
        <div style="margin: 12px 0; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #d6d3d1;">
            ${tableRows}
          </table>
        </div>
      `;
    } else {
      // Paragraph
      blocksHtml += `<p style="font-size: 14px; line-height: 1.6; margin: 4px 0; color: #1c1917; white-space: pre-wrap;">${escapeHtml(block.content)}</p>`;
    }
  }

  blocksHtml += '</div>';

  container.innerHTML = headerHtml + blocksHtml;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width mm
    const pageHeight = 297; // A4 height mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeFilename = (doc.title || 'Note').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    pdf.save(`${safeFilename}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    // Fallback: standard browser print window
    window.print();
  } finally {
    document.body.removeChild(container);
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
