import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import type { GoalReviewSummary } from '../hooks/use-goal-reviews';
import { useGoalService } from '../hooks/use-goal-service';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
} from '@dailyuse/ui-react-native';

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

export function GoalReviewDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[]; reviewId?: string | string[] }>();
  const goalId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
  const reviewId = typeof params.reviewId === 'string' ? params.reviewId : Array.isArray(params.reviewId) ? params.reviewId[0] : null;
  const service = useGoalService();

  const [review, setReview] = useState<GoalReviewSummary | null>(null);
  const [summary, setSummary] = useState('');
  const [rating, setRating] = useState('');
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [improvements, setImprovements] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!goalId || !reviewId) {
      setReview(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await service.getGoalReviews(goalId);
    if (!result.ok) {
      setReview(null);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    const found = result.data.reviews
      .map((item) => item.toDTO())
      .find((item) => String(item.id) === reviewId);

    if (!found) {
      setReview(null);
      setIsLoading(false);
      return;
    }

    const nextReview: GoalReviewSummary = {
      id: String(found.id),
      goalId: String(found.goalId),
      type: found.type,
      rating: found.rating,
      summary: found.summary,
      achievements: found.achievements,
      challenges: found.challenges,
      improvements: found.improvements,
      reviewedAt: found.reviewedAt,
      createdAt: found.createdAt,
    };

    setReview(nextReview);
    setSummary(nextReview.summary);
    setRating(String(nextReview.rating));
    setAchievements(nextReview.achievements ?? '');
    setChallenges(nextReview.challenges ?? '');
    setImprovements(nextReview.improvements ?? '');
    setIsLoading(false);
  }

  useEffect(() => {
    void load();
  }, [goalId, reviewId]);

  async function handleSave() {
    if (!goalId || !reviewId) {
      return;
    }

    setIsMutating(true);
    setError(null);
    const result = await service.updateGoalReview(goalId, reviewId, {
      content: summary.trim(),
      rating: Number.parseInt(rating, 10) || undefined,
      achievements: achievements.trim() || null,
      challenges: challenges.trim() || null,
      nextActions: improvements.trim() || null,
    } as never);
    setIsMutating(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    await load();
  }

  async function handleDelete() {
    if (!goalId || !reviewId) {
      return;
    }

    setIsMutating(true);
    setError(null);
    const result = await service.deleteGoalReview(goalId, reviewId);
    setIsMutating(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    router.back();
  }

  return (
    <PageShell
      eyebrow="Goals"
      title={review ? `${review.type} review` : 'Review detail'}
      subtitle="review 详情页承接编辑和删除，不再只停留在列表摘要。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}>
      <SectionCard title="Navigation" description="review 详情从 review 列表继续下钻。">
        <PrimaryButton label="Back to reviews" onPress={() => router.back()} variant="secondary" />
      </SectionCard>

      {error ? (
        <SectionCard title="Review request failed" description="当前先直接展示错误。">
          <ThemedText type="small" themeColor="warning">{error}</ThemedText>
        </SectionCard>
      ) : null}

      {!isLoading && !error && !review ? (
        <SectionCard title="Review not found" description="该 review 不存在或没有访问权限。">
          <PrimaryButton label="Back" onPress={() => router.back()} variant="secondary" />
        </SectionCard>
      ) : null}

      {review ? (
        <>
          <SectionCard title="Overview" description="先保留 review 类型、评分和复盘时间。">
            <View style={styles.pillRow}>
              <StatusPill label={review.type} tone="tint" />
              <StatusPill label={`${review.rating}/5`} tone="success" />
            </View>
            <ThemedText type="small" themeColor="textSecondary">Reviewed at {formatDate(review.reviewedAt)}</ThemedText>
          </SectionCard>

          <SectionCard title="Edit review" description="review 详情页现在可以直接修改核心字段。">
            <PrimaryTextField
              label="Summary"
              value={summary}
              onChangeText={setSummary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.multilineField}
            />
            <PrimaryTextField label="Rating" value={rating} onChangeText={setRating} keyboardType="numeric" />
            <PrimaryTextField label="Achievements" value={achievements} onChangeText={setAchievements} />
            <PrimaryTextField label="Challenges" value={challenges} onChangeText={setChallenges} />
            <PrimaryTextField label="Next actions" value={improvements} onChangeText={setImprovements} />
            <View style={styles.actionRow}>
              <PrimaryButton label={isMutating ? 'Saving…' : 'Save review'} onPress={handleSave} disabled={isMutating} />
              <PrimaryButton label={isMutating ? 'Deleting…' : 'Delete review'} onPress={handleDelete} disabled={isMutating} variant="ghost" />
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
  multilineField: {
    minHeight: 100,
  },
});
