import React, { useState } from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Brain, CheckCircle, Copy, Check, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';
import TopNavigation from '../TopNavigation';
import AskAiDropdown from '../AskAiDropdown';
import JsonEditorModal from '../JsonEditorModal';

const ProblemsView = ({
    node,
    settings,
    theme,
    problemsLoading,
    problemsError,
    activeProblemGroup,
    setActiveProblemGroup,
    completedTasks,
    copiedTaskId,
    groupMetaData,
    handleToggleTaskCompleted,
    handleCopyTask,
    startPracticeProblems,
    onBack,
    onOpenChat,
    onOpenSettings,
    updateNodePracticeProblems
}) => {
    const [showJsonModal, setShowJsonModal] = useState(false);

    const handleSaveProblemsJson = (parsed) => {
        updateNodePracticeProblems(node.id, parsed);
        setShowJsonModal(false);
    };

    const validateProblemsSchema = (parsed) => {
        if (!Array.isArray(parsed)) {
            throw new Error("JSON must be a valid array of practice tasks.");
        }
        parsed.forEach((item, i) => {
            if (!item.id) throw new Error(`Task [index ${i}] is missing 'id' field.`);
            if (!item.title) throw new Error(`Task [index ${i}] is missing 'title' field.`);
            if (!item.description) throw new Error(`Task [index ${i}] is missing 'description' field.`);
            if (!item.group) throw new Error(`Task [index ${i}] is missing 'group' field (should be 'A', 'B', 'C', or 'D').`);
        });
    };

    const hasProblems = node.practiceProblems && node.practiceProblems.length > 0;
    const filteredProblems = hasProblems ? node.practiceProblems.filter(p => p.group === activeProblemGroup) : [];

    return (
        <div className="content-wrapper-narrow">
            <TopNavigation
                title={`Practice: ${node.title}`}
                onBack={onBack}
                onChat={onOpenChat}
                onSettings={onOpenSettings}
                theme={theme}
            >
                <Button
                    variant="outline-info"
                    size="sm"
                    className="d-flex align-items-center gap-2 justify-content-center text-nowrap"
                    onClick={() => setShowJsonModal(true)}
                >
                    <Code2 size={16} />
                    <span>Edit JSON</span>
                </Button>
            </TopNavigation>
            <Card className="themed-card shadow-lg">
                <Card.Header className="border-secondary py-3">
                    <div className="d-flex align-items-center justify-content-between">
                        <h5 className="mb-0 themed-text-primary d-flex align-items-center gap-2">
                            <Brain size={20} className="text-warning" /> Practice Tasks
                        </h5>
                        <Badge bg="secondary" className="bg-opacity-25 themed-text-secondary">Problems Only</Badge>
                    </div>
                </Card.Header>
                <Card.Body className="p-4">
                    {problemsLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="light" className="mb-3" />
                            <p className="themed-text-secondary mb-1">Generating graded practice challenges (Baby to Soldier)...</p>
                            <small className="text-secondary d-block mt-2">You can safely return to the roadmap or browse other pages; generation continues in the background.</small>
                        </div>
                    ) : problemsError ? (
                        <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white">
                            {problemsError}
                            <div className="mt-3">
                                <Button variant="outline-light" size="sm" onClick={startPracticeProblems}>Retry</Button>
                            </div>
                        </Alert>
                    ) : !hasProblems ? (
                        <div className="text-center py-5 themed-text-secondary">
                            <p>No practice tasks generated yet.</p>
                            <Button variant="primary" onClick={startPracticeProblems}>Generate Practice Tasks</Button>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-4" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '5px' }}>
                            {['A', 'B', 'C', 'D'].map(g => {
                                const groupProblems = node.practiceProblems.filter(p => p.group === g);
                                const GroupIcon = groupMetaData[g].icon;
                                
                                return (
                                    <div 
                                        key={g} 
                                        className="mb-4 p-3 rounded-3 border text-start"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.01)',
                                            borderColor: 'var(--glass-border)'
                                        }}
                                    >
                                        {/* Group Header Card */}
                                        <div 
                                            className="mb-3 p-3 rounded-3 border text-start"
                                            style={{
                                                background: g === 'A' ? 'rgba(25, 135, 84, 0.07)' : 
                                                            g === 'B' ? 'rgba(255, 193, 7, 0.07)' :
                                                            g === 'C' ? 'rgba(13, 110, 253, 0.07)' : 
                                                            'rgba(220, 53, 69, 0.07)',
                                                borderColor: g === 'A' ? 'rgba(25, 135, 84, 0.2)' : 
                                                             g === 'B' ? 'rgba(255, 193, 7, 0.2)' :
                                                             g === 'C' ? 'rgba(13, 110, 253, 0.2)' : 
                                                             'rgba(220, 53, 69, 0.2)'
                                            }}
                                        >
                                            <h6 className={`fw-bold text-${groupMetaData[g].badgeBg} mb-1 d-flex align-items-center gap-2 text-start`}>
                                                <GroupIcon size={16} /> {groupMetaData[g].title}
                                            </h6>
                                            <p className="small themed-text-secondary mb-0 text-start">
                                                {groupMetaData[g].description}
                                            </p>
                                        </div>

                                        <div className="d-flex flex-column gap-3 ps-2">
                                            {groupProblems.length === 0 ? (
                                                <div className="text-muted small py-2 text-start italic ps-2">
                                                    No tasks generated for this level.
                                                </div>
                                            ) : (
                                                groupProblems.map((prob, i) => {
                                                    const isCompleted = !!completedTasks[prob.id];
                                                    return (
                                                        <motion.div
                                                            key={prob.id || i}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <Card className={`border-0 themed-card bg-opacity-10 shadow-sm ${isCompleted ? 'bg-success bg-opacity-10 border-start border-success border-3' : 'bg-secondary'
                                                                }`}>
                                                                <Card.Body className="p-3">
                                                                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                                                                        <h6 className={`fw-bold mb-0 text-start ${isCompleted ? 'text-success text-decoration-line-through opacity-70' : 'themed-text-primary'}`}>
                                                                            {prob.title}
                                                                        </h6>
                                                                        <div className="d-flex gap-2 align-items-center flex-shrink-0">
                                                                            <Button
                                                                                variant="link"
                                                                                className="p-0 text-secondary hover-text-white"
                                                                                onClick={() => handleCopyTask(prob.id, `${prob.title}\n\n${prob.description}`)}
                                                                                title="Copy task details"
                                                                            >
                                                                                {copiedTaskId === prob.id ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                                                                            </Button>
                                                                            <Button
                                                                                variant="link"
                                                                                className="p-0 text-secondary"
                                                                                onClick={() => handleToggleTaskCompleted(prob.id)}
                                                                                title={isCompleted ? "Mark incomplete" : "Mark completed"}
                                                                            >
                                                                                <CheckCircle size={18} className={isCompleted ? 'text-success' : 'text-muted'} />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    <p className="small themed-text-secondary mb-0 text-start" style={{ whiteSpace: 'pre-wrap' }}>
                                                                        {prob.description}
                                                                    </p>
                                                                    <div className="d-flex gap-2 flex-wrap align-items-center w-100 mt-2" onClick={(e) => e.stopPropagation()}>
                                                                        <AskAiDropdown
                                                                            id={`ask-ai-dropdown-${prob.id || i}`}
                                                                            title="Ask AI"
                                                                            prompt={`Only provide hints, guiding questions, intuition, and partial steps and not the complete answer for this practice task: ${prob.title} - ${prob.description}. Explain in English only.`}
                                                                            settings={settings}
                                                                            variant="outline-info"
                                                                            size="sm"
                                                                        />
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        </motion.div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <JsonEditorModal
                show={showJsonModal}
                onHide={() => setShowJsonModal(false)}
                title="Edit Practice Tasks JSON"
                data={node.practiceProblems}
                onSave={handleSaveProblemsJson}
                validateSchema={validateProblemsSchema}
            />
        </div>
    );
};

export default ProblemsView;
