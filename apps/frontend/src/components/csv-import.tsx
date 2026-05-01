'use client';

import { useMemo, useRef, useState } from 'react';
import type {
  Entity,
  ImportCommitResult,
  ImportPreview,
} from '@ai-gen/shared';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/cn';

/**
 * <CsvImport />
 *
 * Three-step flow driven by a single component:
 *   1. Upload    — drag-drop / file picker → POST /import     (returns preview)
 *   2. Mapping   — CSV column → entity field (defaults to server-suggested)
 *   3. Commit    — POST /import/commit → shows summary + row errors
 *
 * Safe by design:
 *   - File size / type errors surface inline.
 *   - Failed commits keep the mapping intact.
 *   - "Skip invalid rows" on by default so partial imports don't block success.
 */

type Step = 'upload' | 'map' | 'done';

export interface CsvImportProps {
  appId: string;
  entity: Entity;
  /** Called after a successful commit (use to refetch the table). */
  onImported?: (result: ImportCommitResult) => void;
  /** Called when the user cancels. */
  onCancel?: () => void;
}

const IGNORE = '__ignore__';

export function CsvImport({ appId, entity, onImported, onCancel }: CsvImportProps) {
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Preview + mapping state
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [skipInvalid, setSkipInvalid] = useState(true);

  // Result
  const [result, setResult] = useState<ImportCommitResult | null>(null);

  // ---------- Step 1: upload --------------------------------------------------
  async function handleUpload(f: File) {
    setError(null);
    setFile(f);
    setIsBusy(true);
    try {
      const p = await api.imports.preview(appId, entity.key, f);
      setPreview(p);
      setMapping({ ...p.suggestedMapping });
      setStep('map');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setFile(null);
    } finally {
      setIsBusy(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0]!;
    if (!f.name.toLowerCase().endsWith('.csv') && !f.type.includes('csv')) {
      setError('Please select a .csv file');
      return;
    }
    void handleUpload(f);
  }

  // ---------- Step 2: commit --------------------------------------------------
  const mappedCount = useMemo(
    () => Object.values(mapping).filter((v) => v && v !== IGNORE).length,
    [mapping],
  );

  async function handleCommit() {
    if (!preview) return;
    setError(null);
    setIsBusy(true);
    try {
      const cleanMapping: Record<string, string> = {};
      for (const [col, fieldKey] of Object.entries(mapping)) {
        if (fieldKey && fieldKey !== IGNORE) cleanMapping[col] = fieldKey;
      }
      const res = await api.imports.commit(appId, entity.key, {
        uploadId: preview.uploadId,
        mapping: cleanMapping,
        skipInvalid,
      });
      setResult(res);
      setStep('done');
      onImported?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsBusy(false);
    }
  }

  // ---------- Reset -----------------------------------------------------------
  function reset() {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setMapping({});
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ==========================================================================

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import {entity.name} from CSV</CardTitle>
        <Stepper step={step} />
      </CardHeader>

      <CardBody className="flex flex-col gap-4">
        {error && (
          <div
            role="alert"
            className="rounded-block border-3 border-ember-300 bg-ember-50 px-4 py-3 text-sm text-ember-600"
          >
            {error}
          </div>
        )}

        {step === 'upload' && (
          <UploadStep
            fileInputRef={fileInputRef}
            file={file}
            dragOver={dragOver}
            isBusy={isBusy}
            onFiles={handleFiles}
            onDragOver={setDragOver}
          />
        )}

        {step === 'map' && preview && (
          <MappingStep
            entity={entity}
            preview={preview}
            mapping={mapping}
            setMapping={setMapping}
            skipInvalid={skipInvalid}
            setSkipInvalid={setSkipInvalid}
          />
        )}

        {step === 'done' && result && <ResultStep result={result} />}
      </CardBody>

      <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs text-paper-600">
          {step === 'map' && preview && (
            <>
              <Badge tone="brand">{mappedCount} mapped</Badge>
              <span>
                of {preview.columns.length} columns · {preview.rowCount} rows
              </span>
            </>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {step === 'upload' && onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {step === 'map' && (
            <>
              <Button variant="ghost" onClick={reset} disabled={isBusy}>
                Start over
              </Button>
              <Button
                onClick={handleCommit}
                loading={isBusy}
                disabled={mappedCount === 0}
              >
                Import {preview?.rowCount ?? 0} rows
              </Button>
            </>
          )}
          {step === 'done' && (
            <>
              <Button variant="ghost" onClick={reset}>
                Import another
              </Button>
              {onCancel && <Button onClick={onCancel}>Done</Button>}
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// ---------- UI pieces -------------------------------------------------------

function Stepper({ step }: { step: Step }) {
  const steps: Array<{ key: Step; label: string }> = [
    { key: 'upload', label: 'Upload' },
    { key: 'map', label: 'Map columns' },
    { key: 'done', label: 'Import' },
  ];
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wider text-paper-500">
      {steps.map((s, i) => {
        const active = s.key === step;
        const done = steps.findIndex((x) => x.key === step) > i;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-block border-3 text-2xs',
                active && 'bg-brand-400 border-brand-700 text-paper-900',
                done && 'bg-brand-100 border-brand-400 text-brand-700',
                !active && !done && 'bg-white border-paper-300 text-paper-500',
              )}
            >
              {i + 1}
            </span>
            <span className={cn('hidden xs:inline', active && 'text-paper-900')}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function UploadStep({
  fileInputRef,
  file,
  dragOver,
  isBusy,
  onFiles,
  onDragOver,
}: {
  fileInputRef: React.RefObject<HTMLInputElement>;
  file: File | null;
  dragOver: boolean;
  isBusy: boolean;
  onFiles: (files: FileList | null) => void;
  onDragOver: (v: boolean) => void;
}) {
  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        onDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(true);
      }}
      onDragLeave={() => onDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDragOver(false);
        onFiles(e.dataTransfer.files);
      }}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-block-lg border-3 border-dashed px-6 py-10 text-center transition',
        dragOver
          ? 'border-brand-500 bg-brand-50'
          : 'border-paper-300 bg-paper-50 hover:border-paper-400',
      )}
    >
      <svg viewBox="0 0 24 24" className="h-10 w-10 text-paper-400" fill="none" aria-hidden>
        <path
          d="M12 16V4m0 0-4 4m4-4 4 4M5 20h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        />
      </svg>
      <p className="font-medium text-paper-800">
        {file ? file.name : 'Drop a .csv file here'}
      </p>
      <p className="text-xs text-paper-500">Max 20 MB · UTF-8 · comma, semicolon, or tab</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          loading={isBusy}
          onClick={() => fileInputRef.current?.click()}
        >
          Choose file
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}

function MappingStep({
  entity,
  preview,
  mapping,
  setMapping,
  skipInvalid,
  setSkipInvalid,
}: {
  entity: Entity;
  preview: ImportPreview;
  mapping: Record<string, string>;
  setMapping: (next: Record<string, string>) => void;
  skipInvalid: boolean;
  setSkipInvalid: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {preview.warnings.length > 0 && (
        <div className="rounded-block border-3 border-sun-400 bg-sun-50 px-4 py-3 text-sm text-paper-800">
          <p className="font-semibold">Parser warnings</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {preview.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Mapping list */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {preview.columns.map((col) => {
          const current = mapping[col] ?? IGNORE;
          return (
            <div
              key={col}
              className="flex flex-col gap-2 rounded-block border-3 border-paper-200 bg-white p-3 xs:flex-row xs:items-center xs:justify-between xs:gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm text-paper-800">{col}</p>
                <p className="truncate text-2xs uppercase tracking-wider text-paper-500">
                  {preview.sampleRows[0]?.[col] ?? '—'}
                </p>
              </div>
              <Select
                size="sm"
                className="w-full xs:w-40"
                value={current}
                onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })}
              >
                <option value={IGNORE}>— Ignore —</option>
                {entity.fields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label ?? f.key} {f.required ? '*' : ''}
                  </option>
                ))}
              </Select>
            </div>
          );
        })}
      </div>

      {/* Sample preview */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-paper-500">
          Preview (first {preview.sampleRows.length} rows)
        </p>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {preview.columns.map((c) => (
                  <TableHeaderCell key={c}>
                    <div className="flex flex-col">
                      <span>{c}</span>
                      <span className="text-2xs normal-case text-paper-400">
                        {mapping[c] && mapping[c] !== IGNORE ? `→ ${mapping[c]}` : 'ignored'}
                      </span>
                    </div>
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {preview.sampleRows.map((row, i) => (
                <TableRow key={i}>
                  {preview.columns.map((c) => (
                    <TableCell key={c} muted={!mapping[c] || mapping[c] === IGNORE}>
                      {row[c] ?? ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={skipInvalid}
          onChange={(e) => setSkipInvalid(e.target.checked)}
          className="h-5 w-5 cursor-pointer rounded-block border-3 border-paper-700 bg-white accent-brand-500 shadow-block-sm"
        />
        <span className="text-sm text-paper-800">
          Skip invalid rows (keep importing valid ones)
        </span>
      </label>
    </div>
  );
}

function ResultStep({ result }: { result: ImportCommitResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ResultStat label="Inserted" value={result.inserted} tone="brand" />
        <ResultStat label="Skipped" value={result.skipped} tone="sun" />
        <ResultStat
          label="Errors"
          value={result.errors.length}
          tone={result.errors.length > 0 ? 'ember' : 'neutral'}
        />
      </div>

      {result.errors.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-paper-500">
            First {Math.min(result.errors.length, 20)} errors
          </p>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Row</TableHeaderCell>
                  <TableHeaderCell>Field</TableHeaderCell>
                  <TableHeaderCell>Message</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.errors.slice(0, 20).flatMap((e) =>
                  e.fieldErrors && Object.keys(e.fieldErrors).length > 0
                    ? Object.entries(e.fieldErrors).map(([field, msg]) => (
                        <TableRow key={`${e.rowNumber}-${field}`}>
                          <TableCell className="tabular-nums">{e.rowNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{field}</TableCell>
                          <TableCell>{msg}</TableCell>
                        </TableRow>
                      ))
                    : [
                        <TableRow key={`${e.rowNumber}-x`}>
                          <TableCell className="tabular-nums">{e.rowNumber}</TableCell>
                          <TableCell muted>—</TableCell>
                          <TableCell>{e.message}</TableCell>
                        </TableRow>,
                      ],
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </div>
  );
}

function ResultStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'brand' | 'sun' | 'ember' | 'neutral';
}) {
  const toneClass =
    tone === 'brand'
      ? 'border-brand-400 bg-brand-50 text-brand-700'
      : tone === 'sun'
      ? 'border-sun-400 bg-sun-50 text-paper-800'
      : tone === 'ember'
      ? 'border-ember-300 bg-ember-50 text-ember-600'
      : 'border-paper-300 bg-paper-50 text-paper-700';
  return (
    <div className={cn('rounded-block border-3 p-4', toneClass)}>
      <p className="text-2xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}
