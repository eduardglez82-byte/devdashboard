import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

function initials(name = '') {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join('');
}

export default function UserMenu() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const handleLogout = async () => {
        setOpen(false);
        await logout();
    };

    if (!user) return null;

    return (
        <div className="user-menu" ref={ref}>
            <button
                type="button"
                className={cn('user-menu__trigger', open && 'user-menu__trigger--open')}
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <span className="user-menu__avatar">{initials(user.name) || '?'}</span>
                <span className="user-menu__info">
                    <span className="user-menu__name">{user.name}</span>
                    <span className="user-menu__email">{user.email}</span>
                </span>
                <ChevronDown
                    size={14}
                    strokeWidth={2.5}
                    className={cn('user-menu__caret', open && 'user-menu__caret--open')}
                />
            </button>

            {open && (
                <div className="user-menu__dropdown" role="menu">
                    <div className="user-menu__dropdown-header">
                        <span className="user-menu__avatar user-menu__avatar--lg">
                            {initials(user.name) || '?'}
                        </span>
                        <div>
                            <div className="user-menu__name">{user.name}</div>
                            <div className="user-menu__email">{user.email}</div>
                        </div>
                    </div>

                    <div className="user-menu__divider" />

                    <button type="button" className="user-menu__item" role="menuitem">
                        <UserIcon size={16} strokeWidth={2} />
                        <span>Mi perfil</span>
                    </button>

                    <div className="user-menu__divider" />

                    <button
                        type="button"
                        className="user-menu__item user-menu__item--danger"
                        onClick={handleLogout}
                        role="menuitem"
                    >
                        <LogOut size={16} strokeWidth={2} />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            )}
        </div>
    );
}
