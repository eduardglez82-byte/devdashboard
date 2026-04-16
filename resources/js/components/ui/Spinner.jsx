import React from 'react';
import { cn } from '../../utils/cn';

export default function Spinner({ size = 'md', className = '' }) {
    return (
        <span
            className={cn('spinner', `spinner--${size}`, className)}
            role="status"
            aria-label="Cargando"
        />
    );
}
