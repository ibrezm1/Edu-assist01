import React, { useState } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { ArrowLeft, MessageSquare, Settings as SettingsIcon, Menu, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNavigation = ({ title, onBack, onChat, onSettings, onNewJourney, children, theme }) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    const handleNewJourney = () => {
        setExpanded(false);
        if (onNewJourney) {
            onNewJourney();
        } else {
            navigate('/onboarding', { state: { openNewJourneyModal: true } });
        }
    };

    const handleChat = () => {
        setExpanded(false);
        if (onChat) onChat();
    };

    const handleSettings = () => {
        setExpanded(false);
        if (onSettings) onSettings();
    };

    return (
        <Navbar 
            expand="lg" 
            expanded={expanded}
            onToggle={setExpanded}
            className="mb-4 glass-panel py-2 px-3 position-relative" 
            variant={theme === 'light' ? 'light' : 'dark'}
        >
            <Container fluid className="px-0 flex-nowrap align-items-center">
                <div className="d-flex align-items-center gap-2 overflow-hidden me-auto" style={{ minWidth: 0, flexShrink: 1 }}>
                    {onBack && (
                        <Button
                            variant="link"
                            className="p-1 text-secondary flex-shrink-0"
                            onClick={() => {
                                setExpanded(false);
                                onBack();
                            }}
                            aria-label="Go Back"
                        >
                            <ArrowLeft size={22} />
                        </Button>
                    )}
                    <Navbar.Brand
                        className="fw-bold themed-text-primary m-0 text-truncate fs-5"
                        title={title}
                        style={{ maxWidth: '100%' }}
                    >
                        {title || 'EduAssist'}
                    </Navbar.Brand>
                </div>

                {/* Custom Toggle Button for Mobile */}
                <Navbar.Toggle 
                    aria-controls="basic-navbar-nav" 
                    className="border-0 p-2 text-primary flex-shrink-0 ms-2 rounded-3 shadow-none focus-ring-0"
                    style={{ background: 'rgba(99, 102, 241, 0.12)' }}
                >
                    {expanded ? <X size={22} className="text-primary" /> : <Menu size={22} className="text-primary" />}
                </Navbar.Toggle>

                <Navbar.Collapse id="basic-navbar-nav" className="mt-2 mt-lg-0">
                    <Nav className="ms-auto align-items-stretch align-items-lg-center gap-2 flex-column flex-lg-row p-3 p-lg-0 rounded-3 nav-collapse-mobile">
                        {/* Page specific actions passed as children */}
                        {children && (
                            <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2" onClick={() => setExpanded(false)}>
                                {children}
                            </div>
                        )}

                        {/* Divider for mobile */}
                        {children && <div className="d-lg-none my-1 border-top border-secondary opacity-25"></div>}

                        {/* Global Actions */}
                        <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleNewJourney}
                                className="d-flex align-items-center gap-2 justify-content-center fw-semibold shadow-sm text-nowrap py-2 py-lg-1.5 px-3 rounded-pill"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                <span>New Journey</span>
                            </Button>
                            {onChat && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={handleChat}
                                    className="d-flex align-items-center gap-2 justify-content-center text-nowrap py-2 py-lg-1.5 px-3 rounded-pill"
                                >
                                    <MessageSquare size={16} />
                                    <span>Chat</span>
                                </Button>
                            )}
                            {onSettings && (
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={handleSettings}
                                    className="d-flex align-items-center gap-2 justify-content-center text-nowrap py-2 py-lg-1.5 px-3 rounded-pill"
                                >
                                    <SettingsIcon size={16} />
                                    <span>Settings</span>
                                </Button>
                            )}
                        </div>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default TopNavigation;
