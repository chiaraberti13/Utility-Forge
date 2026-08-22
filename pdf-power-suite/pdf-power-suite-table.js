'use strict';

/*
 * PDF Power Suite — Table extraction feature.
 *
 * Heuristic, best-effort extraction of simple grid-like tables: pdf.js getTextContent() gives us
 * each text run with its (x, y) position in PDF page space. We cluster runs into rows by close
 * Y-coordinate (row tolerance, adjustable), then within each row split into columns wherever the
 * horizontal gap between consecutive runs exceeds a threshold (also adjustable). This is not a
 * table-recognition model — it has no idea what a table border looks like — so the two sliders
 * are there for the user to tune and re-run when the first pass doesn't line up.
 */

const tableState = { file: null, lastCsv: null };

function initTable() {
    PPS.setupDropzone('table-upload', 'table-file-input', (files) => {
        PPS.hideAlerts('table');
        const file = files[0];
        if (!PPS.isPdfFile(file)) { PPS.showAlert('table', 'error', `"${file.name}" is not a PDF.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('table', 'error', err.message); return; }
        tableState.file = file;
        const list = document.getElementById('table-file-list');
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, {
            onRemove: () => { tableState.file = null; list.textContent = ''; document.getElementById('table-run-btn').disabled = true; },
        }));
        if (window.lucide) lucide.createIcons();
        document.getElementById('table-run-btn').disabled = false;
        document.getElementById('table-download-btn').style.display = 'none';
        document.getElementById('table-results').textContent = '';
    });

    const bindRange = (id, valueId) => {
        const el = document.getElementById(id);
        const val = document.getElementById(valueId);
        el.addEventListener('input', () => { val.textContent = el.value; });
    };
    bindRange('table-row-tol', 'table-row-tol-value');
    bindRange('table-col-gap', 'table-col-gap-value');

    document.getElementById('table-run-btn').addEventListener('click', runTableExtract);
    document.getElementById('table-download-btn').addEventListener('click', () => {
        if (!tableState.lastCsv) return;
        const blob = new Blob(['﻿' + tableState.lastCsv], { type: 'text/csv;charset=utf-8' });
        PPS.downloadBlob(blob, PPS.withExtension((tableState.file ? tableState.file.name.replace(/\.pdf$/i, '') : 'table'), 'csv'));
    });
}

function csvEscapeCell(v) {
    const s = String(v == null ? '' : v);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

function rowsToCsv(grid) {
    return grid.map((row) => row.map(csvEscapeCell).join(',')).join('\r\n');
}

// Clusters a page's text runs into rows (by Y) then columns (by X gap), per the algorithm
// described at the top of this file.
async function extractPageGrid(pdfDoc, pageNum, rowTol, colGap) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items
        .filter((it) => it.str && it.str.trim() !== '')
        .map((it) => ({
            text: it.str,
            x: it.transform[4],
            y: it.transform[5],
            width: it.width || Math.max(4, it.str.length * (it.height || 8) * 0.5),
        }));

    items.sort((a, b) => (b.y - a.y) || (a.x - b.x));

    const rows = [];
    let currentRow = null;
    let currentRowY = null;
    for (const item of items) {
        if (currentRow === null || Math.abs(item.y - currentRowY) > rowTol) {
            currentRow = [];
            rows.push(currentRow);
            currentRowY = item.y;
        }
        currentRow.push(item);
    }

    return rows.map((row) => {
        row.sort((a, b) => a.x - b.x);
        const cells = [];
        let cellText = '';
        let prevEndX = null;
        for (const item of row) {
            if (prevEndX !== null && (item.x - prevEndX) > colGap) {
                cells.push(cellText.trim());
                cellText = '';
            }
            cellText += (cellText ? ' ' : '') + item.text;
            prevEndX = item.x + item.width;
        }
        if (cellText) cells.push(cellText.trim());
        return cells;
    }).filter((row) => row.length > 0);
}

function renderTablePreview(container, pageNum, grid) {
    const head = document.createElement('div');
    head.className = 'diff-page-head';
    head.style.marginTop = '16px';
    head.style.borderRadius = '8px 8px 0 0';
    head.style.border = '1px solid #e5e5e5';
    head.textContent = `Page ${pageNum} — ${grid.length} row(s) detected`;
    container.appendChild(head);

    const scroll = document.createElement('div');
    scroll.className = 'table-scroll';
    scroll.style.marginTop = '0';
    scroll.style.borderRadius = '0 0 8px 8px';

    const table = document.createElement('table');
    table.className = 'data-table';
    const tbody = document.createElement('tbody');
    const maxCols = grid.reduce((m, r) => Math.max(m, r.length), 0);

    grid.slice(0, 500).forEach((row) => {
        const tr = document.createElement('tr');
        for (let c = 0; c < maxCols; c++) {
            const td = document.createElement('td');
            td.textContent = row[c] != null ? row[c] : '';
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);

    if (grid.length > 500) {
        const note = document.createElement('div');
        note.className = 'field-hint';
        note.style.marginTop = '6px';
        note.textContent = `Preview truncated to 500 of ${grid.length} rows; the full result is still included in the CSV download.`;
        container.appendChild(note);
    }
}

async function runTableExtract() {
    if (!tableState.file) return;
    const btn = document.getElementById('table-run-btn');
    btn.disabled = true;
    PPS.hideAlerts('table');
    const results = document.getElementById('table-results');
    results.textContent = '';
    document.getElementById('table-download-btn').style.display = 'none';
    try {
        const bytes = await PPS.readFileAsArrayBuffer(tableState.file);
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        PPS.checkPageCount(pdf.numPages, 'document');

        const rangeInput = document.getElementById('table-page-range').value.trim();
        let pageNums;
        if (!rangeInput) {
            pageNums = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
        } else {
            const groups = PPS.parsePageRanges(rangeInput, pdf.numPages);
            const set = new Set();
            groups.forEach((g) => { for (let p = g.start; p <= g.end; p++) set.add(p); });
            pageNums = Array.from(set).sort((a, b) => a - b);
        }

        const rowTol = parseFloat(document.getElementById('table-row-tol').value);
        const colGap = parseFloat(document.getElementById('table-col-gap').value);

        const csvBlocks = [];
        for (let i = 0; i < pageNums.length; i++) {
            const pageNum = pageNums[i];
            const grid = await extractPageGrid(pdf, pageNum, rowTol, colGap);
            csvBlocks.push({ pageNum, grid });
            renderTablePreview(results, pageNum, grid);
            await PPS.tick();
        }

        tableState.lastCsv = csvBlocks.length === 1
            ? rowsToCsv(csvBlocks[0].grid)
            : csvBlocks.map((b) => `Page ${b.pageNum}\r\n` + rowsToCsv(b.grid)).join('\r\n\r\n');

        document.getElementById('table-download-btn').style.display = 'inline-flex';
        if (window.lucide) lucide.createIcons();
        PPS.showAlert('table', 'success', `Extracted ${pageNums.length} page(s). Adjust the sliders and re-run if rows/columns look wrong.`);
    } catch (err) {
        PPS.showAlert('table', 'error', err.message);
    } finally {
        btn.disabled = !tableState.file;
    }
}

document.addEventListener('DOMContentLoaded', initTable);
