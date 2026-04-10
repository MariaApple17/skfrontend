'use client';

import {
  useEffect,
  useState,
  type ChangeEvent,
} from 'react';
import {
  FileImage,
  FileText,
  LoaderCircle,
  Upload,
} from 'lucide-react';

import {
  PROGRAM_PROOF_ACCEPT,
  isImageProgramDocument,
  validateProgramProofFile,
} from '@/lib/programs';
import { getApiErrorMessage } from '@/lib/http/error';

interface Props {
  programId: number;
  disabled?: boolean;
  compact?: boolean;
  onUpload: (programId: number, file: File) => Promise<void>;
}

export default function ProgramProofUploader({
  programId,
  disabled = false,
  compact = false,
  onUpload,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<
    string | null
  >(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    if (
      !isImageProgramDocument({
        id: 0,
        imageUrl: selectedFile.name,
        mimeType: selectedFile.type,
        createdAt: new Date().toISOString(),
      })
    ) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] ?? null;
    const validationError = validateProgramProofFile(file);

    setSuccessMessage('');

    if (validationError) {
      setSelectedFile(null);
      setErrorMessage(validationError);
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
  };

  const handleUpload = async () => {
    if (disabled || uploading) {
      return;
    }

    const validationError =
      validateProgramProofFile(selectedFile);

    if (validationError || !selectedFile) {
      setErrorMessage(
        validationError ?? 'Please select a proof file.'
      );
      return;
    }

    try {
      setUploading(true);
      setErrorMessage('');
      setSuccessMessage('');

      await onUpload(programId, selectedFile);

      setSelectedFile(null);
      setSuccessMessage('Proof uploaded successfully.');
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          'Failed to upload proof.'
        )
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Upload size={16} />
        Upload Proof
      </div>

      <p className="mt-1 text-xs text-slate-500">
        JPG, PNG, or PDF only. Max file size: 5MB.
      </p>

      <input
        type="file"
        accept={PROGRAM_PROOF_ACCEPT}
        disabled={disabled || uploading}
        onChange={handleFileChange}
        className="mt-3 block w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium"
      />

      {selectedFile && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            {previewUrl ? (
              <FileImage size={16} />
            ) : (
              <FileText size={16} />
            )}

            <span className="truncate">
              {selectedFile.name}
            </span>
          </div>

          {previewUrl && (
            <img
              src={previewUrl}
              alt={selectedFile.name}
              className="mt-3 h-32 w-full rounded-xl object-cover"
            />
          )}
        </div>
      )}

      {errorMessage && (
        <p className="mt-3 text-xs font-medium text-rose-600">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="mt-3 text-xs font-medium text-emerald-600">
          {successMessage}
        </p>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={
          disabled || uploading || !selectedFile
        }
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : (
          <Upload size={14} />
        )}
        {uploading ? 'Uploading...' : 'Upload Proof'}
      </button>
    </div>
  );
}
