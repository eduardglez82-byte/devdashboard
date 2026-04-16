import React from 'react';
import { Terminal } from 'lucide-react';

export default function Logo({ collapsed = false }) {
    return (
        <div className="logo">
            <div className="logo__mark">
                <Terminal size={18} strokeWidth={2.5} />
            </div>
            {!collapsed && (
                <div className="logo__text">
                    <span className="logo__name">DevDashboard</span>
                    <span className="logo__caret">_</span>
                </div>
            )}
        </div>
    );
}
