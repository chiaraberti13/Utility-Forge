'use strict';

/*
 * PDF Power Suite — Pipeline Builder.
 *
 * An ordered queue of steps drawn from {merge, compress, watermark, bates, ocr} — the five
 * operations that are naturally 1-in-1-out (split/diff/table-extraction/mail-merge are excluded
 * because they don't fit that shape). Each step's output PDF becomes the next step's input. Steps
 * reuse the exact same PPS.ops.* functions as their standalone tabs, so behavior is identical.
 *
 * Pipeline *definitions* (the ordered list of step types + settings) can be exported/imported as
 * JSON and the last 5 are kept in localStorage for quick recall. File contents are deliberately
 * NOT part of a saved/exported definition (that would make the JSON large and would mean storing
 * arbitrary uploaded PDF bytes in localStorage) — a Merge step's extra files must be re-attached
 * after importing or recalling a definition; the UI says so plainly when that's needed.
 */

const pipelineState = { file: null, steps: [] };
let pipelineStepIdSeq = 0;
const PIPELINE_RECENTS_KEY = 'pps_recent_pipelines_v1';

const STEP_LABELS = {
    merge: 'Merge (append files)',
    compress: 'Compress',
    watermark: 'Watermark',
    bates: 'Bates numbering',
    ocr: 'OCR (searchable PDF)',
};

function defaultStepConfig(type) {
    switch (type) {
        case 'merge': return {};
        case 'compress': return { dpi: 150, quality: 0.75 };
        case 'watermark': return { text: 'CONFIDENTIAL', rotation: 45, opacity: 0.25, fontSize: 48, position: 'center' };
        case 'bates': return { prefix: 'DOC', suffix: '', start: 1, digits: 6, position: 'bottom-right' };
        case 'ocr': return { langs: 'eng', scale: 2 };
        default: return {};
    }
}

function makeStep(type, config) {
    return {
        id: ++pipelineStepIdSeq,
        type,
        config: Object.assign(defaultStepConfig(type), config || {}),
        extraFiles: type === 'merge' ? [] : undefined,
    };
}

// ---- rendering ------------------------------------------------------------

function labeledInput(labelText, inputEl) {
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '4px';
    const label = document.createElement('label');
    label.style.fontSize = '12px';
    label.style.fontWeight = '500';
    label.textContent = labelText;
    wrap.appendChild(label);
    wrap.appendChild(inputEl);
    return wrap;
}

function buildStepConfigForm(step) {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
    grid.style.gap = '10px';
    grid.style.marginTop = '10px';

    const num = (val, min, max, stepv) => {
        const i = document.createElement('input');
        i.type = 'number'; i.value = val; if (min != null) i.min = min; if (max != null) i.max = max; if (stepv != null) i.step = stepv;
        return i;
    };
    const text = (val) => { const i = document.createElement('input'); i.type = 'text'; i.value = val; return i; };
    const select = (options, current) => {
        const s = document.createElement('select');
        options.forEach(([v, l]) => { const o = document.createElement('option'); o.value = v; o.textContent = l; if (v === current) o.selected = true; s.appendChild(o); });
        return s;
    };

    if (step.type === 'merge') {
        const box = document.createElement('div');
        box.style.gridColumn = '1 / -1';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-secondary btn-small';
        btn.textContent = 'Add files to append';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = 'application/pdf,.pdf';
        fileInput.style.display = 'none';
        btn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            Array.from(e.target.files || []).forEach((f) => {
                if (PPS.isPdfFile(f)) step.extraFiles.push(f);
            });
            fileInput.value = '';
            renderPipelineSteps();
        });
        box.appendChild(btn);
        box.appendChild(fileInput);

        const list = document.createElement('div');
        list.style.marginTop = '8px';
        list.style.display = 'flex';
        list.style.flexDirection = 'column';
        list.style.gap = '6px';
        (step.extraFiles || []).forEach((f, idx) => {
            list.appendChild(PPS.createFileRow(f.name, f.size, {
                onRemove: () => { step.extraFiles.splice(idx, 1); renderPipelineSteps(); },
            }));
        });
        box.appendChild(list);

        const hint = document.createElement('div');
        hint.className = 'field-hint';
        hint.textContent = 'These files are appended after the pipeline\'s current document at this step. File contents are not saved in exported/recalled pipeline definitions — re-add them after import.';
        box.appendChild(hint);

        grid.appendChild(box);
    } else if (step.type === 'compress') {
        const dpi = num(step.config.dpi, 72, 300, 1);
        dpi.addEventListener('input', () => { step.config.dpi = parseFloat(dpi.value); });
        grid.appendChild(labeledInput('DPI', dpi));

        const q = num(step.config.quality, 0.05, 1, 0.05);
        q.addEventListener('input', () => { step.config.quality = parseFloat(q.value); });
        grid.appendChild(labeledInput('JPEG quality', q));
    } else if (step.type === 'watermark') {
        const t = text(step.config.text);
        t.addEventListener('input', () => { step.config.text = t.value; });
        grid.appendChild(labeledInput('Text', t));

        const rot = num(step.config.rotation, -180, 180, 1);
        rot.addEventListener('input', () => { step.config.rotation = parseFloat(rot.value); });
        grid.appendChild(labeledInput('Rotation °', rot));

        const op = num(step.config.opacity, 0.05, 1, 0.05);
        op.addEventListener('input', () => { step.config.opacity = parseFloat(op.value); });
        grid.appendChild(labeledInput('Opacity', op));

        const fs = num(step.config.fontSize, 8, 120, 1);
        fs.addEventListener('input', () => { step.config.fontSize = parseFloat(fs.value); });
        grid.appendChild(labeledInput('Font size', fs));

        const pos = select([['center', 'Center'], ['top-left', 'Top left'], ['top-right', 'Top right'], ['bottom-left', 'Bottom left'], ['bottom-right', 'Bottom right']], step.config.position);
        pos.addEventListener('change', () => { step.config.position = pos.value; });
        grid.appendChild(labeledInput('Position', pos));
    } else if (step.type === 'bates') {
        const p = text(step.config.prefix);
        p.addEventListener('input', () => { step.config.prefix = p.value; });
        grid.appendChild(labeledInput('Prefix', p));

        const s = text(step.config.suffix);
        s.addEventListener('input', () => { step.config.suffix = s.value; });
        grid.appendChild(labeledInput('Suffix', s));

        const start = num(step.config.start, 0, 9999999, 1);
        start.addEventListener('input', () => { step.config.start = parseInt(start.value, 10) || 0; });
        grid.appendChild(labeledInput('Start number', start));

        const digits = num(step.config.digits, 1, 10, 1);
        digits.addEventListener('input', () => { step.config.digits = Math.max(1, parseInt(digits.value, 10) || 6); });
        grid.appendChild(labeledInput('Digit padding', digits));

        const pos = select([['bottom-right', 'Bottom right'], ['bottom-left', 'Bottom left'], ['top-right', 'Top right'], ['top-left', 'Top left']], step.config.position);
        pos.addEventListener('change', () => { step.config.position = pos.value; });
        grid.appendChild(labeledInput('Position', pos));
    } else if (step.type === 'ocr') {
        const langWrap = document.createElement('div');
        langWrap.style.display = 'flex';
        langWrap.style.gap = '12px';
        const langs = (step.config.langs || 'eng').split('+');
        const mkCheck = (code, labelText) => {
            const row = document.createElement('label');
            row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '4px'; row.style.fontWeight = '400'; row.style.fontSize = '13px';
            const cb = document.createElement('input');
            cb.type = 'checkbox'; cb.checked = langs.includes(code);
            cb.addEventListener('change', () => {
                const set = new Set(step.config.langs.split('+').filter(Boolean));
                if (cb.checked) set.add(code); else set.delete(code);
                if (set.size === 0) set.add('eng');
                step.config.langs = Array.from(set).join('+');
            });
            row.appendChild(cb);
            row.appendChild(document.createTextNode(labelText));
            return row;
        };
        langWrap.appendChild(mkCheck('eng', 'English'));
        langWrap.appendChild(mkCheck('ita', 'Italian'));
        grid.appendChild(labeledInput('Language(s)', langWrap));

        const scale = num(step.config.scale, 1, 3, 0.5);
        scale.addEventListener('input', () => { step.config.scale = parseFloat(scale.value); });
        grid.appendChild(labeledInput('Rasterize scale', scale));

        const note = document.createElement('div');
        note.className = 'field-hint';
        note.style.gridColumn = '1 / -1';
        note.textContent = 'Needs network access the first time (downloads OCR language data).';
        grid.appendChild(note);
    }

    return grid;
}

function renderPipelineSteps() {
    const container = document.getElementById('pipeline-step-list');
    container.textContent = '';

    pipelineState.steps.forEach((step, idx) => {
        const row = document.createElement('div');
        row.className = 'step-row';
        row.style.flexDirection = 'column';
        row.style.alignItems = 'stretch';

        const head = document.createElement('div');
        head.style.display = 'flex';
        head.style.alignItems = 'center';
        head.style.gap = '10px';

        const badge = document.createElement('div');
        badge.className = 'step-index';
        badge.textContent = String(idx + 1);
        head.appendChild(badge);

        const label = document.createElement('div');
        label.className = 'step-label';
        label.textContent = STEP_LABELS[step.type] || step.type;
        head.appendChild(label);

        const controls = document.createElement('div');
        controls.className = 'file-controls';
        controls.appendChild(PPS.iconButton('chevron-up', () => moveStep(idx, -1), idx === 0));
        controls.appendChild(PPS.iconButton('chevron-down', () => moveStep(idx, 1), idx === pipelineState.steps.length - 1));
        controls.appendChild(PPS.iconButton('x', () => removeStep(step.id)));
        head.appendChild(controls);

        row.appendChild(head);
        row.appendChild(buildStepConfigForm(step));
        container.appendChild(row);
    });

    document.getElementById('pipeline-run-btn').disabled = !(pipelineState.file && pipelineState.steps.length > 0);
    if (window.lucide) lucide.createIcons();
}

function moveStep(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= pipelineState.steps.length) return;
    [pipelineState.steps[idx], pipelineState.steps[j]] = [pipelineState.steps[j], pipelineState.steps[idx]];
    renderPipelineSteps();
}

function removeStep(id) {
    pipelineState.steps = pipelineState.steps.filter((s) => s.id !== id);
    renderPipelineSteps();
}

// ---- recent pipelines (localStorage) --------------------------------------

function loadRecents() {
    try {
        const raw = localStorage.getItem(PIPELINE_RECENTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveToRecents(steps) {
    try {
        const serializable = steps.map((s) => ({ type: s.type, config: s.config }));
        if (serializable.length === 0) return;
        let recents = loadRecents();
        recents.unshift({ savedAt: new Date().toISOString(), steps: serializable });
        recents = recents.slice(0, 5);
        localStorage.setItem(PIPELINE_RECENTS_KEY, JSON.stringify(recents));
        populateRecentsDropdown();
    } catch (e) {
        // localStorage unavailable (private browsing, quota, etc) — silently skip, not essential.
    }
}

function populateRecentsDropdown() {
    const select = document.getElementById('pipeline-recall-select');
    select.textContent = '';
    const none = document.createElement('option');
    none.value = ''; none.textContent = '— none —';
    select.appendChild(none);
    loadRecents().forEach((entry, idx) => {
        const opt = document.createElement('option');
        opt.value = String(idx);
        const when = new Date(entry.savedAt).toLocaleString();
        const summary = entry.steps.map((s) => STEP_LABELS[s.type] || s.type).join(' → ');
        opt.textContent = `${when} — ${summary}`;
        select.appendChild(opt);
    });
}

// ---- run / export / import -------------------------------------------------

async function runPipeline() {
    if (!pipelineState.file || pipelineState.steps.length === 0) return;
    const btn = document.getElementById('pipeline-run-btn');
    btn.disabled = true;
    PPS.hideAlerts('pipeline');
    PPS.showProgress('pipeline');
    PPS.setProgress('pipeline', 0, pipelineState.steps.length, 'Reading starting PDF…');

    try {
        let currentBytes = await PPS.readFileAsArrayBuffer(pipelineState.file);

        for (let i = 0; i < pipelineState.steps.length; i++) {
            const step = pipelineState.steps[i];
            const stepLabel = STEP_LABELS[step.type] || step.type;
            PPS.setProgress('pipeline', i, pipelineState.steps.length, `Step ${i + 1}/${pipelineState.steps.length}: ${stepLabel}…`);

            try {
                if (step.type === 'merge') {
                    const inputs = [{ name: 'pipeline-current', bytes: currentBytes }];
                    for (const f of (step.extraFiles || [])) {
                        inputs.push({ name: f.name, bytes: await PPS.readFileAsArrayBuffer(f) });
                    }
                    currentBytes = await PPS.ops.merge(inputs);
                } else if (step.type === 'compress') {
                    currentBytes = await PPS.ops.compress(currentBytes, step.config);
                } else if (step.type === 'watermark') {
                    currentBytes = await PPS.ops.watermark(currentBytes, step.config);
                } else if (step.type === 'bates') {
                    currentBytes = await PPS.ops.bates(currentBytes, step.config);
                } else if (step.type === 'ocr') {
                    currentBytes = await PPS.ops.ocr(currentBytes, step.config, (done, total, label) =>
                        PPS.setProgress('pipeline', i, pipelineState.steps.length, `Step ${i + 1}/${pipelineState.steps.length}: ${label}`));
                }
            } catch (err) {
                throw new Error(`Step ${i + 1} (${stepLabel}) failed: ${err.message}`);
            }

            PPS.setProgress('pipeline', i + 1, pipelineState.steps.length, `Completed step ${i + 1} / ${pipelineState.steps.length}`);
            await PPS.tick();
        }

        PPS.downloadBytes(currentBytes, 'pipeline_output.pdf');
        saveToRecents(pipelineState.steps);
        PPS.showAlert('pipeline', 'success', `Pipeline complete: ran ${pipelineState.steps.length} step(s).`);
    } catch (err) {
        PPS.showAlert('pipeline', 'error', err.message);
    } finally {
        PPS.hideProgress('pipeline');
        btn.disabled = !(pipelineState.file && pipelineState.steps.length > 0);
    }
}

function exportPipelineJson() {
    if (pipelineState.steps.length === 0) {
        PPS.showAlert('pipeline', 'error', 'Add at least one step before exporting.');
        return;
    }
    const def = { version: 1, steps: pipelineState.steps.map((s) => ({ type: s.type, config: s.config })) };
    const blob = new Blob([JSON.stringify(def, null, 2)], { type: 'application/json' });
    PPS.downloadBlob(blob, 'pdf-power-suite-pipeline.json');
    saveToRecents(pipelineState.steps);
}

function loadStepsFromDefinition(defSteps) {
    if (!Array.isArray(defSteps)) throw new Error('Invalid pipeline definition: "steps" must be an array.');
    const allowed = new Set(Object.keys(STEP_LABELS));
    const newSteps = defSteps.map((s) => {
        if (!s || !allowed.has(s.type)) throw new Error(`Invalid or unsupported step type: "${s && s.type}".`);
        return makeStep(s.type, s.config);
    });
    pipelineState.steps = newSteps;
    renderPipelineSteps();
    if (newSteps.some((s) => s.type === 'merge')) {
        PPS.showAlert('pipeline', 'success', 'Pipeline loaded. Any Merge step needs its extra files re-attached (file contents aren\'t saved in a pipeline definition).');
    } else {
        PPS.showAlert('pipeline', 'success', 'Pipeline loaded.');
    }
}

function importPipelineJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const def = JSON.parse(String(reader.result));
            loadStepsFromDefinition(def.steps);
        } catch (err) {
            PPS.showAlert('pipeline', 'error', `Could not import pipeline: ${err.message}`);
        }
    };
    reader.onerror = () => PPS.showAlert('pipeline', 'error', 'Could not read the JSON file.');
    reader.readAsText(file);
}

// ---- init -------------------------------------------------------------

function initPipeline() {
    PPS.setupDropzone('pipeline-upload', 'pipeline-file-input', (files) => {
        PPS.hideAlerts('pipeline');
        const file = files[0];
        if (!PPS.isPdfFile(file)) { PPS.showAlert('pipeline', 'error', `"${file.name}" is not a PDF.`); return; }
        try { PPS.checkFileSize(file); } catch (err) { PPS.showAlert('pipeline', 'error', err.message); return; }
        pipelineState.file = file;
        const list = document.getElementById('pipeline-file-list');
        list.textContent = '';
        list.appendChild(PPS.createFileRow(file.name, file.size, {
            onRemove: () => { pipelineState.file = null; list.textContent = ''; renderPipelineSteps(); },
        }));
        if (window.lucide) lucide.createIcons();
        renderPipelineSteps();
    });

    document.getElementById('pipeline-add-btn').addEventListener('click', () => {
        const type = document.getElementById('pipeline-add-select').value;
        pipelineState.steps.push(makeStep(type));
        renderPipelineSteps();
    });

    document.getElementById('pipeline-run-btn').addEventListener('click', runPipeline);
    document.getElementById('pipeline-export-btn').addEventListener('click', exportPipelineJson);

    const importInput = document.getElementById('pipeline-import-input');
    document.getElementById('pipeline-import-btn').addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) importPipelineJson(file);
        importInput.value = '';
    });

    document.getElementById('pipeline-recall-select').addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (Number.isNaN(idx)) return;
        const recents = loadRecents();
        const entry = recents[idx];
        if (entry) loadStepsFromDefinition(entry.steps);
    });

    populateRecentsDropdown();
    renderPipelineSteps();
}

document.addEventListener('DOMContentLoaded', initPipeline);
