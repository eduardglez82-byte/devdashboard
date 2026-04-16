import React from 'react';
import { Tag, Star, Archive } from 'lucide-react';

export default function ProyectosSidebar() {
    return (
        <div className="ctx-sidebar">
            <div className="ctx-sidebar__section">
                <div className="ctx-sidebar__label">// filters</div>
                <ul className="ctx-sidebar__menu">
                    <li>
                        <button type="button">
                            <Star size={14} strokeWidth={2} />
                            <span>Favoritos</span>
                            <span className="ctx-sidebar__count">3</span>
                        </button>
                    </li>
                    <li>
                        <button type="button">
                            <Archive size={14} strokeWidth={2} />
                            <span>Archivados</span>
                            <span className="ctx-sidebar__count">7</span>
                        </button>
                    </li>
                </ul>
            </div>

            <div className="ctx-sidebar__section">
                <div className="ctx-sidebar__label">// tags</div>
                <div className="tag-cloud">
                    <span className="tag">
                        <Tag size={10} /> backend
                    </span>
                    <span className="tag">
                        <Tag size={10} /> frontend
                    </span>
                    <span className="tag">
                        <Tag size={10} /> data
                    </span>
                    <span className="tag">
                        <Tag size={10} /> infra
                    </span>
                    <span className="tag">
                        <Tag size={10} /> mobile
                    </span>
                </div>
            </div>
        </div>
    );
}
