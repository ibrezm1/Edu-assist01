import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { ArrowLeft, MessageSquare, Settings as SettingsIcon, Menu, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNavigation = ({ title, onBack, onChat, onSettings, onNewJourney, children, theme }) => {
    const navigate = useNavigate();

    const handleNewJourney = () => {
        if (onNewJourney) {
            onNewJourney();
        } else {
            navigate('/onboarding', { state: { openNewJourneyModal: true } });
        }
    };

    return (
        <Navbar expand="lg" className="mb-4 glass-panel py-2" variant={theme === 'light' ? 'light' : 'dark'}>
            <Container fluid className="flex-nowrap align-items-center">
                <div className="d-flex align-items-center gap-2 overflow-hidden me-auto" style={{ minWidth: 0, flexShrink: 1 }}>
                    {onBack && (
                        <Button
                            variant="link"
                            className="p-0 text-secondary flex-shrink-0"
                            onClick={onBack}
                        >
                            <ArrowLeft size={24} />
                        </Button>
                    )}
                    <Navbar.Brand
                        className="fw-bold themed-text-primary m-0 text-truncate"
                        title={title}
                        style={{ maxWidth: '100%' }}
                    >
                        {title || 'EduAssist'}
                    </Navbar.Brand>
                </div>

                <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 p-0 text-primary flex-shrink-0 ms-2">
                    <Menu size={24} />
                </Navbar.Toggle>

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto align-items-stretch align-items-lg-center gap-2 mt-3 mt-lg-0 flex-column flex-lg-row">
                        {/* Page specific actions passed as children */}
                        {children}

                        {/* Divider for mobile */}
                        <div className="d-lg-none my-2 border-top border-secondary opacity-25"></div>

                        {/* Global Actions */}
                        <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleNewJourney}
                                className="d-flex align-items-center gap-1.5 justify-content-center fw-semibold shadow-sm text-nowrap"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                <span>New Journey</span>
                            </Button>
                            {onChat && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={onChat}
                                    className="d-flex align-items-center gap-2 justify-content-center text-nowrap"
                                >
                                    <MessageSquare size={16} />
                                    <span>Chat</span>
                                </Button>
                            )}
                            {onSettings && (
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={onSettings}
                                    className="d-flex align-items-center gap-2 justify-content-center text-nowrap"
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
