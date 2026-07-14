import React from 'react';
import { Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { GraduationCap, ExternalLink } from 'lucide-react';
import TopNavigation from '../TopNavigation';

const PapersView = ({
    node,
    topic,
    theme,
    papersLoading,
    papersError,
    startResearchPapers,
    onBack,
    onOpenChat,
    onOpenSettings
}) => {
    const hasPapers = node.researchPapers && node.researchPapers.length > 0;

    return (
        <Row className="justify-content-center">
            <Col md={8} lg={6}>
                <TopNavigation
                    title={`Papers: ${node.title}`}
                    onBack={onBack}
                    onChat={onOpenChat}
                    onSettings={onOpenSettings}
                    theme={theme}
                />
                <Card className="themed-card shadow-lg">
                    <Card.Header className="border-secondary py-3">
                        <h5 className="mb-0 themed-text-primary d-flex align-items-center gap-2">
                            <GraduationCap size={18} className="text-info" /> Latest Research Papers
                        </h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {papersLoading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="light" className="mb-3" />
                                <p className="themed-text-secondary mb-1">Searching scholarly databases via Web Search...</p>
                                <small className="text-secondary d-block mt-2">You can safely return to the roadmap or browse other pages; generation continues in the background.</small>
                            </div>
                        ) : papersError ? (
                            <Alert variant="danger" className="bg-danger bg-opacity-10 border-danger text-white">
                                {papersError}
                                <div className="mt-3">
                                    <Button variant="outline-light" size="sm" onClick={startResearchPapers}>Retry</Button>
                                </div>
                            </Alert>
                        ) : !hasPapers ? (
                            <div className="text-center py-5 themed-text-secondary">
                                <p>No research papers found yet.</p>
                                <Button variant="primary" onClick={startResearchPapers}>Search Research Papers</Button>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {node.researchPapers.map((paper, i) => (
                                    <Card key={i} className="bg-secondary bg-opacity-10 border-0 mb-2">
                                        <Card.Body className="p-3">
                                            <h6 className="themed-text-primary fw-bold mb-2">{paper.title}</h6>
                                            <p className="small themed-text-secondary mb-3" style={{ fontSize: '0.85rem' }}>
                                                <strong>Key Idea:</strong> {paper.keyIdea}
                                            </p>
                                            {paper.url && (
                                                <Button
                                                    href={paper.url.startsWith('http') ? paper.url : `https://www.google.com/search?q=${encodeURIComponent(paper.url)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    variant="outline-light"
                                                    size="sm"
                                                    className="px-3"
                                                    style={{ fontSize: '0.8rem' }}
                                                >
                                                    Read Paper <ExternalLink size={12} className="ms-1" />
                                                </Button>
                                            )}
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default PapersView;
