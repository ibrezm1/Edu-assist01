import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Row, Col, Card, Button, Spinner, ListGroup, Badge, Alert } from 'react-bootstrap';
import { CheckCircle, XCircle, ExternalLink, Play, ArrowLeft } from 'lucide-react';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';



const NodeContent = ({ node, settings, topic, onBack, onCompleteNode, updateNodeResources }) => {

    const [showQuiz, setShowQuiz] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizLoading, setQuizLoading] = useState(false);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizScore, setQuizScore] = useState(null);

    const [resourcesLoading, setResourcesLoading] = useState(!node.resources);
    const [resourceError, setResourceError] = useState(null);


    useEffect(() => {
        // Lazy load resources if not present
        const fetchResources = async () => {
            if (node.resources) {
                setResourcesLoading(false);
                return;
            }

            setResourcesLoading(true);
            setResourceError(null);
            try {
                const data = await aiService.generateResources(topic, node.title, node.description, settings);
                if (data && data.resources) {
                    updateNodeResources(node.id, data.resources);
                    storageService.updateResources(topic, node.title, data.resources);
                } else {
                    throw new Error("No resources found in AI response.");
                }
                setResourcesLoading(false);
            } catch (e) {
                console.error(e);
                setResourceError(e.message || "Failed to load resources.");
                setResourcesLoading(false);
            }
        };
        fetchResources();
    }, [settings, topic, node, updateNodeResources]);



    const startQuiz = async () => {
        setQuizLoading(true);
        try {
            const data = await aiService.generateQuiz(node.title + ": " + node.description, settings);
            setQuizQuestions(data.questions);
            setShowQuiz(true);

        } catch (e) {

            alert('Failed to load quiz');
        } finally {
            setQuizLoading(false);
        }
    };

    const handleQuizAnswer = (idx) => {
        if (quizAnswers[quizQuestions[currentQuizIndex].id] !== undefined) return;
        setQuizAnswers({ ...quizAnswers, [quizQuestions[currentQuizIndex].id]: idx });
    };



    const nextQuizQuestion = () => {
        if (currentQuizIndex < quizQuestions.length - 1) {
            setCurrentQuizIndex(c => c + 1);
        } else {
            // Finish
            let score = 0;
            quizQuestions.forEach(q => {
                if (quizAnswers[q.id] === q.correctAnswerIndex) score++;
            });
            setQuizScore(score);
            if (score >= quizQuestions.length - 1) { // Allow 1 mistake maybe? Or strict.
                onCompleteNode(true);
            }
        }
    };

    if (showQuiz) {
        return (
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="themed-card shadow-lg">

                        <Card.Header className="border-secondary d-flex justify-content-between align-items-center">
                            <h3 className="mb-0 themed-text-primary">Checkpoint: {node.title}</h3>


                            <Button variant="outline-light" size="sm" onClick={() => setShowQuiz(false)}>
                                Back to Resources
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {quizScore !== null ? (
                                <div className="text-center">
                                    <h3 className="mb-4 themed-text-primary">You scored {quizScore} / {quizQuestions.length}</h3>


                                    {quizScore >= quizQuestions.length - 1 ? (
                                        <div>
                                            <p className="text-success fs-4 mb-4">Great job! Node Completed.</p>
                                            <Button variant="success" size="lg" onClick={onBack}>Return to Path</Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-danger fs-4 mb-4">You need to review the material.</p>
                                            <Button variant="outline-light" onClick={() => {
                                                setShowQuiz(false);
                                                setQuizScore(null);
                                                setCurrentQuizIndex(0);
                                                setQuizAnswers({});
                                            }}>Try Again / Review</Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="text-muted mb-2">Question {currentQuizIndex + 1} of {quizQuestions.length}</p>
                                    <h4 className="mb-4 themed-text-primary">{quizQuestions[currentQuizIndex].text}</h4>


                                    <div className="d-grid gap-3">
                                        {quizQuestions[currentQuizIndex].options.map((opt, i) => {
                                            const isSelected = quizAnswers[quizQuestions[currentQuizIndex].id] === i;
                                            const isCorrect = i === quizQuestions[currentQuizIndex].correctAnswerIndex;
                                            const showFeedback = quizAnswers[quizQuestions[currentQuizIndex].id] !== undefined;

                                            let variant = 'outline-secondary';
                                            if (showFeedback) {
                                                if (isCorrect) variant = 'success';
                                                else if (isSelected) variant = 'danger';
                                            }

                                            return (
                                                <Button
                                                    key={i}
                                                    variant={variant}
                                                    className={`text-start d-flex justify-content-between align-items-center ${isSelected && !showFeedback ? 'text-white' : ''}`}
                                                    onClick={() => handleQuizAnswer(i)}
                                                    disabled={showFeedback}
                                                >
                                                    <span>{opt}</span>
                                                    {showFeedback && isCorrect && <CheckCircle size={18} />}
                                                    {showFeedback && isSelected && !isCorrect && <XCircle size={18} />}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    {quizAnswers[quizQuestions[currentQuizIndex].id] !== undefined && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4"
                                        >
                                            <Alert variant={quizAnswers[quizQuestions[currentQuizIndex].id] === quizQuestions[currentQuizIndex].correctAnswerIndex ? 'success' : 'danger'} className="bg-transparent border-secondary themed-text-primary">

                                                <div className="fw-bold mb-1">
                                                    {quizAnswers[quizQuestions[currentQuizIndex].id] === quizQuestions[currentQuizIndex].correctAnswerIndex ? 'Correct!' : 'Incorrect'}
                                                </div>
                                                <div className="small text-secondary">
                                                    {quizQuestions[currentQuizIndex].reasoning}
                                                </div>
                                            </Alert>
                                        </motion.div>
                                    )}

                                    <div className="text-end mt-4">
                                        <Button
                                            variant="light"
                                            onClick={nextQuizQuestion}
                                            disabled={quizAnswers[quizQuestions[currentQuizIndex].id] === undefined}
                                        >
                                            Next
                                        </Button>
                                    </div>

                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        );
    }

    return (
        <Row className="justify-content-center">
            <Col md={10} lg={8}>
                <Button variant="link" onClick={onBack} className="themed-text-primary text-decoration-none mb-3 p-0 d-flex align-items-center">

                    <ArrowLeft size={20} className="me-2" /> Back to Path
                </Button>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card className="themed-card shadow-lg">

                        <Card.Body className="p-4">
                            <h1 className="display-4 mb-3 themed-text-primary">{node.title}</h1>


                            <p className="lead text-secondary mb-5">{node.description}</p>

                            {resourceError && (
                                <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>{resourceError}</span>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => window.location.reload()} // Simple retry for now
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                </Alert>
                            )}

                            {resourcesLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p className="text-secondary">Curating the best resources for you...</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {!resourceError && node.resources && node.resources.map((res, i) => (
                                        <Card key={i} className="bg-secondary bg-opacity-10 border-0">
                                            <Card.Body className="d-flex align-items-start gap-3">
                                                <div className="mt-1">
                                                    {res.type === 'video' ? <Play size={24} className="text-danger" /> : <ExternalLink size={24} className="text-primary" />}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="mb-1 themed-text-primary">{res.title}</h5>


                                                    <p className="text-white-50 small mb-0">{res.description}</p>
                                                </div>
                                                <Button
                                                    href={res.url.startsWith('http') ? res.url : `https://www.google.com/search?q=${encodeURIComponent(res.url)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    variant="outline-light"
                                                    size="sm"
                                                >
                                                    View
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                    {!resourceError && (!node.resources || node.resources.length === 0) && !resourcesLoading && (
                                        <div className="text-center py-4 text-secondary">
                                            No resources found for this module.
                                        </div>
                                    )}
                                </div>
                            )}


                            <div className="mt-5 text-center">
                                <p className="text-secondary mb-3">Have you gone through all resources?</p>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={startQuiz}
                                    disabled={quizLoading || resourcesLoading}
                                >
                                    {quizLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Generating Quiz...</> : 'Take Checkpoint Quiz'}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </motion.div>
            </Col>
        </Row>
    );
};

export default NodeContent;
