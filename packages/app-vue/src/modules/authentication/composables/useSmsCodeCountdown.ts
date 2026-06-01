import { ref, computed, onUnmounted } from 'vue';

/**
 * Shared SMS code countdown logic for authentication forms.
 * Manages sending state, countdown timer, and cleanup.
 */
export function useSmsCodeCountdown() {
  const smsCodeSending = ref(false);
  const smsCodeCountdown = ref(0);
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  const canSendSmsCode = computed(
    () => smsCodeCountdown.value === 0 && !smsCodeSending.value,
  );

  function startCountdown(): void {
    smsCodeSending.value = true;
    smsCodeCountdown.value = 60;
    countdownTimer = setInterval(() => {
      smsCodeCountdown.value--;
      if (smsCodeCountdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }, 1000);

    // Reset sending state after network round-trip
    setTimeout(() => {
      smsCodeSending.value = false;
    }, 1000);
  }

  onUnmounted(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
  });

  return {
    smsCodeSending,
    smsCodeCountdown,
    canSendSmsCode,
    startCountdown,
  };
}
