import { useState, useCallback } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';

export function useConfirm() {
  const [state, setState] = useState({
    open: false,
    resolve: null,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    variant: 'danger',
  });

  const confirm = useCallback(({ title, message, confirmLabel = 'Confirm', variant = 'danger' }) => {
    return new Promise((resolve) => {
      setState({ open: true, resolve, title, message, confirmLabel, variant });
    });
  }, []);

  const handleConfirm = () => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false }));
  };

  const handleCancel = () => {
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
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, confirmEl };
}
