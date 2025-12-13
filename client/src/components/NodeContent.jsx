import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Play, ArrowLeft } from 'lucide-react';
import axios from 'axios';

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
            <div className="glass-panel" style={{ maxWidth: '800px', margin: '2rem auto' }}>
                <h2>Checkpoint: {node.title}</h2>

                {quizScore !== null ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <h3>You scored {quizScore} / {quizQuestions.length}</h3>
                        {quizScore >= quizQuestions.length - 1 ? (
                            <div>
                                <p style={{ color: '#10b981' }}>Great job! Node Completed.</p>
                                <button className="btn" onClick={onBack}>Return to Path</button>
                            </div>
                        ) : (
                            <div>
                                <p style={{ color: '#ef4444' }}>You need to review the material.</p>
                                <button className="btn" onClick={() => {
                                    setShowQuiz(false);
                                    setQuizScore(null);
                                    setCurrentQuizIndex(0);
                                    setQuizAnswers({});
                                }}>Try Again / Review</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <p>Question {currentQuizIndex + 1} of {quizQuestions.length}</p>
                        <h3 style={{ margin: '1rem 0' }}>{quizQuestions[currentQuizIndex].text}</h3>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {quizQuestions[currentQuizIndex].options.map((opt, i) => (
                                <button
                                    key={i}
                                    className="btn"
                                    style={{
                                        background: quizAnswers[quizQuestions[currentQuizIndex].id] === i ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                                        textAlign: 'left'
                                    }}
                                    onClick={() => handleQuizAnswer(i)}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                            <button className="btn" onClick={nextQuizQuestion} disabled={quizAnswers[quizQuestions[currentQuizIndex].id] === undefined}> Next </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="main-container">
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <ArrowLeft size={20} /> Back to Path
            </button>

            <motion.div
                className="glass-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <h1>{node.title}</h1>
                <p>{node.description}</p>

                {resourcesLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <div className="fade-in">Curating the best resources for you...</div>
                        {/* Could add a spinner here */}
                    </div>
                ) : (
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {node.resources && node.resources.map((res, i) => (
                            <div key={i} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {res.type === 'video' ? <Play size={24} color="#ef4444" /> : <ExternalLink size={24} color="#3b82f6" />}
                                <div style={{ flex: 1 }}>
                                    <h4>{res.title}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{res.description}</p>
                                </div>
                                <a href={res.url.startsWith('http') ? res.url : `https://www.google.com/search?q=${encodeURIComponent(res.url)}`} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: '0.9rem' }}>
                                    View
                                </a>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Have you gone through all resources?</p>
                    <button className="btn" onClick={startQuiz} disabled={quizLoading || resourcesLoading}>
                        {quizLoading ? 'Generating Quiz...' : 'Take Checkpoint Quiz'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default NodeContent;
