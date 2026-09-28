import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function ConfirmModal({
  open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onClose, children,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose} className="max-w-md">
      <div className="text-sm text-surface-700">{message}</div>
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={handle} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
