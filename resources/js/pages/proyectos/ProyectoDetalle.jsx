import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, GitBranch, Star, GitCommit } from 'lucide-react';
import Card from '../../components/ui/Card';
import { useRightSidebar } from '../../hooks/useRightSidebar';
import ProyectosSidebar from './sidebar/ProyectosSidebar';

export default function ProyectoDetalle() {
    const { id } = useParams();
    useRightSidebar(<ProyectosSidebar />);

    return (
        <div className="page">
            <Link to="/proyectos" className="back-link">
                <ArrowLeft size={14} strokeWidth={2.5} />
                <span>Volver a proyectos</span>
            </Link>

            <div className="page__header">
                <div>
                    <span className="page__kicker">// project #{id}</span>
                    <h1 className="page__title">Detalle del proyecto</h1>
                    <p className="page__subtitle">
                        Información, ramas y actividad del repositorio.
                    </p>
                </div>
            </div>

            <div className="panels-grid">
                <Card>
                    <div className="panel__head">
                        <h3 className="panel__title">
                            <GitBranch size={14} strokeWidth={2} /> Ramas
                        </h3>
                    </div>
                    <ul className="mini-list">
                        <li>
                            <span>main</span>
                            <span className="mini-list__tag">default</span>
                        </li>
                        <li>
                            <span>feat/auth-refactor</span>
                            <span className="mini-list__meta">hace 2 h</span>
                        </li>
                        <li>
                            <span>fix/navbar-overflow</span>
                            <span className="mini-list__meta">hace 1 día</span>
                        </li>
                    </ul>
                </Card>

                <Card>
                    <div className="panel__head">
                        <h3 className="panel__title">
                            <GitCommit size={14} strokeWidth={2} /> Últimos commits
                        </h3>
                    </div>
                    <ul className="mini-list">
                        <li>
                            <span>feat: agregar endpoint /metrics</span>
                            <span className="mini-list__meta">#a3f9c1</span>
                        </li>
                        <li>
                            <span>fix: timezone en reportes</span>
                            <span className="mini-list__meta">#b4e201</span>
                        </li>
                        <li>
                            <span>chore: bump deps</span>
                            <span className="mini-list__meta">#c82d17</span>
                        </li>
                    </ul>
                </Card>
            </div>
        </div>
    );
}
