import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Row, Col, Card, Button, ProgressBar, Alert } from 'react-bootstrap';
import { CheckCircle, XCircle } from 'lucide-react';
import { aiService } from '../services/aiService';
import TopNavigation from './TopNavigation';

const Assessment = ({ settings, topic, onComplete, onCancel, theme, backgroundTasks = {} }) => {

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({}); // { questionId: answerIndex }
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [elapsed, setElapsed] = useState(0);

    const activeAssessmentTask = Object.values(backgroundTasks).find(
        t => t.taskType === 'assessment' && t.nodeTitle === topic
    );

    const isGenerating = activeAssessmentTask?.status === 'generating';
    const isFailed = activeAssessmentTask?.status === 'failed';
    const errorMsg = activeAssessmentTask?.error;

    useEffect(() => {
        if (!topic) return;
        const saved = localStorage.getItem('getpath_assessment_questions_' + topic.toLowerCase());
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.length > 0) {
                    setQuestions(parsed);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error(e);
            }
        }
        
        if (!isGenerating && !isFailed) {
            setLoading(false);
        }
    }, [topic, isGenerating, isFailed]);

    useEffect(() => {
        if (!activeAssessmentTask || activeAssessmentTask.status !== 'generating') return;
        setElapsed(Math.max(0, Math.round((Date.now() - activeAssessmentTask.timestamp) / 1000)));
        const interval = setInterval(() => {
            setElapsed(Math.max(0, Math.round((Date.now() - activeAssessmentTask.timestamp) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [activeAssessmentTask]);



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

    if (isFailed) return (
        <div className="content-wrapper-narrow text-center" style={{ minHeight: '60vh' }}>
                <Card className="themed-card shadow-lg p-5">
                    <Card.Body>
                        <XCircle size={48} className="text-danger mb-4" />
                        <h3 className="themed-text-primary mb-3 fw-bold">Failed to Generate Assessment</h3>
                        <p className="themed-text-secondary small mb-4">{errorMsg || 'Please verify your settings and connection.'}</p>
                        <div className="d-flex justify-content-center gap-3">
                            <Button variant="outline-primary" onClick={onCancel}>Go Home</Button>
                        </div>
                    </Card.Body>
                </Card>
        </div>
    );

    if (loading || isGenerating) return (
        <div className="content-wrapper-narrow text-center" style={{ minHeight: '60vh' }}>
                <Card className="themed-card shadow-lg p-5">
                    <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1.1, 1, 1],
                                rotate: [0, 0, 180, 180, 0],
                                borderRadius: ["20%", "20%", "50%", "50%", "20%"],
                            }}
                            transition={{
                                duration: 2,
                                ease: "easeInOut",
                                times: [0, 0.2, 0.5, 0.8, 1],
                                repeat: Infinity,
                                repeatDelay: 0.5
                            }}
                            style={{
                                width: '70px',
                                height: '70px',
                                background: 'linear-gradient(135deg, var(--bs-primary), var(--bs-info))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '2rem',
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
                                color: 'white'
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                        </motion.div>

                        <motion.h3
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="themed-text-primary mb-3 fw-bold"
                        >
                            Generating Assessment ({elapsed}s)...
                        </motion.h3>

                        <p className="themed-text-secondary small mb-4">
                            Analyzing topic "{topic}" to design custom questions for your level.
                        </p>
                        <Button variant="outline-secondary" size="sm" onClick={onCancel}>
                            Go Back Home
                        </Button>
                    </Card.Body>
                </Card>
        </div>
    );

    if (questions.length === 0) return (
        <div className="content-wrapper-narrow text-center" style={{ minHeight: '60vh' }}>
                <Card className="themed-card shadow-lg p-5">
                    <Card.Body>
                        <h3 className="themed-text-primary mb-3 fw-bold">No Active Assessment</h3>
                        <p className="themed-text-secondary small mb-4">Would you like to start a new journey or return home?</p>
                        <div className="d-flex justify-content-center gap-3">
                            <Button variant="outline-secondary" onClick={onCancel}>Go Home</Button>
                        </div>
                    </Card.Body>
                </Card>
        </div>
    );

    const question = questions[currentQuestion];
    const selectedAnswer = answers[question.id];
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <div className="content-wrapper-narrow">
                <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <TopNavigation
                        title="Diagnostic Assessment"
                        onBack={onCancel}
                        theme={theme}
                    />

                    <Card className="themed-card shadow-lg">

                        <Card.Header className="border-secondary">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="small text-muted">Topic: {topic}</span>
                                <span className="small text-muted">Question {currentQuestion + 1} / {questions.length}</span>
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
        </div>
    );
};

export default Assessment;
