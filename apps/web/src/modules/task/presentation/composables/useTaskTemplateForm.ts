/**
 * @deprecated This is a backward compatibility shim.
 */
import { ref, computed } from 'vue';

export function useTaskTemplateForm() {
  const isFormValid = ref(true);
  const validationState = ref<Record<string, boolean>>({
    basic: true, time: true, recurrence: true, reminder: true, metadata: true,
  });

  function validateForm() { return isFormValid.value; }
  function updateBasicValidation(v: boolean) { validationState.value.basic = v; recalc(); }
  function updateTimeValidation(v: boolean) { validationState.value.time = v; recalc(); }
  function updateRecurrenceValidation(v: boolean) { validationState.value.recurrence = v; recalc(); }
  function updateReminderValidation(v: boolean) { validationState.value.reminder = v; recalc(); }
  function updateMetadataValidation(v: boolean) { validationState.value.metadata = v; recalc(); }

  function recalc() {
    isFormValid.value = Object.values(validationState.value).every(Boolean);
  }

  return {
    isFormValid: computed(() => isFormValid.value),
    validateForm,
    updateBasicValidation,
    updateTimeValidation,
    updateRecurrenceValidation,
    updateReminderValidation,
    updateMetadataValidation,
  };
}
