import React, { useState } from 'react';
import { LayoutDashboard, Map, MessageSquare, Settings, Sparkles, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MainLayout = ({ currentTab, onTabSelect, children, hasActivePath }) => {
    const navigate = useNavigate();
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

    const handleNewJourney = () => {
        navigate('/onboarding', { state: { openNewJourneyModal: true } });
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
                <div className="d-flex align-items-center justify-content-between mb-4 px-1 w-100">
                    {!isCollapsed ? (
                        <>
                            <div className="d-flex align-items-center gap-2 overflow-hidden">
                                <Sparkles size={22} className="text-primary flex-shrink-0 animate-pulse" />
                                <h4 className="mb-0 fw-bold themed-text-primary text-truncate" style={{ letterSpacing: '-0.5px', fontSize: '1.15rem' }}>Course Craft</h4>
                            </div>
                            <button 
                                onClick={toggleSidebar}
                                className="sidebar-toggle-btn flex-shrink-0"
                                title="Collapse Sidebar"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </>
                    ) : (
                        <div className="d-flex flex-column align-items-center gap-3 w-100">
                            <Sparkles size={22} className="text-primary animate-pulse" />
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

                {/* Primary Action Button */}
                <div className="mb-3 w-100">
                    {!isCollapsed ? (
                        <button
                            onClick={handleNewJourney}
                            className="btn btn-primary d-flex align-items-center justify-content-center gap-2 w-100 py-2 px-3 rounded-pill fw-semibold shadow-sm text-nowrap"
                            style={{ fontSize: '0.88rem' }}
                        >
                            <Plus size={17} strokeWidth={2.5} />
                            <span>New Journey</span>
                        </button>
                    ) : (
                        <div className="d-flex justify-content-center w-100">
                            <button
                                onClick={handleNewJourney}
                                className="btn btn-primary d-flex align-items-center justify-content-center rounded-circle shadow-sm p-0"
                                style={{ width: '38px', height: '38px' }}
                                title="Start New Journey"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>

                <nav className="flex-grow-1 w-100">
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
                                <Icon size={19} className="flex-shrink-0" />
                                {!isCollapsed && <span className="text-truncate">{item.label}</span>}
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
