import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderGit2, Filter } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { useRightSidebar } from '../../hooks/useRightSidebar';
import ProyectosSidebar from './sidebar/ProyectosSidebar';

const MOCK_PROYECTOS = [
    { id: 1, nombre: 'api-core', lang: 'Node.js', estado: 'activo', commits: 247 },
    { id: 2, nombre: 'dashboard-ui', lang: 'React', estado: 'activo', commits: 189 },
    { id: 3, nombre: 'auth-service', lang: 'Go', estado: 'pausado', commits: 92 },
    { id: 4, nombre: 'data-pipeline', lang: 'Python', estado: 'activo', commits: 334 },
];

export default function ProyectosIndex() {
    const [query, setQuery] = useState('');
    useRightSidebar(<ProyectosSidebar />);

    const filtered = MOCK_PROYECTOS.filter((p) =>
        p.nombre.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="page">
            <div className="page__header">
                <div>
                    <span className="page__kicker">// repositories</span>
                    <h1 className="page__title">Proyectos</h1>
                    <p className="page__subtitle">
                        Lista de repositorios bajo tu gestión.
                    </p>
                </div>
                <Button variant="primary">
                    <Plus size={16} strokeWidth={2.5} />
                    <span>Nuevo proyecto</span>
                </Button>
            </div>

            <div className="toolbar">
                <Input
                    placeholder="Buscar proyecto..."
                    icon={Search}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="toolbar__search"
                />
                <Button variant="ghost">
                    <Filter size={14} strokeWidth={2} />
                    <span>Filtros</span>
                </Button>
            </div>

            <div className="list">
                {filtered.map((p) => (
                    <Link
                        key={p.id}
                        to={`/proyectos/${p.id}`}
                        className="list__item"
                    >
                        <div className="list__item-icon">
                            <FolderGit2 size={18} strokeWidth={2} />
                        </div>
                        <div className="list__item-body">
                            <div className="list__item-title">{p.nombre}</div>
                            <div className="list__item-meta">
                                <span>{p.lang}</span>
                                <span className="list__dot" />
                                <span>{p.commits} commits</span>
                            </div>
                        </div>
                        <span
                            className={`badge badge--${
                                p.estado === 'activo' ? 'ok' : 'muted'
                            }`}
                        >
                            {p.estado}
                        </span>
                    </Link>
                ))}

                {filtered.length === 0 && (
                    <Card className="empty">
                        <p>No hay proyectos que coincidan.</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
