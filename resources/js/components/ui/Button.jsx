import React from 'react';
import { cn } from '../../utils/cn';

export default function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    type = 'button',
    loading = false,
    disabled,
    ...rest
}) {
    return (
        <button
            type={type}
            className={cn(
                'btn',
                `btn--${variant}`,
                `btn--${size}`,
                loading && 'btn--loading',
                className
            )}
            disabled={disabled || loading}
            {...rest}
        >
            {loading && <span className="btn__spinner" aria-hidden="true" />}
            <span className="btn__content">{children}</span>
        </button>
    );
}
