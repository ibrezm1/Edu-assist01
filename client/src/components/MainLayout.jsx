import React from 'react';
import { LayoutDashboard, Map, MessageSquare, Settings, Sparkles } from 'lucide-react';

const MainLayout = ({ currentTab, onTabSelect, children, hasActivePath }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'path', label: 'Learning Path', icon: Map, disabled: !hasActivePath },
        { id: 'chat', label: 'AI Chat', icon: MessageSquare },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="d-flex min-vh-100 flex-column flex-lg-row">
            {/* Sidebar (Desktop Only) */}
            <aside className="app-sidebar">
                <div className="d-flex align-items-center gap-2 mb-5 px-2">
                    <Sparkles size={26} className="text-primary" />
                    <h4 className="mb-0 fw-bold themed-text-primary" style={{ letterSpacing: '-0.5px' }}>Course Craft</h4>
                </div>

                <nav className="flex-grow-1">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => !item.disabled && onTabSelect(item.id)}
                                className={`nav-item-btn sidebar-nav-btn ${isActive ? 'active' : ''} ${item.disabled ? 'opacity-25' : ''}`}
                                style={item.disabled ? { cursor: 'not-allowed' } : {}}
                                disabled={item.disabled}
                                title={item.disabled ? 'Select a topic to start a path first' : item.label}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Bottom Navigation (Mobile Only) */}
            <nav className="app-bottom-nav">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => !item.disabled && onTabSelect(item.id)}
                            className={`nav-item-btn bottom-nav-btn ${isActive ? 'active' : ''} ${item.disabled ? 'opacity-25' : ''}`}
                            style={item.disabled ? { cursor: 'not-allowed' } : {}}
                            disabled={item.disabled}
                            title={item.disabled ? 'Select a topic to start a path first' : item.label}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Main Content Area */}
            <main className="app-main-content flex-grow-1">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
