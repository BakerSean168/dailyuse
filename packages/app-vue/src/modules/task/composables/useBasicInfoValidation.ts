import { ref, type Ref } from 'vue';

export interface BasicInfoValidationErrors {
  title?: string;
  description?: string;
}

/**
 * Validates the basic info section of a task template form.
 * Used by BasicInfoSection.vue — called as `validate(title, description)`.
 */
export function useBasicInfoValidation() {
  const validationErrors: Ref<BasicInfoValidationErrors> = ref({});
  const isValid = ref(false);

  const validate = (title: string, description: string): boolean => {
    const errors: BasicInfoValidationErrors = {};

    if (!title || title.trim().length === 0) {
      errors.title = 'Title is required';
    }

    validationErrors.value = errors;
    isValid.value = Object.keys(errors).length === 0;
    return isValid.value;
  };

  return {
    validate,
    validationErrors,
    isValid,
  };
}
