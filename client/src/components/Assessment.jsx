import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Row, Col, Card, Button, ProgressBar } from 'react-bootstrap';

const Assessment = ({ apiKey, topic, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({}); // { questionId: answerIndex }
    const [currentQuestion, setCurrentQuestion] = useState(0);

    useEffect(() => {
        const fetchToQuestions = async () => {
            try {
                const res = await axios.post('http://localhost:3000/api/assess', { topic }, {
                    headers: { apiKey: apiKey || '' }
                });
                setQuestions(res.data.questions);
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert('Failed to generate assessment. Please check your API Key and try again.');
                setLoading(false);
            }
        };
        fetchToQuestions();
    }, [apiKey, topic]);

    const handleAnswer = (optionIndex) => {
        setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: optionIndex }));
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(curr => curr + 1);
        } else {
            // Calculate results
            const results = questions.map(q => ({
                questionId: q.id,
                difficulty: q.difficulty,
                correct: answers[q.id] === q.correctAnswerIndex
            }));
            onComplete(results);
        }
    };

    if (loading) return <div className="text-center mt-5"><h3>Generating Assessment...</h3></div>;

    if (questions.length === 0) return <div className="text-center mt-5">No questions generated.</div>;

    const question = questions[currentQuestion];
    const selectedAnswer = answers[question.id];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <Row className="justify-content-center">
            <Col md={8} lg={6}>
                <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Card className="bg-dark text-white border-secondary shadow-lg">
                        <Card.Header className="border-secondary">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span>Diagnostic Assessment</span>
                                <span className="text-muted">Question {currentQuestion + 1} / {questions.length}</span>
                            </div>
                            <ProgressBar now={progress} variant="success" style={{ height: '4px' }} />
                        </Card.Header>
                        <Card.Body className="p-4">
                            <h4 className="mb-4">{question.text}</h4>
                            <div className="d-grid gap-3">
                                {question.options.map((opt, idx) => (
                                    <Button
                                        key={idx}
                                        variant={selectedAnswer === idx ? 'primary' : 'outline-secondary'}
                                        className={`text-start ${selectedAnswer === idx ? 'text-white' : 'text-light'}`}
                                        onClick={() => handleAnswer(idx)}
                                    >
                                        {opt}
                                    </Button>
                                ))}
                            </div>
                        </Card.Body>
                        <Card.Footer className="border-secondary d-flex justify-content-end p-3">
                            <Button
                                variant="light"
                                disabled={selectedAnswer === undefined}
                                onClick={handleNext}
                            >
                                {currentQuestion === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
                            </Button>
                        </Card.Footer>
                    </Card>
                </motion.div>
            </Col>
        </Row>
    );
};

export default Assessment;
