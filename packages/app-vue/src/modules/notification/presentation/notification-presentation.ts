import type { ComposerTranslation } from 'vue-i18n';
import type { NotificationClientDTO } from '@memoflow/contracts/notification';

export interface NotificationPresentation {
  categoryLabel: string;
  workflowLabel: string;
  relatedEntityLabel: string | null;
}

export function presentNotification(
  notification: Pick<NotificationClientDTO, 'category' | 'workflowKey' | 'relatedEntityType'>,
  t: ComposerTranslation,
): NotificationPresentation {
  const categoryKey = `notification.category.${String(notification.category).toLowerCase()}`;
  const categoryLabel = t(categoryKey, notification.category);
  const workflowKey = notification.workflowKey;
  const workflowLabel =
    t(`notification.workflow.${workflowKey}`, '') || categoryLabel;
  const relatedEntityLabel = notification.relatedEntityType
    ? t(
        `notification.entity.${String(notification.relatedEntityType).toLowerCase()}`,
        notification.relatedEntityType,
      )
    : null;
  return { categoryLabel, workflowLabel, relatedEntityLabel };
}
