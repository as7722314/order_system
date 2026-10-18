import { reactive } from "vue";
import { useAdminFeedback } from "./useAdminFeedback";

type ConfirmationOptions = {
  title: string;
  description: string;
  confirmLabel: string;
  errorMessage: string;
  danger?: boolean;
  reasonLabel?: string;
  action: (reason: string) => Promise<void>;
};

export type ConfirmationState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger: boolean;
  reasonLabel: string;
  reason: string;
  busy: boolean;
  error: string;
};

export function useConfirmation() {
  const confirmation = reactive<ConfirmationState>({
    open: false, title: "", description: "", confirmLabel: "確認", danger: false,
    reasonLabel: "", reason: "", busy: false, error: ""
  });
  let current: ConfirmationOptions | undefined;

  function requestConfirmation(options: ConfirmationOptions): void {
    if (confirmation.busy) return;
    current = options;
    Object.assign(confirmation, {
      open: true, title: options.title, description: options.description,
      confirmLabel: options.confirmLabel, danger: options.danger ?? false,
      reasonLabel: options.reasonLabel ?? "", reason: "", error: ""
    });
  }

  function closeConfirmation(): void {
    if (!confirmation.busy) confirmation.open = false;
  }

  async function confirmAction(): Promise<void> {
    if (!current || !confirmation.open || confirmation.busy) return;
    confirmation.busy = true;
    confirmation.error = "";
    try {
      await current.action(confirmation.reason.trim());
      confirmation.open = false;
    } catch {
      confirmation.error = current.errorMessage;
      useAdminFeedback().error(current.errorMessage);
    } finally {
      confirmation.busy = false;
    }
  }

  return { confirmation, requestConfirmation, closeConfirmation, confirmAction };
}
