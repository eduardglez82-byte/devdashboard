import React from 'react';
import { cn } from '../../utils/cn';

export default function Card({ children, className = '', padded = true, ...rest }) {
    return (
        <div
            className={cn('card', padded && 'card--padded', className)}
            {...rest}
        >
            {children}
        </div>
    );
}

export function CardHeader({ title, subtitle, actions }) {
    return (
        <div className="card__header">
            <div>
                <h3 className="card__title">{title}</h3>
                {subtitle && <p className="card__subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="card__actions">{actions}</div>}
        </div>
    );
}
