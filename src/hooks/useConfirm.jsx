import { useState, useCallback } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';
import { extractErrorMessage } from '../lib/utils';

export function useConfirm() {
  const [state, setState] = useState({
    open: false,
    resolve: null,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    variant: 'danger',
    onConfirm: null,
    loading: false,
    error: '',
  });

  // `onConfirm`, when given, is the actual async action (the API call and
  // whatever follows it) — the modal stays open and shows its own loading
  // state while it runs, and only closes once it resolves. An error keeps
  // the modal open so the user can see what happened and retry or cancel,
  // instead of the modal vanishing before the result is known.
  const confirm = useCallback(
    ({ title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm }) => {
      return new Promise((resolve) => {
        setState({
          open: true,
          resolve,
          title,
          message,
          confirmLabel,
          variant,
          onConfirm,
          loading: false,
          error: '',
        });
      });
    },
    [],
  );

  const handleConfirm = async () => {
    if (!state.onConfirm) {
      state.resolve?.(true);
      setState((s) => ({ ...s, open: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      await state.onConfirm();
      state.resolve?.(true);
      setState((s) => ({ ...s, open: false, loading: false }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: extractErrorMessage(err) }));
    }
  };

  const handleCancel = () => {
    if (state.loading) return;
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false }));
  };

  const confirmEl = (
    <ConfirmModal
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      variant={state.variant}
      loading={state.loading}
      error={state.error}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, confirmEl };
}
