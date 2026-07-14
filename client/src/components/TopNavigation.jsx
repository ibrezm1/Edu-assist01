import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { ArrowLeft, MessageSquare, Settings as SettingsIcon, Menu } from 'lucide-react';

const TopNavigation = ({ title, onBack, onChat, onSettings, children, theme }) => {
    return (
        <Navbar expand="lg" className="mb-4 glass-panel py-2" variant={theme === 'light' ? 'light' : 'dark'}>
            <Container fluid className="flex-nowrap">
                <div className="d-flex align-items-center gap-2 overflow-hidden me-auto" style={{ minWidth: 0, flex: 1 }}>
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
                    <Nav className="ms-auto align-items-lg-center gap-2 mt-3 mt-lg-0">
                        {/* Page specific actions passed as children */}
                        {children}

                        {/* Divider for mobile */}
                        <div className="d-lg-none my-2 border-top border-secondary opacity-25"></div>

                        {/* Global Actions */}
                        <div className="d-flex align-items-center gap-2">
                            {onChat && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={onChat}
                                    className="d-flex align-items-center gap-2 w-100 w-lg-auto justify-content-center"
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
                                    className="d-flex align-items-center gap-2 w-100 w-lg-auto justify-content-center"
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
