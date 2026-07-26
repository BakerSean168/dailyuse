import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { ReviewType, type CreateGoalReviewReq } from '@dailyuse/contracts/goal';

import { useGoalDetail } from '../hooks/useGoalDetail';
import { useGoalReviews } from '../hooks/useGoalReviews';
import { useGoalService } from '../hooks/useGoalService';
import { formatProductDate, emptyKind } from '../utils/product-time';

import {
  PageShell,
  PrimaryButton,
  PrimaryTextField,
  SectionCard,
  Spacing,
  StatusPill,
  ThemedText,
  ThemedView,
} from '@dailyuse/ui-react-native';

const REVIEW_TYPES = Object.values(ReviewType);

export function GoalReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const goalId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;
  const service = useGoalService();
  const { goal } = useGoalDetail(goalId);
  const { error, isLoading, refresh, reviews } = useGoalReviews(goalId);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextActions, setNextActions] = useState('');
  const [reviewType, setReviewType] = useState<(typeof REVIEW_TYPES)[number]>('Weekly');
  const [rating, setRating] = useState('4');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateReview() {
    if (!goalId) {
      setSubmitError('Missing goal id.');
      return;
    }

    if (title.trim().length === 0 || content.trim().length === 0) {
      setSubmitError('Review title and content are required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const numericRating = Number.parseInt(rating, 10);
    const result = await service.createGoalReview(goalId, {
      goalId: goalId as CreateGoalReviewReq['goalId'],
      title: title.trim(),
      content: content.trim(),
      reviewType,
      rating: Number.isNaN(numericRating) ? undefined : numericRating,
      achievements: achievements.trim().length > 0 ? achievements.trim() : undefined,
      challenges: challenges.trim().length > 0 ? challenges.trim() : undefined,
      nextActions: nextActions.trim().length > 0 ? nextActions.trim() : undefined,
      reviewedAt: Date.now(),
    } satisfies CreateGoalReviewReq);

    setIsSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error.message);
      return;
    }

    setTitle('');
    setContent('');
    setAchievements('');
    setChallenges('');
    setNextActions('');
    setRating('4');
    await refresh();
  }

  return (
    <PageShell
      eyebrow="Goals"
      title={goal ? `${goal.name} reviews` : 'Goal reviews'}
      subtitle="目标 review 已经接进移动端，列表、创建和详情编辑链路都已接通。"
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}>
      <SectionCard title="Navigation" description="review 作为目标详情页的次级 screen。">
        <View style={styles.actionRow}>
          <PrimaryButton label="Back to goal" onPress={() => router.back()} variant="secondary" />
        </View>
      </SectionCard>

      {error ? (
        <SectionCard title="Review load failed" description="当前先直接展示错误。">
          <ThemedText type="small" themeColor="warning">{error}</ThemedText>
        </SectionCard>
      ) : null}

      {submitError ? (
        <SectionCard title="Review save failed" description="当前先直接展示错误。">
          <ThemedText type="small" themeColor="warning">{submitError}</ThemedText>
        </SectionCard>
      ) : null}

      <SectionCard title="New review" description="移动端先用单页表单创建 review。">
        <PrimaryTextField label="Title" value={title} onChangeText={setTitle} placeholder="Weekly review" />
        <PrimaryTextField
          label="Summary"
          value={content}
          onChangeText={setContent}
          placeholder="What happened this period"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.multilineField}
        />
        <PrimaryTextField label="Achievements" value={achievements} onChangeText={setAchievements} placeholder="What went well" />
        <PrimaryTextField label="Challenges" value={challenges} onChangeText={setChallenges} placeholder="What blocked progress" />
        <PrimaryTextField label="Next actions" value={nextActions} onChangeText={setNextActions} placeholder="What to do next" />
        <PrimaryTextField label="Rating" value={rating} onChangeText={setRating} placeholder="1-5" keyboardType="numeric" />
        <View style={styles.optionRow}>
          {REVIEW_TYPES.map((item) => (
            <PrimaryButton key={item} label={item} onPress={() => setReviewType(item)} variant={reviewType === item ? 'solid' : 'ghost'} />
          ))}
        </View>
        <PrimaryButton label={isSubmitting ? 'Saving…' : 'Create review'} onPress={handleCreateReview} disabled={isSubmitting} />
      </SectionCard>

      <SectionCard title="Review history" description="review 现在可以继续下钻到详情页编辑。">
        <View style={styles.listColumn}>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ThemedView key={review.id} type="backgroundSelected" style={styles.reviewCard}>
                <View style={styles.headerRow}>
                  <ThemedText type="smallBold">{review.type}</ThemedText>
                  <StatusPill label={`${review.rating}/5`} tone="tint" />
                </View>
                <ThemedText type="small">{review.summary}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Reviewed on {formatProductDate(review.reviewedAt, emptyKind('dash'))}</ThemedText>
                {review.achievements ? <ThemedText type="small">Achievements: {review.achievements}</ThemedText> : null}
                {review.challenges ? <ThemedText type="small">Challenges: {review.challenges}</ThemedText> : null}
                {review.improvements ? <ThemedText type="small">Next: {review.improvements}</ThemedText> : null}
                {goalId ? (
                  <PrimaryButton
                    label="Open review detail"
                    onPress={() => router.push(`./review-detail?id=${goalId}&reviewId=${review.id}`)}
                    variant="ghost"
                  />
                ) : null}
              </ThemedView>
            ))
          ) : (
            <ThemedText type="small" themeColor="textSecondary">当前还没有 review。</ThemedText>
          )}
        </View>
      </SectionCard>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  listColumn: {
    gap: Spacing.three,
  },
  reviewCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  multilineField: {
    minHeight: 110,
  },
});
