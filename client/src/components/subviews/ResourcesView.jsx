import React from 'react';
import { Row, Col, Card, Button, Spinner, Alert, Stack } from 'react-bootstrap';
import { Play, ExternalLink, RefreshCw, Layers, Brain, GraduationCap, CheckCircle, Globe, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import TopNavigation from '../TopNavigation';

const ResourcesView = ({
    node,
    theme,
    settings = {},
    resourcesLoading,
    resourceError,
    quizLoading,
    handleRefreshResources,
    startFlashcards,
    startPracticeProblems,
    startResearchPapers,
    startQuiz,
    onBack,
    onOpenChat,
    onOpenSettings
}) => {
    return (
        <Row className="justify-content-center">
            <Col md={10} lg={8}>
                <TopNavigation
                    title={node.title}
                    onBack={onBack}
                    onChat={onOpenChat}
                    onSettings={onOpenSettings}
                    theme={theme}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card className="themed-card shadow-lg">
                        <Card.Body className="p-4">
                            <p className="lead themed-text-secondary mb-3">{node.description}</p>

                            <div className="d-flex align-items-center gap-3 mb-5 p-3 bg-secondary bg-opacity-10 rounded-3 border border-secondary border-opacity-10 flex-wrap">
                                <span className="themed-text-secondary small fw-semibold">Quick Search Google:</span>
                                <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    className="d-flex align-items-center gap-2 py-1 px-3 rounded-pill"
                                    href={`https://www.google.com/search?q=${encodeURIComponent(node.title + ' ' + node.description)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Search this topic on Google Web"
                                >
                                    <Globe size={13} />
                                    <span style={{ fontSize: '0.8rem' }}>Web</span>
                                </Button>
                                <Button 
                                    variant="outline-info" 
                                    size="sm" 
                                    className="d-flex align-items-center gap-2 py-1 px-3 rounded-pill"
                                    href={`https://www.google.com/search?q=${encodeURIComponent(node.title + ' ' + node.description)}&tbm=vid`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Search this topic on Google Videos"
                                >
                                    <Video size={13} />
                                    <span style={{ fontSize: '0.8rem' }}>Videos</span>
                                </Button>
                            </div>

                            {resourceError && (
                                <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>{resourceError}</span>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => window.location.reload()}
                                        >
                                            Retry
                                        </Button>
                                    </div>
                                </Alert>
                            )}

                            <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                                <h4 className="mb-0 themed-text-primary">Recommended Resources</h4>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={handleRefreshResources}
                                    disabled={resourcesLoading}
                                    className="d-flex align-items-center gap-2"
                                    title={resourcesLoading ? 'Refreshing...' : 'Refresh links'}
                                >
                                    <RefreshCw size={14} className={resourcesLoading ? 'spinner-spin' : ''} />
                                    <span className="d-none d-md-inline">{resourcesLoading ? 'Refreshing...' : 'Refresh links'}</span>
                                </Button>
                            </Stack>

                            {resourcesLoading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="light" className="mb-3" />
                                    <p className="themed-text-secondary">Curating the best resources for you...</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {!resourceError && node.resources && node.resources.map((res, i) => {
                                        const resourceUrl = res.url.startsWith('http') ? res.url : `https://www.google.com/search?q=${encodeURIComponent(res.url)}`;
                                        return (
                                            <Card 
                                                key={i} 
                                                className="bg-secondary bg-opacity-10 border-0 mb-3 text-decoration-none resource-card"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => window.open(resourceUrl, '_blank')}
                                            >
                                                <Card.Body className="d-flex flex-column gap-3 p-3">
                                                    <div className="d-flex align-items-start gap-3 w-100">
                                                        <div className="mt-1 flex-shrink-0">
                                                            {res.type === 'video' ? <Play size={24} className="text-danger" /> : <ExternalLink size={24} className="text-primary" />}
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <h5 className="mb-1 themed-text-primary resource-card-title">{res.title}</h5>
                                                            <p className="themed-text-secondary small mb-0">{res.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex gap-2 flex-wrap align-items-center w-100 mt-1">
                                                        {settings.enableMetaAI !== false && (
                                                            <Button 
                                                                variant="outline-success" 
                                                                size="sm" 
                                                                className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50"
                                                                style={{ fontSize: '0.75rem' }}
                                                                href={`https://wa.me/13135550002?text=${encodeURIComponent('Please explain this: ' + res.title + ' - ' + res.description)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                title="Ask Meta AI on WhatsApp"
                                                            >
                                                                <span>Meta AI</span>
                                                            </Button>
                                                        )}
                                                        {settings.enableChatGPT !== false && (
                                                            <Button 
                                                                variant="outline-warning" 
                                                                size="sm" 
                                                                className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50"
                                                                style={{ fontSize: '0.75rem' }}
                                                                href={`https://chatgpt.com/?q=${encodeURIComponent('Please explain this: ' + res.title + ' - ' + res.description)}&hints=search&temporary-chat=true`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                title="Ask ChatGPT (Temporary Chat)"
                                                            >
                                                                <span>ChatGPT</span>
                                                            </Button>
                                                        )}
                                                        {settings.enablePerplexity !== false && (
                                                            <Button 
                                                                variant="outline-secondary" 
                                                                size="sm" 
                                                                className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50"
                                                                style={{ fontSize: '0.75rem' }}
                                                                href={`https://www.perplexity.ai/search?q=${encodeURIComponent('Please explain this: ' + res.title + ' - ' + res.description)}&focus=${res.type === 'video' ? 'youtube' : 'internet'}&copilot=false`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                title="Ask Perplexity AI"
                                                            >
                                                                <span>Perplexity</span>
                                                            </Button>
                                                        )}
                                                        <div className="ms-auto">
                                                            {res.type === 'video' ? (
                                                                <Button 
                                                                    variant="outline-info" 
                                                                    size="sm" 
                                                                    className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    href={`https://www.google.com/search?q=${encodeURIComponent(res.title + ' ' + res.description)}&tbm=vid`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    title="Search this video on Google Videos"
                                                                >
                                                                    <Video size={11} />
                                                                    <span>Videos</span>
                                                                </Button>
                                                            ) : (
                                                                <Button 
                                                                    variant="outline-primary" 
                                                                    size="sm" 
                                                                    className="py-1 px-2 rounded-3 d-flex align-items-center gap-1 border-opacity-50"
                                                                    style={{ fontSize: '0.75rem' }}
                                                                    href={`https://www.google.com/search?q=${encodeURIComponent(res.title + ' ' + res.description)}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    title="Search this resource on Google Web"
                                                                >
                                                                    <Globe size={11} />
                                                                    <span>Web</span>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        );
                                    })}

                                    {!resourceError && (!node.resources || node.resources.length === 0) && !resourcesLoading && (
                                        <div className="text-center py-4 themed-text-secondary">
                                            No resources found for this module.
                                        </div>
                                    )}
                                </div>
                            )}

                             <div className="mt-5 pt-3 border-top border-secondary">
                                 <p className="themed-text-secondary text-center mb-4">Select your next study step:</p>
                                 <Row className="g-3 justify-content-center">
                                     <Col xs={6} md={3}>
                                         <Button
                                             variant="outline-primary"
                                             className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 rounded-3 border-opacity-50"
                                             onClick={startFlashcards}
                                             disabled={resourcesLoading}
                                             title="Study Flashcards"
                                         >
                                             <Layers size={20} className="text-primary" />
                                             <span className="fw-semibold small text-center">Study Flashcards</span>
                                         </Button>
                                     </Col>
                                     <Col xs={6} md={3}>
                                         <Button
                                             variant="outline-warning"
                                             className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 rounded-3 border-opacity-50"
                                             onClick={startPracticeProblems}
                                             disabled={resourcesLoading}
                                             title="Practice Tasks"
                                         >
                                             <Brain size={20} className="text-warning" />
                                             <span className="fw-semibold small text-center">Practice Tasks</span>
                                         </Button>
                                     </Col>
                                     <Col xs={6} md={3}>
                                         <Button
                                             variant="outline-info"
                                             className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 rounded-3 border-opacity-50"
                                             onClick={startResearchPapers}
                                             disabled={resourcesLoading}
                                             title="Research Papers"
                                         >
                                             <GraduationCap size={20} className="text-info" />
                                             <span className="fw-semibold small text-center">Research Papers</span>
                                         </Button>
                                     </Col>
                                     <Col xs={6} md={3}>
                                         <Button
                                             variant="primary"
                                             className="w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-2 rounded-3"
                                             onClick={startQuiz}
                                             disabled={quizLoading || resourcesLoading}
                                             title="Take Quiz"
                                         >
                                             {quizLoading ? (
                                                 <>
                                                     <Spinner animation="border" size="sm" />
                                                     <span className="small text-center">Generating...</span>
                                                 </>
                                             ) : (
                                                 <>
                                                     <CheckCircle size={20} />
                                                     <span className="fw-semibold small text-center">Take Quiz</span>
                                                 </>
                                             )}
                                         </Button>
                                     </Col>
                                 </Row>
                             </div>
                        </Card.Body>
                    </Card>
                </motion.div>
            </Col>
        </Row>
    );
};

export default ResourcesView;
