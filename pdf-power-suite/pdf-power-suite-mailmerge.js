'use strict';

/*
 * PDF Power Suite — Mail Merge feature.
 *
 * Takes one AcroForm PDF and one CSV/XLSX data file where each row becomes one output document.
 * CSV/XLSX column headers are matched to PDF form field names case-insensitively. For every row,
 * a fresh copy of the source PDF is loaded and pdfDoc.getForm().getTextField(name).setText(value)
 * is called for each matched field; fields that exist on one side but not the other are skipped
 * and reported, never thrown as a hard error, so one bad row/column doesn't stop the whole run.
 * All generated PDFs are zipped with JSZip for a single download.
 */

const mmState = { pdfFile: null, dataFile: null, formFieldNames: [], rows: null, dataColumns: [] };

function initMailMerge() {
    PPS.setupDropzone('mm-upload-pdf', 'mm-file-input-pdf', async (files) => {
        PPS.hideAlerts('mm');
        const file = files[0];
        if (!PPS.isPdfFile(file)) { PPS.showAlert('mm', 'error', `"${file.name}" is not a PDF.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('mm', 'error', err.message); return; }
        mmState.pdfFile = file;
        const list = document.getElementById('mm-file-list-pdf');
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, {
            onRemove: () => { mmState.pdfFile = null; mmState.formFieldNames = []; list.textContent = ''; renderFieldReport(); updateMmButton(); },
        }));
        if (window.lucide) lucide.createIcons();

        try {
            const bytes = await PPS.readFileAsArrayBuffer(file);
            const pdfDoc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
            const form = pdfDoc.getForm();
            mmState.formFieldNames = form.getFields().map((f) => f.getName());
            if (mmState.formFieldNames.length === 0) {
                PPS.showAlert('mm', 'error', 'This PDF has no AcroForm fields to fill.');
            }
        } catch (err) {
            mmState.formFieldNames = [];
            PPS.showAlert('mm', 'error', `Could not read form fields: ${err.message}`);
        }
        renderFieldReport();
        updateMmButton();
    });

    PPS.setupDropzone('mm-upload-data', 'mm-file-input-data', async (files) => {
        PPS.hideAlerts('mm');
        const file = files[0];
        if (!/\.(csv|xlsx|xls)$/i.test(file.name)) { PPS.showAlert('mm', 'error', `"${file.name}" must be a .csv, .xlsx or .xls file.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('mm', 'error', err.message); return; }
        mmState.dataFile = file;
        const list = document.getElementById('mm-file-list-data');
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, {
            onRemove: () => { mmState.dataFile = null; mmState.rows = null; mmState.dataColumns = []; list.textContent = ''; renderFieldReport(); updateMmButton(); },
        }));
        if (window.lucide) lucide.createIcons();

        try {
            const buf = await file.arrayBuffer();
            const workbook = XLSX.read(buf, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            if (rows.length === 0) throw new Error('No data rows found in the first sheet.');
            if (rows.length > 2000) throw new Error(`Too many rows (${rows.length}); the limit is 2000 output documents per run.`);
            mmState.rows = rows;
            mmState.dataColumns = Object.keys(rows[0]);
        } catch (err) {
            mmState.rows = null;
            mmState.dataColumns = [];
            PPS.showAlert('mm', 'error', `Could not read data file: ${err.message}`);
        }
        renderFieldReport();
        updateMmButton();
    });

    document.getElementById('mm-run-btn').addEventListener('click', runMailMerge);
}

function updateMmButton() {
    document.getElementById('mm-run-btn').disabled = !(mmState.pdfFile && mmState.dataFile && mmState.formFieldNames.length && mmState.rows);
}

function renderFieldReport() {
    const box = document.getElementById('mm-field-report');
    box.textContent = '';
    if (!mmState.formFieldNames.length && !mmState.dataColumns.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'notice info';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'flex-start';

    const title = document.createElement('div');
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';
    title.textContent = 'Field matching preview';
    wrap.appendChild(title);

    if (mmState.formFieldNames.length) {
        const matched = [];
        const unmatchedForm = [];
        const lowerCols = mmState.dataColumns.map((c) => c.toLowerCase());
        mmState.formFieldNames.forEach((f) => {
            if (lowerCols.includes(f.toLowerCase())) matched.push(f); else unmatchedForm.push(f);
        });
        const unmatchedCols = mmState.dataColumns.filter((c) => !mmState.formFieldNames.some((f) => f.toLowerCase() === c.toLowerCase()));

        const p1 = document.createElement('div');
        p1.textContent = `PDF form fields: ${mmState.formFieldNames.length} total, ${matched.length} matched to a data column.`;
        wrap.appendChild(p1);

        if (mmState.dataColumns.length) {
            if (unmatchedForm.length) {
                const p2 = document.createElement('div');
                p2.textContent = `Form fields with no matching column (left blank): ${unmatchedForm.join(', ')}`;
                wrap.appendChild(p2);
            }
            if (unmatchedCols.length) {
                const p3 = document.createElement('div');
                p3.textContent = `Data columns with no matching form field (ignored): ${unmatchedCols.join(', ')}`;
                wrap.appendChild(p3);
            }
        }
    }

    box.appendChild(wrap);
}

function pickRowFilename(row, index, filenameCol, padWidth) {
    if (filenameCol) {
        const key = Object.keys(row).find((k) => k.toLowerCase() === filenameCol.toLowerCase());
        if (key && String(row[key]).trim() !== '') {
            return PPS.withExtension(String(row[key]).trim(), 'pdf');
        }
    }
    return `document_${String(index + 1).padStart(padWidth, '0')}.pdf`;
}

async function runMailMerge() {
    if (!mmState.pdfFile || !mmState.dataFile || !mmState.rows || !mmState.formFieldNames.length) return;
    const btn = document.getElementById('mm-run-btn');
    btn.disabled = true;
    PPS.hideAlerts('mm');
    PPS.showProgress('mm');
    PPS.setProgress('mm', 0, mmState.rows.length, 'Reading PDF template…');
    document.getElementById('mm-skip-report').textContent = '';

    try {
        const templateBytes = await PPS.readFileAsArrayBuffer(mmState.pdfFile);
        const flatten = document.getElementById('mm-flatten').checked;
        const filenameCol = document.getElementById('mm-filename-col').value.trim();
        const padWidth = String(mmState.rows.length).length;

        const zip = new JSZip();
        const usedNames = new Map();
        const skipLog = []; // {row, field, reason}
        let filled = 0;

        for (let i = 0; i < mmState.rows.length; i++) {
            const row = mmState.rows[i];
            const pdfDoc = await PDFLib.PDFDocument.load(templateBytes, { ignoreEncryption: true });
            const form = pdfDoc.getForm();
            const rowKeysLower = new Map(Object.keys(row).map((k) => [k.toLowerCase(), k]));

            for (const fieldName of mmState.formFieldNames) {
                const matchKey = rowKeysLower.get(fieldName.toLowerCase());
                if (matchKey === undefined) continue; // no matching column — leave field as-is
                const value = row[matchKey] == null ? '' : String(row[matchKey]);
                try {
                    const field = form.getTextField(fieldName);
                    field.setText(value);
                    filled++;
                } catch (err) {
                    // Not a text field (checkbox/radio/dropdown) or otherwise not settable this way —
                    // skip and report rather than throwing, per spec.
                    skipLog.push(`Row ${i + 1}: field "${fieldName}" could not be set as text (${err.message}).`);
                }
            }

            if (flatten) form.flatten();

            const outBytes = await pdfDoc.save();
            let filename = PPS.sanitizeFilename(pickRowFilename(row, i, filenameCol, padWidth));
            const count = usedNames.get(filename) || 0;
            usedNames.set(filename, count + 1);
            if (count > 0) filename = filename.replace(/(\.pdf)?$/i, `_${count + 1}.pdf`);
            zip.file(filename, outBytes);

            PPS.setProgress('mm', i + 1, mmState.rows.length, `Filling row ${i + 1} / ${mmState.rows.length}…`);
            await PPS.tick();
        }

        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        PPS.downloadBlob(zipBlob, `mail_merge_${Date.now()}.zip`);

        if (skipLog.length) {
            const box = document.getElementById('mm-skip-report');
            const notice = document.createElement('div');
            notice.className = 'notice';
            notice.style.flexDirection = 'column';
            notice.style.alignItems = 'flex-start';
            const title = document.createElement('div');
            title.style.fontWeight = '600';
            title.style.marginBottom = '4px';
            title.textContent = `${skipLog.length} field(s) skipped:`;
            notice.appendChild(title);
            skipLog.slice(0, 50).forEach((line) => {
                const p = document.createElement('div');
                p.textContent = line;
                notice.appendChild(p);
            });
            if (skipLog.length > 50) {
                const more = document.createElement('div');
                more.textContent = `…and ${skipLog.length - 50} more.`;
                notice.appendChild(more);
            }
            box.appendChild(notice);
        }

        PPS.showAlert('mm', 'success', `Generated ${mmState.rows.length} filled PDF(s), ${filled} field(s) set in total.`);
    } catch (err) {
        PPS.showAlert('mm', 'error', err.message);
    } finally {
        PPS.hideProgress('mm');
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', initMailMerge);
