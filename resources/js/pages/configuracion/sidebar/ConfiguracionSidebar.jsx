import React from 'react';
import { HelpCircle, ExternalLink } from 'lucide-react';

export default function ConfiguracionSidebar() {
    return (
        <div className="ctx-sidebar">
            <div className="ctx-sidebar__section">
                <div className="ctx-sidebar__label">// help</div>
                <ul className="ctx-sidebar__menu">
                    <li>
                        <button type="button">
                            <HelpCircle size={14} strokeWidth={2} />
                            <span>Documentación</span>
                        </button>
                    </li>
                    <li>
                        <button type="button">
                            <ExternalLink size={14} strokeWidth={2} />
                            <span>Soporte</span>
                        </button>
                    </li>
                </ul>
            </div>

            <div className="ctx-sidebar__section">
                <div className="ctx-sidebar__label">// version</div>
                <div
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--fg-subtle)',
                        padding: '8px 10px',
                    }}
                >
                    devdashboard v0.1.0
                </div>
            </div>
        </div>
    );
}
