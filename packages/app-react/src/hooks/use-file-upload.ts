/**
 * Hook for handling file uploads in the mobile app.
 * Provides document picker, image picker, and camera integration.
 */

import { useState, useCallback } from 'react';

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import type {
  UploadResourceFileDTO,
  UploadResourcesResponseDTO,
} from '@dailyuse/contracts/repository';

import {
  DEFAULT_MAX_FILE_SIZE,
  formatFileSize,
  generateUniqueFilename,
  inferMimeType,
  uriToBase64,
  validateFile,
} from '../utils/file-utils';

export type UploadStatus = 'idle' | 'picking' | 'reading' | 'uploading' | 'success' | 'error';

export interface UploadState {
  status: UploadStatus;
  message: string | null;
  progress: { current: number; total: number } | null;
}

export interface UseFileUploadOptions {
  hasRepository: boolean;
  uploadFiles: (
    files: UploadResourceFileDTO[],
    options?: { folderId?: string; tags?: string[] },
  ) => Promise<UploadResourcesResponseDTO | null>;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  onSuccess?: (result: UploadResourcesResponseDTO) => void;
  onError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const {
    allowedMimeTypes,
    hasRepository,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    onError,
    onSuccess,
    uploadFiles,
  } = options;

  const [state, setState] = useState<UploadState>({
    status: 'idle',
    message: null,
    progress: null,
  });

  const resetState = useCallback(() => {
    setState({ status: 'idle', message: null, progress: null });
  }, []);

  const setError = useCallback(
    (message: string) => {
      setState({ status: 'error', message, progress: null });
      onError?.(message);
    },
    [onError],
  );

  const processAndUpload = useCallback(
    async (
      assets: Array<{
        uri: string;
        name: string;
        mimeType?: string;
        size?: number;
        base64?: string | null;
      }>,
    ): Promise<UploadResourcesResponseDTO | null> => {
      if (!hasRepository) {
        setError('No repository available');
        return null;
      }

      // Validate files
      const validationErrors: string[] = [];
      for (const asset of assets) {
        const validation = validateFile(
          { name: asset.name, mimeType: asset.mimeType, size: asset.size },
          { maxSize: maxFileSize, allowedMimeTypes },
        );
        if (!validation.valid && validation.error) {
          validationErrors.push(validation.error);
        }
      }

      if (validationErrors.length > 0) {
        setError(validationErrors.join('; '));
        return null;
      }

      // Read files and convert to base64
      setState({
        status: 'reading',
        message: `Reading ${assets.length} file(s)...`,
        progress: { current: 0, total: assets.length },
      });

      const files: UploadResourceFileDTO[] = [];
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        setState((prev) => ({
          ...prev,
          progress: { current: i + 1, total: assets.length },
        }));

        const contentBase64 = asset.base64 ?? (await uriToBase64(asset.uri));
        files.push({
          name: asset.name,
          mimeType: asset.mimeType ?? inferMimeType(asset.name),
          size: asset.size,
          contentBase64,
        });
      }

      // Upload files
      setState({
        status: 'uploading',
        message: `Uploading ${files.length} file(s)...`,
        progress: null,
      });

      const result = await uploadFiles(files);

      if (!result) {
        setError('Upload failed');
        return null;
      }

      const successCount = result.successes.length;
      const failCount = result.failures.length;

      if (failCount > 0 && successCount === 0) {
        setError(`All ${failCount} file(s) failed to upload`);
        return result;
      }

      const message =
        failCount > 0
          ? `Uploaded ${successCount} file(s), ${failCount} failed`
          : `Uploaded ${successCount} file(s) successfully`;

      setState({ status: 'success', message, progress: null });
      onSuccess?.(result);

      return result;
    },
    [allowedMimeTypes, hasRepository, maxFileSize, onSuccess, setError, uploadFiles],
  );

  const pickDocuments = useCallback(async () => {
    setState({ status: 'picking', message: 'Selecting files...', progress: null });

    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) {
      resetState();
      return null;
    }

    return processAndUpload(
      result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? undefined,
        size: asset.size ?? undefined,
      })),
    );
  }, [processAndUpload, resetState]);

  const pickImages = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Media library permission denied');
      return null;
    }

    setState({ status: 'picking', message: 'Selecting images...', progress: null });

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || result.assets.length === 0) {
      resetState();
      return null;
    }

    return processAndUpload(
      result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? generateUniqueFilename('image', 'jpg'),
        mimeType: asset.mimeType ?? 'image/jpeg',
        base64: asset.base64,
      })),
    );
  }, [processAndUpload, resetState, setError]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission denied');
      return null;
    }

    setState({ status: 'picking', message: 'Taking photo...', progress: null });

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || result.assets.length === 0) {
      resetState();
      return null;
    }

    const asset = result.assets[0];
    return processAndUpload([
      {
        uri: asset.uri,
        name: generateUniqueFilename('photo', 'jpg'),
        mimeType: asset.mimeType ?? 'image/jpeg',
        base64: asset.base64,
      },
    ]);
  }, [processAndUpload, resetState, setError]);

  return {
    state,
    isUploading: state.status !== 'idle' && state.status !== 'success' && state.status !== 'error',
    pickDocuments,
    pickImages,
    takePhoto,
    resetState,
    maxFileSizeText: formatFileSize(maxFileSize),
  };
}
