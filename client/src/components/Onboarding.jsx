import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookMarked, Compass, Download, Upload, Trash2, Key, Plus } from 'lucide-react';
import { Row, Col, Card, Form, Button, ListGroup, Spinner, Badge, Stack, Modal, Alert } from 'react-bootstrap';


import { storageService } from '../services/storageService';
import TopNavigation from './TopNavigation';



const Onboarding = ({ onStart, onSelectSavedPath, onOpenSettings, apiKey, demoMode, onSync, theme, backgroundTasks = {} }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [topic, setTopic] = useState('');
    const [history, setHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [showNewJourneyModal, setShowNewJourneyModal] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = storageService.getHistory();
                setHistory(data);
                if (data.length === 0) {
                    setShowNewJourneyModal(true);
                }
            } catch (e) {
                console.error("Failed to fetch history");
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, [backgroundTasks]);

    useEffect(() => {
        if (location.state?.openNewJourneyModal) {
            setShowNewJourneyModal(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!topic) return alert("Please enter a topic");

        const settings = storageService.getSettings();
        const activeProvider = settings.provider === 'openrouter' ? 'OpenRouter' : 'Gemini';
        const hasKey = settings.provider === 'openrouter' ? settings.openrouterKey : settings.apiKey;
        if (!hasKey && !settings.demoMode) {
            alert(`Please set your ${activeProvider} API Key in Settings first or enable Demo Mode.`);
            onOpenSettings();
            return;
        }

        setShowNewJourneyModal(false);
        onStart(topic);
    };



    const handleSelectPath = async (savedTopic) => {
        const data = storageService.getPath(savedTopic);
        if (data) {
            onSelectSavedPath(data);
        } else {
            alert("Failed to load saved path");
        }
    };



    const handleDownload = () => {
        storageService.downloadDB();
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            await storageService.uploadDB(file);
            const data = storageService.getHistory();
            setHistory(data);
            alert("Backup restored successfully!");
        } catch (err) {
            alert("Failed to restore backup: " + err.message);
        }
    };

    const handleDeletePath = (e, targetTopic) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete the path for "${targetTopic}"?`)) {
            storageService.deletePath(targetTopic);
            const data = storageService.getHistory();
            setHistory(data);
            if (data.length === 0) {
                setShowNewJourneyModal(true);
            }
        }
    };

    const handleEnableDemo = () => {
        const settings = storageService.getSettings();
        storageService.saveSettings({ ...settings, demoMode: true });
        if (onSync) onSync();
    };




    return (
        <div className="content-wrapper" style={{ minHeight: '80vh' }}>
                <TopNavigation
                    title="Course Craft"
                    onSettings={onOpenSettings}
                    onNewJourney={() => setShowNewJourneyModal(true)}
                    theme={theme}
                />
                <Row>
                    <Col lg={12}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="themed-card shadow-lg h-100">

                                <Card.Header className="bg-transparent border-secondary py-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <Compass size={20} className="text-primary flex-shrink-0" />
                                        <h5 className="mb-0 fw-bold themed-text-primary">Quests</h5>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setShowNewJourneyModal(true)}
                                            className="d-inline-flex align-items-center justify-content-center gap-1 rounded-pill px-2.5 py-1 ms-1 shadow-sm fw-bold border-0"
                                            title="Start a New Journey"
                                            style={{ height: '32px' }}
                                        >
                                            <Plus size={18} strokeWidth={2.5} />
                                            <span className="d-none d-sm-inline ms-1">New Journey</span>
                                        </Button>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 flex-grow-1 justify-content-md-end w-100">
                                        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '300px' }}>
                                            <Form.Control
                                                type="text"
                                                placeholder="Search quests..."
                                                size="sm"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="themed-input small"
                                            />
                                            {searchQuery && (
                                                <Button
                                                    variant="link"
                                                    className="p-0 text-secondary hover-text-white text-decoration-none small"
                                                    onClick={() => setSearchQuery('')}
                                                >
                                                    Clear
                                                </Button>
                                            )}
                                        </div>
                                        <Stack direction="horizontal" gap={2} className="flex-shrink-0">
                                            <Button variant="outline-secondary" size="sm" onClick={handleDownload} title="Download Backup" className="d-inline-flex align-items-center justify-content-center p-0" style={{ height: '32px', width: '32px' }}>
                                                <Download size={14} />
                                            </Button>
                                            <label className="btn btn-outline-secondary btn-sm mb-0 d-inline-flex align-items-center justify-content-center p-0" title="Upload Backup" style={{ cursor: 'pointer', height: '32px', width: '32px' }}>
                                                <Upload size={14} />
                                                <input type="file" hidden accept=".json" onChange={handleUpload} />
                                            </label>
                                        </Stack>
                                    </div>
                                </Card.Header>

                                <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '500px' }}>
                                    {loadingHistory ? (
                                        <div className="text-center py-4">
                                            <Spinner animation="border" size="sm" variant="primary" />
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="text-center py-5 themed-text-secondary">
                                            <BookMarked size={32} className="mb-2 d-block mx-auto opacity-25" />
                                            <p className="small mb-3">No paths discovered yet.</p>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => setShowNewJourneyModal(true)}
                                                className="d-inline-flex align-items-center gap-2 fw-semibold"
                                            >
                                                <Plus size={16} strokeWidth={2.5} />
                                                <span>Start a New Journey</span>
                                            </Button>
                                        </div>
                                    ) : (() => {
                                        const filteredHistory = history.filter(item => {
                                            const query = searchQuery.toLowerCase();
                                            const topicMatch = item.topic?.toLowerCase().includes(query) || false;
                                            const summaryMatch = item.summary?.toLowerCase().includes(query) || false;
                                            return topicMatch || summaryMatch;
                                        });

                                        if (filteredHistory.length === 0) {
                                            return (
                                                <div className="text-center py-5 themed-text-secondary">
                                                    <BookMarked size={32} className="mb-2 d-block mx-auto opacity-25" />
                                                    <p className="small">No matching quests found for "{searchQuery}".</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <ListGroup variant="flush">
                                                {filteredHistory.map((item, idx) => (
                                                    <ListGroup.Item
                                                        key={idx}
                                                        className="bg-transparent themed-text-primary border-secondary py-3 px-4 position-relative"
                                                        style={{ cursor: 'pointer' }}
                                                    >

                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div className="flex-grow-1" onClick={() => handleSelectPath(item.topic)}>
                                                                <div className="fw-bold">{item.topic}</div>
                                                                <div className="small themed-text-secondary text-truncate" style={{ maxWidth: '200px' }}>
                                                                    {item.summary}
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-2">
                                                                {item.isFinalized && <Badge bg="success" style={{ fontSize: '0.6rem' }}>FINALIZED</Badge>}
                                                                <Badge bg="secondary" className="bg-opacity-25">{item.nodeCount} steps</Badge>
                                                                <Button
                                                                    variant="link"
                                                                    className="themed-text-secondary p-1 hover-danger opacity-50"
                                                                    onClick={(e) => handleDeletePath(e, item.topic)}
                                                                    title="Delete Path"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        );
                                    })()}
                                </Card.Body>
                            </Card>
                        </motion.div>
                    </Col>
                </Row>

                {/* Modal to Create New Journey */}
                <Modal
                    show={showNewJourneyModal}
                    onHide={() => setShowNewJourneyModal(false)}
                    centered
                    className="themed-modal"
                >
                    <Modal.Header closeButton className="border-0 pb-0 px-4 pt-4">
                        <Modal.Title className="fw-bold themed-text-primary fs-5 d-flex align-items-center gap-2">
                            <Compass className="text-primary" size={22} />
                            <span>Start a New Journey</span>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-4">
                        <p className="themed-text-secondary small mb-4">
                            Personalized AI Learning Paths tailored to your knowledge level to help you become an expert in the area of your choice.
                        </p>

                        {!apiKey && !demoMode ? (
                            <Alert variant="warning" className="bg-warning bg-opacity-10 border-warning themed-text-primary mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <Key size={18} className="me-2 text-warning" />
                                    <strong>API Key Required</strong>
                                </div>
                                <p className="small mb-3">
                                    Please configure your {storageService.getSettings().provider === 'openrouter' ? 'OpenRouter' : 'Gemini'} API key in settings to start generating real learning paths.
                                </p>
                                <Stack gap={2}>
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        onClick={() => {
                                            setShowNewJourneyModal(false);
                                            onOpenSettings();
                                        }}
                                    >
                                        Go to Settings
                                    </Button>
                                    <Button
                                        variant="outline-warning"
                                        size="sm"
                                        onClick={handleEnableDemo}
                                    >
                                        Start in Demo Mode
                                    </Button>
                                </Stack>
                            </Alert>
                        ) : demoMode && !apiKey && (
                            <Alert variant="info" className="bg-info bg-opacity-10 border-info themed-text-primary mb-4">
                                <div className="d-flex align-items-center mb-2">
                                    <Key size={18} className="me-2 text-info" />
                                    <strong>Demo Mode Active</strong>
                                </div>
                                <p className="small mb-0">
                                    You are exploring the app with simulated responses. You can add a real API key in settings later.
                                </p>
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-4">
                                <Form.Label className="themed-text-primary fw-semibold small">
                                    What do you want to learn today?
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. React, Quantum Physics, Gardening..."
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    required
                                    autoFocus
                                    className="themed-input py-2"
                                />
                            </Form.Group>

                            <div className="d-flex justify-content-end gap-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setShowNewJourneyModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    size="sm"
                                    disabled={!apiKey && !demoMode}
                                    className="fw-bold px-3"
                                >
                                    {apiKey || demoMode ? 'Start New Journey' : 'Setup API Key to Start'}
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
        </div>
    );
};

export default Onboarding;

