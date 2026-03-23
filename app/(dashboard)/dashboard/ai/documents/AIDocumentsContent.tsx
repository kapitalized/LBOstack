'use client';

/**
 * AI Documents — project selector, uploads, and model runs per file.
 */
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/format-date';

interface Project {
  id: string;
  projectName: string;
}

interface ProjectFile {
  id: string;
  fileName: string;
  fileType: string;
  blobUrl: string;
  fileSize?: number | null;
  uploadedAt?: string | null;
}

export interface AIDocumentsContentProps {
  initialProjectId?: string;
  /** When set, "See report" uses short URL: baseReportsPath/reportShortId */
  baseReportsPath?: string;
}

export function AIDocumentsContent({ initialProjectId, baseReportsPath }: AIDocumentsContentProps = {}) {
  const searchParams = useSearchParams();
  const projectIdParam = initialProjectId ?? searchParams.get('projectId');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>(projectIdParam ?? '');
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [uploadingInput, setUploadingInput] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<{ reportId: string; reportShortId?: string | null; modelName: string } | null>(null);
  useEffect(() => {
    if (initialProjectId) setProjectId(initialProjectId);
  }, [initialProjectId]);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        if (initialProjectId) setProjectId(initialProjectId);
        else if (!projectId && list.length > 0) setProjectId(list[0].id);
        else if (projectIdParam && list.some((p: Project) => p.id === projectIdParam)) setProjectId(projectIdParam);
      })
      .catch(() => setProjects([]));
  }, [projectIdParam, initialProjectId]);

  const loadFiles = useCallback(() => {
    if (!projectId) return setFiles([]);
    setLoadingFiles(true);
    fetch(`/api/projects/${projectId}/files`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setFiles(Array.isArray(data) ? data : []))
      .catch(() => setFiles([]))
      .finally(() => setLoadingFiles(false));
  }, [projectId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  async function uploadExcelFile(file: File) {
    if (!projectId || uploadingExcel) return;
    setError(null);
    setUploadingExcel(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('fileType', 'Models');
      const res = await fetch(`/api/projects/${projectId}/files`, { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? 'Upload failed.');
        return;
      }
      loadFiles();
    } catch {
      setError('Upload failed.');
    } finally {
      setUploadingExcel(false);
    }
  }

  async function uploadModelInput(file: File) {
    if (!projectId || uploadingInput) return;
    setError(null);
    setUploadingInput(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('fileType', 'Model_Inputs');
      const res = await fetch(`/api/projects/${projectId}/files`, { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? 'Upload failed.');
        return;
      }
      loadFiles();
    } catch {
      setError('Upload failed.');
    } finally {
      setUploadingInput(false);
    }
  }

  async function runAnalysis(file: ProjectFile) {
    if (!projectId || analyzingId) return;
    setError(null);
    setSuccessMessage(null);
    setAnalyzingId(file.id);
    try {
      if (file.fileType === 'Models') {
        const res = await fetch('/api/lbo/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            fileId: file.id,
            fileUrl: file.blobUrl,
          }),
        });
        const data = await res.json().catch(() => ({}));
        const apiError = (data as { error?: string }).error;

        if (!res.ok) {
          const msg = apiError ?? (res.status >= 500 ? 'LBO run failed on the server.' : 'LBO run failed.');
          setError(msg);
          return;
        }
        if (apiError) {
          setError(apiError);
          return;
        }

        const reportId = (data as { reportId?: string }).reportId;
        const reportShortId = (data as { reportShortId?: string | null }).reportShortId ?? null;
        if (reportId) setSuccessMessage({ reportId, reportShortId, modelName: 'LBO Model Engine' });
        else setError('LBO run completed but no report was created. Try again.');
        loadFiles();
      } else {
        setError('Only files with type "Models" can be executed. Upload model assumptions as "Model_Inputs".');
        return;
      }
    } catch {
      setError('Network error or no response. The AI provider or Python engine may be temporarily unavailable. Check your connection and try again.');
    } finally {
      setAnalyzingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload source documents and Excel models, then run extraction + modeling. Results appear in Modeling.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-green-600/50 bg-green-500/10 px-4 py-2 text-sm text-green-800 dark:text-green-200 flex items-center justify-between gap-2 flex-wrap">
          <span>
            Model run successfully using {successMessage.modelName}.{' '}
            <Link
              href={baseReportsPath && successMessage.reportShortId ? `${baseReportsPath}/${successMessage.reportShortId}` : `/dashboard/ai/modeling?projectId=${projectId}&reportId=${successMessage.reportId}`}
              className="font-medium underline hover:no-underline"
            >
              See report
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {!initialProjectId && (
        <div>
          <label className="block text-sm font-medium mb-1">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full max-w-xs text-foreground"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
        </div>
      )}

      {projectId && (
        <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
          {/* Left: Documents list */}
          <div className="border rounded-lg bg-card overflow-hidden min-w-0">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Documents</h2>
                <p className="text-sm text-muted-foreground mt-0.5">All uploaded files for this project</p>
              </div>
              {initialProjectId && (
                <Link href={baseReportsPath ?? `/dashboard/ai/modeling?projectId=${projectId}`} className="text-sm text-primary hover:underline shrink-0">
                  View in Modeling
                </Link>
              )}
            </div>
            {loadingFiles ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No documents yet. Upload a file in the panel on the right.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">File name</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Size</th>
                      <th className="text-left p-3 font-medium">Uploaded</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f) => (
                      <tr key={f.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium max-w-[260px]" title={f.fileName}>
                          <span
                            className="block break-words"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {f.fileName}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{f.fileType}</td>
                        <td className="p-3 text-muted-foreground">{f.fileSize != null ? `${(f.fileSize / 1024).toFixed(1)} KB` : '—'}</td>
                        <td className="p-3 text-muted-foreground">{f.uploadedAt ? formatDate(f.uploadedAt) : '—'}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => runAnalysis(f)}
                            disabled={analyzingId !== null}
                            className="text-sm px-3 py-1.5 rounded-md border bg-primary text-primary-foreground disabled:opacity-50"
                          >
                            {analyzingId === f.id ? 'Running…' : f.fileType === 'Models' ? 'Run LBO model' : 'Not runnable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right: Upload files */}
          <div className="lg:max-w-[320px] space-y-4">
            <div>
              <h2 className="font-semibold text-lg mb-1">Upload files</h2>
              <p className="text-sm text-muted-foreground">Upload model workbooks and supporting inputs.</p>
            </div>
            <div className="border rounded-lg bg-card overflow-hidden p-4">
              <h2 className="font-semibold text-lg mb-1">Upload Models</h2>
              <p className="text-sm text-muted-foreground">Main `.xlsx` model workbooks to run cashflow modeling.</p>
              <label className="cursor-pointer block mt-3">
                <span
                  className={`text-sm font-medium block rounded-md border px-3 py-2 text-center ${
                    uploadingExcel ? 'text-muted-foreground' : 'bg-background hover:bg-muted/40'
                  }`}
                >
                  {uploadingExcel ? 'Uploading…' : 'Choose .xlsx file'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingExcel}
                  accept=".xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadExcelFile(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <div className="border rounded-lg bg-card overflow-hidden p-4">
              <h2 className="font-semibold text-lg mb-1">Upload Model Inputs</h2>
              <p className="text-sm text-muted-foreground">Assumption packs and source inputs (`.xlsx`, `.csv`, `.pdf`).</p>
              <label className="cursor-pointer block mt-3">
                <span
                  className={`text-sm font-medium block rounded-md border px-3 py-2 text-center ${
                    uploadingInput ? 'text-muted-foreground' : 'bg-background hover:bg-muted/40'
                  }`}
                >
                  {uploadingInput ? 'Uploading…' : 'Choose input file'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingInput}
                  accept=".xlsx,.csv,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadModelInput(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {!projectId && projects.length === 0 && (
        <p className="text-muted-foreground text-sm">Create a project from the Dashboard first.</p>
      )}
    </div>
  );
}
