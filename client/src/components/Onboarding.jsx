import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const Onboarding = ({ onStart }) => {
    const [topic, setTopic] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (topic) {
            onStart(topic);
        } else {
            alert("Please enter a topic");
        }
    };

    return (
        <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Col xs={12} md={8} lg={6}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="bg-dark text-white border-secondary shadow-lg">
                        <Card.Body className="p-4">
                            <h1 className="text-center mb-3">GetPath</h1>
                            <p className="text-center text-secondary mb-4">
                                Personalized AI Learning Paths tailored to your knowledge.
                            </p>

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Label>What do you want to learn?</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. React, Quantum Physics, Gardening..."
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        required
                                        className="bg-dark text-white border-secondary"
                                    />
                                </Form.Group>

                                <div className="d-grid">
                                    <Button variant="primary" type="submit" size="lg">
                                        Start Learning Journey
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </motion.div>
            </Col>
        </Row>
    );
};

export default Onboarding;
