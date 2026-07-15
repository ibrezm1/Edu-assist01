import React, { useState } from 'react';
import { LayoutDashboard, Map, MessageSquare, Settings, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const MainLayout = ({ currentTab, onTabSelect, children, hasActivePath }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('getpath_sidebar_collapsed');
        return saved !== null ? saved === 'true' : true;
    });

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('getpath_sidebar_collapsed', String(next));
            return next;
        });
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'path', label: 'Learning Path', icon: Map, disabled: !hasActivePath },
        { id: 'chat', label: 'AI Chat', icon: MessageSquare },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="d-flex min-vh-100 flex-column flex-lg-row">
            {/* Sidebar (Desktop Only) */}
            <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="d-flex align-items-center justify-content-between mb-5 px-1 w-100">
                    {!isCollapsed ? (
                        <>
                            <div className="d-flex align-items-center gap-2">
                                <Sparkles size={24} className="text-primary animate-pulse" />
                                <h4 className="mb-0 fw-bold themed-text-primary" style={{ letterSpacing: '-0.5px', fontSize: '1.2rem' }}>Course Craft</h4>
                            </div>
                            <button 
                                onClick={toggleSidebar}
                                className="sidebar-toggle-btn"
                                title="Collapse Sidebar"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </>
                    ) : (
                        <div className="d-flex flex-column align-items-center gap-3 w-100">
                            <Sparkles size={24} className="text-primary animate-pulse" />
                            <button 
                                onClick={toggleSidebar}
                                className="sidebar-toggle-btn"
                                title="Expand Sidebar"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
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
                                {!isCollapsed && <span>{item.label}</span>}
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
            <main className={`app-main-content flex-grow-1 ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
