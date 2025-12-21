import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Row, Col, Card, Form, Button, ListGroup, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import { BookMarked, History } from 'lucide-react';

const Onboarding = ({ onStart, onSelectSavedPath }) => {
    const [topic, setTopic] = useState('');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/history');
                setHistory(res.data);
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
        if (topic) {
            onStart(topic);
        } else {
            alert("Please enter a topic");
        }
    };

    const handleSelectPath = async (savedTopic) => {
        try {
            const res = await axios.get(`http://localhost:3000/api/path/${savedTopic}`);
            onSelectSavedPath(res.data);
        } catch (e) {
            alert("Failed to load saved path");
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
                            <Card className="bg-dark text-white border-secondary shadow-lg h-100">
                                <Card.Body className="p-4 d-flex flex-column justify-content-center">
                                    <h1 className="fw-bold mb-3">GetPath</h1>
                                    <p className="text-secondary lead mb-4">
                                        Personalized AI Learning Paths tailored to your knowledge level.
                                    </p>

                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-4">
                                            <Form.Label>What do you want to learn today?</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. React, Quantum Physics, Gardening..."
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                required
                                                className="bg-dark text-white border-secondary py-2"
                                            />
                                        </Form.Group>

                                        <div className="d-grid">
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
                            <Card className="bg-dark text-white border-secondary shadow-lg h-100">
                                <Card.Header className="bg-transparent border-secondary py-3 d-flex align-items-center">
                                    <History size={18} className="me-2 text-primary" />
                                    <h5 className="mb-0">Discovered Paths</h5>
                                </Card.Header>
                                <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '400px' }}>
                                    {loadingHistory ? (
                                        <div className="text-center py-4">
                                            <Spinner animation="border" size="sm" variant="primary" />
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="text-center py-5 text-secondary">
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
                                                    className="bg-transparent text-white border-secondary py-3 px-4"
                                                >
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <div className="fw-bold">{item.topic}</div>
                                                            <div className="small text-secondary text-truncate" style={{ maxWidth: '200px' }}>
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

