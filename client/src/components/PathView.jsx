import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle, PlayCircle, BookOpen, Lock } from 'lucide-react';

const PathView = ({ apiKey, topic, assessmentResults, onOpenNode, completedNodes, pathData, setPathData }) => {
    const [loading, setLoading] = useState(!pathData);
    const [isFinalized, setIsFinalized] = useState(false);
    const [refinementText, setRefinementText] = useState('');
    const [refining, setRefining] = useState(false);
    const [highlightedIds, setHighlightedIds] = useState([]);

    useEffect(() => {
        const generatePath = async () => {
            if (pathData) {
                setLoading(false);
                return;
            }

            try {
                const res = await axios.post('http://localhost:3000/api/generate-path', {
                    topic,
                    assessmentResults
                }, { headers: { apiKey } });
                setPathData(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        generatePath();
    }, [apiKey, topic, assessmentResults, pathData, setPathData]);

    // Clear highlighted IDs when the topic changes
    useEffect(() => {
        setHighlightedIds([]);
    }, [topic]);

    const handleRefine = async () => {
        if (!refinementText.trim()) return;
        setRefining(true);
        try {
            const res = await axios.post('http://localhost:3000/api/refine-path', {
                topic,
                currentNodes: pathData.nodes,
                feedback: refinementText
            }, { headers: { apiKey } });

            const newNodes = res.data.nodes;

            // Calculate changes to highlight
            const oldNodesMap = new Map(pathData.nodes.map(n => [n.id, n]));
            const changes = [];

            newNodes.forEach(n => {
                if (!oldNodesMap.has(n.id)) {
                    changes.push(n.id); // Newly added
                } else {
                    const old = oldNodesMap.get(n.id);
                    // Check if significant content changed
                    if (old.title !== n.title || old.description !== n.description) {
                        changes.push(n.id); // Modified
                    }
                }
            });

            setHighlightedIds(changes);
            setPathData({ ...pathData, nodes: newNodes });
            setRefinementText('');

            // Remove highlight after 5 seconds? Or keep it? User asked to highlight what got updated.
            // Keeping it until next interaction usually better.
            setTimeout(() => setHighlightedIds([]), 5000);

        } catch (e) {
            alert("Failed to refine path.");
        } finally {
            setRefining(false);
        }
    };

    if (loading) return (
        <div className="main-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h2>Generating your personalized learning path...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing your assessment results to tailor the content.</p>
        </div>
    );

    if (!pathData) return <div>Failed to load path.</div>;

    return (
        <div className="main-container">
            <div style={{ marginBottom: '2rem' }}>
                <h1>{topic} Mastery Path</h1>
                <p style={{ color: 'var(--text-secondary)' }}>{pathData.summary}</p>
            </div>

            <div className="path-container">
                {pathData.nodes.map((node, index) => {
                    const isCompleted = completedNodes.includes(node.id);
                    const isLocked = index > 0 && !completedNodes.includes(pathData.nodes[index - 1].id);
                    // In review mode (not finalized), all nodes are visible but not "active/locked" logic really applies yet, just list them.
                    // But to keep UI consistent, we show them.
                    // Interactive only if finalized.
                    const isHighlighted = highlightedIds.includes(node.id);

                    return (
                        <motion.div
                            key={node.id}
                            className={`glass-panel path-node ${isCompleted ? 'completed' : ''} ${!isLocked && isFinalized ? 'active' : ''}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={isHighlighted ? { opacity: 1, x: 0, scale: [1, 1.02, 1], borderColor: 'var(--accent-color)' } : { opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            onClick={() => isFinalized && !isLocked && onOpenNode(node)}
                            style={{
                                cursor: isFinalized && !isLocked ? 'pointer' : 'default',
                                borderLeft: isFinalized ? (isLocked ? '4px solid var(--glass-border)' : '4px solid var(--primary-color)') : '4px solid var(--text-secondary)',
                                opacity: isFinalized ? (isLocked ? 0.5 : 1) : 1,
                                position: 'relative',
                                border: isHighlighted ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)'
                            }}
                        >
                            {isHighlighted && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    right: '20px',
                                    background: 'var(--accent-color)',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }}>
                                    UPDATED
                                </div>
                            )}
                            <div style={{ marginRight: '1rem', display: 'flex', alignItems: 'center' }}>
                                {!isFinalized ? <BookOpen size={24} color="var(--text-secondary)" /> :
                                    isLocked ? <Lock size={24} /> : isCompleted ? <CheckCircle size={24} color="#10b981" /> : <PlayCircle size={24} color="var(--primary-color)" />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3>{node.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{node.description}</p>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                        {node.estimatedTime}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {!isFinalized && (
                <motion.div
                    className="glass-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: '2rem', border: '1px solid var(--primary-color)' }}
                >
                    <h3 style={{ marginBottom: '1rem' }}>Customize your Journey</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Review the topics above. Do you want to add or change anything before we finalize the curriculum?
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. 'Add a section on performance optimization' or 'Remove the basics'"
                            value={refinementText}
                            onChange={(e) => setRefinementText(e.target.value)}
                            style={{ marginBottom: 0 }}
                        />
                        <button className="btn" onClick={handleRefine} disabled={refining}>
                            {refining ? 'Updating...' : 'Update Path'}
                        </button>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />
                    <div style={{ textAlign: 'right' }}>
                        <button className="btn" style={{ background: '#10b981' }} onClick={() => setIsFinalized(true)}>
                            Looks Good, Start Learning!
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default PathView;
