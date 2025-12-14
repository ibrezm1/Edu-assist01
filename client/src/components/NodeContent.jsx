import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Play, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { Row, Col, Card, Button, Spinner, ListGroup, Badge } from 'react-bootstrap';

const NodeContent = ({ node, apiKey, topic, onBack, onCompleteNode, updateNodeResources }) => {
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizLoading, setQuizLoading] = useState(false);
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizScore, setQuizScore] = useState(null);

    const [resourcesLoading, setResourcesLoading] = useState(!node.resources);

    useEffect(() => {
        // Lazy load resources if not present
        const fetchResources = async () => {
            if (node.resources) {
                setResourcesLoading(false);
                return;
            }

            try {
                const res = await axios.post('http://localhost:3000/api/generate-resources', {
                    nodeTitle: node.title,
                    nodeDescription: node.description,
                    topic: topic
                }, { headers: { apiKey } });

                updateNodeResources(node.id, res.data.resources);
                setResourcesLoading(false);
            } catch (e) {
                console.error(e);
                setResourcesLoading(false);
                // Handle error (maybe retry button)
            }
        };
        fetchResources();
    }, [node, apiKey, topic, updateNodeResources]);

    const startQuiz = async () => {
        setQuizLoading(true);
        try {
            const res = await axios.post('http://localhost:3000/api/quiz', {
                nodeContext: node.title + ": " + node.description
            }, { headers: { apiKey } });
            setQuizQuestions(res.data.questions);
            setShowQuiz(true);
        } catch (e) {
            alert('Failed to load quiz');
        } finally {
            setQuizLoading(false);
        }
    };

    const handleQuizAnswer = (idx) => {
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
                    <Card className="bg-dark text-white border-secondary shadow-lg">
                        <Card.Header className="border-secondary d-flex justify-content-between align-items-center">
                            <h3 className="mb-0">Checkpoint: {node.title}</h3>
                            <Button variant="outline-light" size="sm" onClick={() => setShowQuiz(false)}>
                                Back to Resources
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {quizScore !== null ? (
                                <div className="text-center">
                                    <h3 className="mb-4">You scored {quizScore} / {quizQuestions.length}</h3>
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
                                    <h4 className="mb-4">{quizQuestions[currentQuizIndex].text}</h4>
                                    <div className="d-grid gap-3">
                                        {quizQuestions[currentQuizIndex].options.map((opt, i) => (
                                            <Button
                                                key={i}
                                                variant={quizAnswers[quizQuestions[currentQuizIndex].id] === i ? 'primary' : 'outline-secondary'}
                                                className={`text-start ${quizAnswers[quizQuestions[currentQuizIndex].id] === i ? 'text-white' : 'text-light'}`}
                                                onClick={() => handleQuizAnswer(i)}
                                            >
                                                {opt}
                                            </Button>
                                        ))}
                                    </div>
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
                <Button variant="link" onClick={onBack} className="text-white text-decoration-none mb-3 p-0 d-flex align-items-center">
                    <ArrowLeft size={20} className="me-2" /> Back to Path
                </Button>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card className="bg-dark text-white border-secondary shadow-lg">
                        <Card.Body className="p-4">
                            <h1 className="display-4 mb-3">{node.title}</h1>
                            <p className="lead text-secondary mb-5">{node.description}</p>

                            {resourcesLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p className="text-secondary">Curating the best resources for you...</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {node.resources && node.resources.map((res, i) => (
                                        <Card key={i} className="bg-secondary bg-opacity-10 border-0">
                                            <Card.Body className="d-flex align-items-start gap-3">
                                                <div className="mt-1">
                                                    {res.type === 'video' ? <Play size={24} className="text-danger" /> : <ExternalLink size={24} className="text-primary" />}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="mb-1">{res.title}</h5>
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
