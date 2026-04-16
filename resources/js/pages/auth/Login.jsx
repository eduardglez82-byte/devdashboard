import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Terminal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const from = location.state?.from?.pathname || '/';

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                'Credenciales incorrectas. Intenta de nuevo.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login">
            <div className="login__brand">
                <div className="login__brand-mark">
                    <Terminal size={20} strokeWidth={2.5} />
                </div>
                <span className="login__brand-name">
                    DevDashboard<span className="login__caret">_</span>
                </span>
            </div>

            <div className="login__card">
                <div className="login__header">
                    <span className="login__kicker">// access control</span>
                    <h1 className="login__title">Iniciar sesión</h1>
                    <p className="login__subtitle">
                        Ingresa tus credenciales para continuar.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="login__form">
                    <Input
                        label="Correo"
                        type="email"
                        placeholder="tu@correo.com"
                        icon={Mail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        icon={Lock}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    {error && <div className="login__error">{error}</div>}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        className="login__submit"
                    >
                        <span>Entrar</span>
                        <ArrowRight size={16} strokeWidth={2.5} />
                    </Button>
                </form>

                <div className="login__footer">
                    <span className="login__footer-dot" />
                    <span>sesión segura · sanctum cookie auth</span>
                </div>
            </div>
        </div>
    );
}
