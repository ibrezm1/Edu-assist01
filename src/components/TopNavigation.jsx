import React from 'react';
import { Navbar, Container, Button } from 'react-bootstrap';
import { ArrowLeft, MessageSquare, Settings as SettingsIcon, Plus } from 'lucide-react';
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
        <Navbar
            expand={false}
            className="mb-3 glass-panel py-2 px-2 px-md-3 align-items-center top-navbar position-relative"
            style={{ zIndex: 1020 }}
            variant={theme === 'light' ? 'light' : 'dark'}
        >
            <Container fluid className="px-0 d-flex align-items-center justify-content-between gap-2 flex-nowrap">
                {/* Left: Back button & Title */}
                <div className="d-flex align-items-center gap-1.5 gap-md-2 overflow-hidden" style={{ minWidth: 0, flex: '1 1 auto' }}>
                    {onBack && (
                        <Button
                            variant="link"
                            className="p-1.5 text-secondary flex-shrink-0 d-inline-flex align-items-center justify-content-center rounded-3 nav-back-btn border-0"
                            onClick={onBack}
                            aria-label="Go Back"
                            title="Go Back"
                        >
                            <ArrowLeft size={19} />
                        </Button>
                    )}
                    <Navbar.Brand
                        className="fw-bold themed-text-primary m-0 text-truncate fs-5"
                        title={title}
                        style={{ minWidth: 0 }}
                    >
                        {title || 'Course Craft'}
                    </Navbar.Brand>
                </div>

                {/* Right: Actions & Page Controls */}
                <div className="d-flex align-items-center gap-1.5 gap-md-2 flex-shrink-0 ms-auto">
                    {children}

                    {onNewJourney && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleNewJourney}
                            className="d-flex align-items-center gap-1.5 justify-content-center fw-semibold shadow-sm text-nowrap py-1.5 px-2.5 px-md-3 rounded-pill"
                            title="Start New Journey"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            <span className="d-none d-sm-inline">New Journey</span>
                        </Button>
                    )}

                    {/* Desktop-only subtle icon buttons if onChat/onSettings are explicitly provided and not on mobile */}
                    {onChat && (
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={onChat}
                            className="d-none d-xl-inline-flex align-items-center justify-content-center p-1.5 rounded-pill"
                            title="AI Chat"
                            style={{ width: '32px', height: '32px' }}
                        >
                            <MessageSquare size={15} />
                        </Button>
                    )}
                    {onSettings && (
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={onSettings}
                            className="d-none d-xl-inline-flex align-items-center justify-content-center p-1.5 rounded-pill"
                            title="Settings"
                            style={{ width: '32px', height: '32px' }}
                        >
                            <SettingsIcon size={15} />
                        </Button>
                    )}
                </div>
            </Container>
        </Navbar>
    );
};

export default TopNavigation;
