import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

import { useAppSession } from '../hooks/useAppSession';
import { useRepositoryService } from '../hooks/useRepositoryService';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';
import {
  getResourceDisplayName,
  getResourceStatusText,
  getResourceTypeText,
} from '../utils/entity-presentation';

export function NoteEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resourceId?: string | string[] }>();
  const resourceId = typeof params.resourceId === 'string' ? params.resourceId : Array.isArray(params.resourceId) ? params.resourceId[0] : null;
  const service = useRepositoryService();
  const { isRemoteAuthenticated, signOut } = useAppSession();

  const [resource, setResource] = useState<ResourceClientDTO | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!isRemoteAuthenticated || !resourceId) {
      setResource(null);
      setContent('');
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await service.getResource(resourceId);
    if (!result.ok) {
      setResource(null);
      setContent('');
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setResource(result.data);
    setContent(result.data.content ?? '');
    setIsLoading(false);
  }

  useEffect(() => {
    void load();
  }, [resourceId, isRemoteAuthenticated]);

  const hasUnsavedChanges = useMemo(() => (resource?.content ?? '') !== content, [resource?.content, content]);

  async function handleSave() {
    if (!resourceId) {
      return;
    }

    setIsMutating(true);
    setError(null);
    const result = await service.updateResource(resourceId, { content });
    setIsMutating(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    await load();
  }

  async function handleDelete() {
    if (!resourceId) {
      return;
    }

    setIsMutating(true);
    setError(null);
    const result = await service.deleteResource(resourceId);
    setIsMutating(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    router.back();
  }

  return (
    <PageShell
      eyebrow="More"
      title={resource ? `Note: ${getResourceDisplayName(resource)}` : 'Note editor'}
      subtitle="独立 note editor route 现在已经从 repository 页面拆出来。">
      <SectionCard title="Navigation" description="独立编辑 route 方便后续补 markdown toolbar 和预览切换。">
        <PrimaryButton label="Back to repository" onPress={() => router.back()} variant="secondary" />
      </SectionCard>

      {!isRemoteAuthenticated ? (
        <SectionCard title="Remote sign-in required" description="编辑器依赖远程认证会话。">
          <PrimaryButton fullWidth label="Return to sign-in" onPress={signOut} />
        </SectionCard>
      ) : null}

      {error ? (
        <SectionCard title="Note editor failed" description="当前先直接展示错误。">
          <ThemedText type="small" themeColor="warning">{error}</ThemedText>
        </SectionCard>
      ) : null}

      {!isLoading && !error && !resource ? (
        <SectionCard title="Resource not found" description="当前资源不存在或没有访问权限。">
          <PrimaryButton label="Back" onPress={() => router.back()} variant="secondary" />
        </SectionCard>
      ) : null}

      {resource ? (
        <>
          <SectionCard title="Resource" description={resource.path}>
            <View style={styles.pillRow}>
              <StatusPill label={getResourceTypeText(resource)} tone="tint" />
              <StatusPill label={getResourceStatusText(resource)} tone="textSecondary" />
              <StatusPill label={hasUnsavedChanges ? 'Unsaved changes' : 'Saved'} tone={hasUnsavedChanges ? 'warning' : 'success'} />
            </View>
          </SectionCard>

          <SectionCard title="Editor" description="当前先保留文本编辑，后续再补 markdown richer editor。">
            <PrimaryTextField
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={16}
              textAlignVertical="top"
              style={styles.editorField}
            />
            <View style={styles.actionRow}>
              <PrimaryButton label={isMutating ? 'Saving…' : 'Save note'} onPress={handleSave} disabled={isMutating || !hasUnsavedChanges} />
              <PrimaryButton label={isMutating ? 'Deleting…' : 'Delete note'} onPress={handleDelete} disabled={isMutating} variant="ghost" />
            </View>
          </SectionCard>
        </>
      ) : null}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  editorField: {
    minHeight: 320,
  },
});
