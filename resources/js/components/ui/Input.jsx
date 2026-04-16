import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(function Input(
    { label, error, icon: Icon, className = '', id, ...rest },
    ref
) {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    return (
        <div className={cn('field', error && 'field--error', className)}>
            {label && (
                <label htmlFor={inputId} className="field__label">
                    {label}
                </label>
            )}
            <div className="field__control">
                {Icon && (
                    <span className="field__icon">
                        <Icon size={16} strokeWidth={2} />
                    </span>
                )}
                <input
                    id={inputId}
                    ref={ref}
                    className={cn('field__input', Icon && 'field__input--has-icon')}
                    {...rest}
                />
            </div>
            {error && <span className="field__error">{error}</span>}
        </div>
    );
});

export default Input;
