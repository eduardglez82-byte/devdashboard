import React from 'react';
import { User, Shield, Bell, Palette } from 'lucide-react';
import Card from '../../components/ui/Card';
import { useRightSidebar } from '../../hooks/useRightSidebar';
import ConfiguracionSidebar from './sidebar/ConfiguracionSidebar';

const SECTIONS = [
    { icon: User, title: 'Perfil', desc: 'Información personal y avatar' },
    { icon: Shield, title: 'Seguridad', desc: 'Contraseña y sesiones activas' },
    { icon: Bell, title: 'Notificaciones', desc: 'Preferencias de alertas' },
    { icon: Palette, title: 'Apariencia', desc: 'Tema, densidad y acentos' },
];

export default function ConfiguracionIndex() {
    useRightSidebar(<ConfiguracionSidebar />);

    return (
        <div className="page">
            <div className="page__header">
                <div>
                    <span className="page__kicker">// preferences</span>
                    <h1 className="page__title">Configuración</h1>
                    <p className="page__subtitle">
                        Administra tu cuenta y preferencias.
                    </p>
                </div>
            </div>

            <div className="config-grid">
                {SECTIONS.map(({ icon: Icon, title, desc }) => (
                    <Card key={title} className="config-card">
                        <div className="config-card__icon">
                            <Icon size={18} strokeWidth={2} />
                        </div>
                        <h3 className="config-card__title">{title}</h3>
                        <p className="config-card__desc">{desc}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}
