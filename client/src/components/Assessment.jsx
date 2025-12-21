import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Row, Col, Card, Button, ProgressBar, Alert } from 'react-bootstrap';
import { CheckCircle, XCircle } from 'lucide-react';
import { aiService } from '../services/aiService';

const Assessment = ({ settings, topic, onComplete }) => {

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({}); // { questionId: answerIndex }
    const [currentQuestion, setCurrentQuestion] = useState(0);

    useEffect(() => {
        const fetchToQuestions = async () => {
            try {
                const data = await aiService.generateAssessment(topic, settings);
                setQuestions(data.questions);
                setLoading(false);
            } catch (err) {
                console.error(err);
                const msg = err.message || 'Failed to generate assessment.';
                alert(`${msg}\n\nPlease check your API Key in Settings and try again.`);
                setLoading(false);
            }

        };
        fetchToQuestions();
    }, [settings, topic]);



    const handleAnswer = (optionIndex) => {
        if (answers[questions[currentQuestion].id] !== undefined) return;
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

    if (loading) return <div className="text-center mt-5"><h3 className="themed-text-primary">Generating Assessment...</h3></div>;

    if (questions.length === 0) return <div className="text-center mt-5 themed-text-secondary">No questions generated.</div>;

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
                    <Card className="themed-card shadow-lg">

                        <Card.Header className="border-secondary">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span>Diagnostic Assessment</span>
                                <span className="text-muted">Question {currentQuestion + 1} / {questions.length}</span>
                            </div>
                            <ProgressBar now={progress} variant="success" style={{ height: '4px' }} />
                        </Card.Header>
                        <Card.Body className="p-4">
                            <h4 className="mb-4 themed-text-primary">{question.text}</h4>


                            <div className="d-grid gap-3">
                                {question.options.map((opt, idx) => {
                                    const isSelected = selectedAnswer === idx;
                                    const isCorrect = idx === question.correctAnswerIndex;
                                    const showFeedback = selectedAnswer !== undefined;

                                    let variant = 'outline-secondary';
                                    if (showFeedback) {
                                        if (isCorrect) variant = 'success';
                                        else if (isSelected) variant = 'danger';
                                    }

                                    return (
                                        <Button
                                            key={idx}
                                            variant={variant}
                                            className={`text-start d-flex justify-content-between align-items-center ${isSelected && !showFeedback ? 'text-white' : ''}`}
                                            onClick={() => handleAnswer(idx)}
                                            disabled={showFeedback}
                                        >
                                            <span>{opt}</span>
                                            {showFeedback && isCorrect && <CheckCircle size={18} />}
                                            {showFeedback && isSelected && !isCorrect && <XCircle size={18} />}
                                        </Button>
                                    );
                                })}
                            </div>

                            {selectedAnswer !== undefined && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4"
                                >
                                    <Alert variant={selectedAnswer === question.correctAnswerIndex ? 'success' : 'danger'} className="bg-transparent border-secondary themed-text-primary">

                                        <div className="fw-bold mb-1">
                                            {selectedAnswer === question.correctAnswerIndex ? 'Correct!' : 'Incorrect'}
                                        </div>
                                        <div className="small text-secondary">
                                            {question.reasoning}
                                        </div>
                                    </Alert>
                                </motion.div>
                            )}

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
