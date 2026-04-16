import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className={cn('modal__panel', `modal__panel--${size}`)}>
                <div className="modal__header">
                    <h3 className="modal__title">{title}</h3>
                    <button
                        type="button"
                        className="modal__close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <X size={16} strokeWidth={2} />
                    </button>
                </div>
                <div className="modal__body">{children}</div>
            </div>
        </div>
    );
}
