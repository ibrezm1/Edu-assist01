import React, { useState } from 'react';
import { Navbar, Container, Button, Offcanvas } from 'react-bootstrap';
import { ArrowLeft, MessageSquare, Settings as SettingsIcon, Menu, Plus, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNavigation = ({ title, onBack, onChat, onSettings, onNewJourney, children, theme }) => {
    const navigate = useNavigate();
    const [showDrawer, setShowDrawer] = useState(false);

    const handleNewJourney = () => {
        setShowDrawer(false);
        if (onNewJourney) {
            onNewJourney();
        } else {
            navigate('/onboarding', { state: { openNewJourneyModal: true } });
        }
    };

    const handleChat = () => {
        setShowDrawer(false);
        if (onChat) onChat();
    };

    const handleSettings = () => {
        setShowDrawer(false);
        if (onSettings) onSettings();
    };

    return (
        <>
            <Navbar 
                expand="lg" 
                className="mb-4 glass-panel py-2 px-3 align-items-center" 
                variant={theme === 'light' ? 'light' : 'dark'}
            >
                <Container fluid className="px-0 flex-nowrap align-items-center">
                    <div className="d-flex align-items-center gap-2 me-auto overflow-hidden" style={{ minWidth: 0 }}>
                        {/* Hamburger Button for Mobile on Left Side */}
                        <Button
                            variant="link"
                            className="p-1.5 text-primary flex-shrink-0 d-lg-none border-0 rounded-3 d-inline-flex align-items-center justify-content-center"
                            style={{ background: 'rgba(99, 102, 241, 0.12)', width: '36px', height: '36px' }}
                            onClick={() => setShowDrawer(true)}
                            aria-label="Open Navigation Menu"
                            title="Menu"
                        >
                            <Menu size={20} />
                        </Button>

                        {onBack && (
                            <Button
                                variant="link"
                                className="p-1 text-secondary flex-shrink-0"
                                onClick={onBack}
                                aria-label="Go Back"
                            >
                                <ArrowLeft size={22} />
                            </Button>
                        )}
                        <Navbar.Brand
                            className="fw-bold themed-text-primary m-0 text-truncate fs-5"
                            title={title}
                        >
                            {title || 'Course Craft'}
                        </Navbar.Brand>
                    </div>

                    {/* Desktop Horizontal Navigation (Hidden on Mobile) */}
                    <div className="d-none d-lg-flex align-items-center gap-2 ms-auto">
                        {children}
                        <div className="d-flex align-items-center gap-2 ms-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleNewJourney}
                                className="d-flex align-items-center gap-1.5 justify-content-center fw-semibold shadow-sm text-nowrap py-1.5 px-3 rounded-pill"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                <span>New Journey</span>
                            </Button>
                            {onChat && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={handleChat}
                                    className="d-flex align-items-center gap-2 justify-content-center text-nowrap py-1.5 px-3 rounded-pill"
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
                                    className="d-flex align-items-center gap-2 justify-content-center text-nowrap py-1.5 px-3 rounded-pill"
                                >
                                    <SettingsIcon size={16} />
                                    <span>Settings</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </Container>
            </Navbar>

            {/* Mobile Left Side Offcanvas Panel */}
            <Offcanvas 
                show={showDrawer} 
                onHide={() => setShowDrawer(false)} 
                placement="start"
                className="themed-offcanvas d-lg-none"
                style={{ maxWidth: '290px' }}
            >
                <Offcanvas.Header closeButton className="border-bottom border-secondary border-opacity-25 pb-3 pt-3 px-3">
                    <Offcanvas.Title className="fw-bold themed-text-primary fs-5 d-flex align-items-center gap-2">
                        <Compass className="text-primary" size={22} />
                        <span>Course Craft</span>
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column gap-3 p-3">
                    {/* Quick Actions */}
                    <div className="d-flex flex-column gap-2">
                        <div className="text-uppercase small fw-bold themed-text-secondary mb-1 opacity-75 style-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                            Navigation
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleNewJourney}
                            className="d-flex align-items-center gap-2.5 justify-content-start py-2.5 px-3 rounded-3 fw-semibold shadow-sm w-100"
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            <span>Start New Journey</span>
                        </Button>
                        {onChat && (
                            <Button
                                variant="outline-primary"
                                onClick={handleChat}
                                className="d-flex align-items-center gap-2.5 justify-content-start py-2.5 px-3 rounded-3 w-100"
                            >
                                <MessageSquare size={18} />
                                <span>Chat Assistant</span>
                            </Button>
                        )}
                        {onSettings && (
                            <Button
                                variant="outline-secondary"
                                onClick={handleSettings}
                                className="d-flex align-items-center gap-2.5 justify-content-start py-2.5 px-3 rounded-3 w-100"
                            >
                                <SettingsIcon size={18} />
                                <span>Settings</span>
                            </Button>
                        )}
                    </div>

                    {/* Page Actions */}
                    {children && (
                        <>
                            <div className="border-top border-secondary border-opacity-25 my-1"></div>
                            <div className="d-flex flex-column gap-2" onClick={() => setShowDrawer(false)}>
                                <div className="text-uppercase small fw-bold themed-text-secondary mb-1 opacity-75 style-label" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                    Page Options
                                </div>
                                {children}
                            </div>
                        </>
                    )}
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default TopNavigation;
