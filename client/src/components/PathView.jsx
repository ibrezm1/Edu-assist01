import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Row, Col, Card, Button, Form, InputGroup, Badge, Spinner } from 'react-bootstrap';
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

            // Remove highlight after 5 seconds
            setTimeout(() => setHighlightedIds([]), 5000);

        } catch (e) {
            alert("Failed to refine path.");
        } finally {
            setRefining(false);
        }
    };

    if (loading) return (
        <div className="text-center mt-5">
            <Spinner animation="border" variant="primary" />
            <h2 className="mt-3">Generating your personalized learning path...</h2>
            <p className="text-secondary">Analyzing your assessment results to tailor the content.</p>
        </div>
    );

    if (!pathData) return <div className="text-center mt-5 text-danger">Failed to load path.</div>;

    return (
        <Row className="justify-content-center">
            <Col md={10} lg={8}>
                <div className="mb-4 text-center">
                    <h1 className="fw-bold">{topic} Mastery Path</h1>
                    <p className="text-secondary lead">{pathData.summary}</p>
                </div>

                <div className="d-flex flex-column gap-3">
                    {pathData.nodes.map((node, index) => {
                        const isCompleted = completedNodes.includes(node.id);
                        const isLocked = index > 0 && !completedNodes.includes(pathData.nodes[index - 1].id);
                        const isHighlighted = highlightedIds.includes(node.id);

                        return (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={isHighlighted ? { opacity: 1, x: 0, scale: [1, 1.02, 1] } : { opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                onClick={() => isFinalized && !isLocked && onOpenNode(node)}
                            >
                                <Card
                                    className={`bg-dark text-white border-secondary ${isFinalized && !isLocked ? 'cursor-pointer' : ''}`}
                                    style={{
                                        opacity: isFinalized && isLocked ? 0.5 : 1,
                                        cursor: isFinalized && !isLocked ? 'pointer' : 'default',
                                        borderLeft: `4px solid ${isFinalized ? (isLocked ? 'gray' : 'var(--bs-primary)') : 'gray'}`,
                                        borderColor: isHighlighted ? 'var(--bs-warning)' : ''
                                    }}
                                >
                                    <Card.Body className="d-flex align-items-center">
                                        {isHighlighted && (
                                            <Badge bg="warning" text="dark" className="position-absolute top-0 end-0 m-2">
                                                UPDATED
                                            </Badge>
                                        )}
                                        <div className="me-3">
                                            {!isFinalized ? <BookOpen size={24} className="text-secondary" /> :
                                                isLocked ? <Lock size={24} /> : isCompleted ? <CheckCircle size={24} className="text-success" /> : <PlayCircle size={24} className="text-primary" />}
                                        </div>
                                        <div className="flex-grow-1">
                                            <Card.Title>{node.title}</Card.Title>
                                            <Card.Text className="text-secondary mb-1">{node.description}</Card.Text>
                                            <Badge bg="secondary" bgOpacity={10}>{node.estimatedTime}</Badge>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {!isFinalized && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="mt-4 bg-dark text-white border-primary shadow">
                            <Card.Body>
                                <Card.Title className="mb-3">Customize your Journey</Card.Title>
                                <Card.Text className="text-secondary mb-3">
                                    Review the topics above. Do you want to add or change anything before we finalize the curriculum?
                                </Card.Text>
                                <InputGroup className="mb-3">
                                    <Form.Control
                                        placeholder="e.g. 'Add a section on performance optimization' or 'Remove the basics'"
                                        value={refinementText}
                                        onChange={(e) => setRefinementText(e.target.value)}
                                        className="bg-dark text-white border-secondary"
                                    />
                                    <Button variant="outline-light" onClick={handleRefine} disabled={refining}>
                                        {refining ? 'Updating...' : 'Update Path'}
                                    </Button>
                                </InputGroup>
                                <hr className="border-secondary my-3" />
                                <div className="text-end">
                                    <Button variant="success" size="lg" onClick={() => setIsFinalized(true)}>
                                        Looks Good, Start Learning!
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </motion.div>
                )}
            </Col>
        </Row>
    );
};

export default PathView;
