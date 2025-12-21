import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Row, Col, Card, Form, Button, ListGroup, Spinner, Badge, Stack, Collapse } from 'react-bootstrap';

import { BookMarked, History, Download, Upload, Settings as SettingsIcon } from 'lucide-react';
import { storageService } from '../services/storageService';



const Onboarding = ({ onStart, onSelectSavedPath, onOpenSettings }) => {
    const [topic, setTopic] = useState('');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);



    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = storageService.getHistory();
                setHistory(data);
            } catch (e) {
                console.error("Failed to fetch history");
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!topic) return alert("Please enter a topic");

        const settings = storageService.getSettings();
        if (!settings.apiKey) {
            alert("Please set your Gemini API Key in Settings first.");
            onOpenSettings();
            return;
        }

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
            setHistory(storageService.getHistory());
            alert("Backup restored successfully!");
        } catch (err) {
            alert("Failed to restore backup: " + err.message);
        }
    };


    return (
        <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Col xs={12} md={10} lg={8}>
                <Row>
                    <Col lg={7}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Card className="themed-card shadow-lg h-100">

                                <Card.Body className="p-4 d-flex flex-column justify-content-center">
                                    <h1 className="fw-bold mb-3 themed-text-primary">GetPath</h1>

                                    <p className="themed-text-secondary lead mb-4">

                                        Personalized AI Learning Paths tailored to your knowledge level.
                                    </p>

                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="themed-text-primary">
                                                What do you want to learn today?
                                            </Form.Label>

                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. React, Quantum Physics, Gardening..."
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                required
                                                className="themed-input py-2"

                                            />
                                        </Form.Group>


                                        <div className="d-grid gap-2">
                                            <Button variant="primary" type="submit" size="lg">
                                                Start New Journey
                                            </Button>
                                        </div>
                                    </Form>

                                </Card.Body>
                            </Card>
                        </motion.div>
                    </Col>
                    <Col lg={5} className="mt-4 mt-lg-0">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="themed-card shadow-lg h-100">

                                <Card.Header className="bg-transparent border-secondary py-3 d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <History size={18} className="me-2 text-primary" />
                                        <h5 className="mb-0">History</h5>
                                    </div>
                                    <Stack direction="horizontal" gap={2}>
                                        <Button variant="outline-secondary" size="sm" onClick={handleDownload} title="Download Backup">
                                            <Download size={14} />
                                        </Button>
                                        <label className="btn btn-outline-secondary btn-sm mb-0" title="Upload Backup" style={{ cursor: 'pointer' }}>
                                            <Upload size={14} />
                                            <input type="file" hidden accept=".json" onChange={handleUpload} />
                                        </label>
                                    </Stack>
                                </Card.Header>

                                <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '400px' }}>
                                    {loadingHistory ? (
                                        <div className="text-center py-4">
                                            <Spinner animation="border" size="sm" variant="primary" />
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="text-center py-5 themed-text-secondary">
                                            <BookMarked size={32} className="mb-2 d-block mx-auto opacity-25" />
                                            <p className="small">No paths discovered yet.</p>
                                        </div>
                                    ) : (
                                        <ListGroup variant="flush">
                                            {history.map((item, idx) => (
                                                <ListGroup.Item
                                                    key={idx}
                                                    action
                                                    onClick={() => handleSelectPath(item.topic)}
                                                    className="bg-transparent themed-text-primary border-secondary py-3 px-4"

                                                >
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <div className="fw-bold">{item.topic}</div>
                                                            <div className="small themed-text-secondary text-truncate" style={{ maxWidth: '200px' }}>
                                                                {item.summary}
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            {item.isFinalized && <Badge bg="success" className="me-2" style={{ fontSize: '0.6rem' }}>FINALIZED</Badge>}
                                                            <Badge bg="secondary" className="bg-opacity-25">{item.nodeCount} steps</Badge>
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>
                        </motion.div>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};

export default Onboarding;

