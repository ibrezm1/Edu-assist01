import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

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

    if (loading) return <div className="glass-panel" style={{ textAlign: 'center' }}>Generating Assessment...</div>;

    if (questions.length === 0) return <div className="glass-panel">No questions generated.</div>;

    const question = questions[currentQuestion];
    const selectedAnswer = answers[question.id];

    return (
        <div className="main-container">
            <motion.div
                className="glass-panel"
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span>Diagnostic Assessment</span>
                    <span>Question {currentQuestion + 1} / {questions.length}</span>
                </div>

                <h2 style={{ marginBottom: '2rem' }}>{question.text}</h2>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {question.options.map((opt, idx) => (
                        <button
                            key={idx}
                            className="btn"
                            style={{
                                background: selectedAnswer === idx ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                                textAlign: 'left',
                                border: selectedAnswer === idx ? '1px solid white' : '1px solid transparent'
                            }}
                            onClick={() => handleAnswer(idx)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="btn"
                        disabled={selectedAnswer === undefined}
                        onClick={handleNext}
                    >
                        {currentQuestion === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Assessment;
