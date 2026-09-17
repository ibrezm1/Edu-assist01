import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert, Badge } from 'react-bootstrap';
import { 
    Copy, 
    Check, 
    Sparkles, 
    Globe, 
    PlusCircle, 
    Edit3, 
    CheckCircle, 
    AlertCircle, 
    FileJson,
    ArrowUpRight
} from 'lucide-react';
import { 
    CONTEXT_TYPES, 
    getActionPresetsForContext, 
    buildPerplexityPrompt, 
    cleanAndExtractJson, 
    getPerplexityUrl 
} from '../services/perplexityService';

const JsonEditorModal = ({
    show,
    onHide,
    title,
    data,
    onSave,
    validateSchema,
    contextType = CONTEXT_TYPES.GENERIC,
    topic = '',
    nodeTitle = ''
}) => {
    const [jsonText, setJsonText] = useState('');
    const [validationError, setValidationError] = useState(null);
    const [validationSuccess, setValidationSuccess] = useState(false);

    // Get tailored action presets for this context
    const currentPresets = getActionPresetsForContext(contextType);

    // Perplexity AI State
    const [selectedAction, setSelectedAction] = useState(currentPresets[0]?.id || 'custom');
    const [customInstruction, setCustomInstruction] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [perplexityStatus, setPerplexityStatus] = useState(null); // { type: 'success'|'info'|'warning'|'error', message: string }
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [copiedJson, setCopiedJson] = useState(false);

    const textareaRef = useRef(null);
    const lineCounterRef = useRef(null);

    const handleScroll = () => {
        if (textareaRef.current && lineCounterRef.current) {
            lineCounterRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    useEffect(() => {
        if (show) {
            setJsonText(JSON.stringify(data || [], null, 2));
            setValidationError(null);
            setValidationSuccess(false);
            setPerplexityStatus(null);
            setShowCustomInput(false);
            setCustomInstruction('');

            // Automatically set to the primary context-specific action
            const presets = getActionPresetsForContext(contextType);
            setSelectedAction(presets[0]?.id || 'custom');
        }
    }, [show, data, contextType]);

    const handleValidate = () => {
        try {
            const parsed = JSON.parse(jsonText);
            if (validateSchema) {
                validateSchema(parsed);
            }
            setValidationError(null);
            setValidationSuccess(true);
            setJsonText(JSON.stringify(parsed, null, 2));
            return parsed;
        } catch (err) {
            setValidationError(err.message || String(err));
            setValidationSuccess(false);
            return null;
        }
    };

    const handleCopyJson = () => {
        navigator.clipboard.writeText(jsonText);
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
    };

    const handleStandardPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setJsonText(text);
                setValidationError(null);
                setValidationSuccess(false);
                setPerplexityStatus(null);
            }
        } catch (err) {
            alert("Clipboard read permission denied. Please paste manually using Ctrl+V or Cmd+V.");
        }
    };

    // Perplexity AI: Build prompt based on context and current JSON
    const generatePrompt = (actionToUse = selectedAction) => {
        return buildPerplexityPrompt({
            contextType,
            topic,
            nodeTitle,
            currentJson: jsonText,
            action: actionToUse,
            customInstruction: showCustomInput ? customInstruction : ''
        });
    };

    const handleCopyAndOpenPerplexity = () => {
        const prompt = generatePrompt();
        navigator.clipboard.writeText(prompt);
        setCopiedPrompt(true);

        setPerplexityStatus({
            type: 'success',
            message: '✓ Prompt & JSON copied to clipboard! Opening Perplexity AI in a new tab... Paste with Cmd+V / Ctrl+V, then copy the result back here.'
        });

        const targetUrl = getPerplexityUrl(prompt);
        window.open(targetUrl, '_blank', 'noopener,noreferrer');

        setTimeout(() => setCopiedPrompt(false), 3000);
    };

    const handleCopyPromptOnly = () => {
        const prompt = generatePrompt();
        navigator.clipboard.writeText(prompt);
        setCopiedPrompt(true);
        setPerplexityStatus({
            type: 'info',
            message: '✓ Tailored Perplexity prompt copied to clipboard!'
        });
        setTimeout(() => setCopiedPrompt(false), 2000);
    };

    // Smart Paste: Extracts and parses JSON even if Perplexity wraps in markdown ```json ... ``` or commentary
    const handleSmartPasteFromPerplexity = async () => {
        try {
            const rawText = await navigator.clipboard.readText();
            if (!rawText || !rawText.trim()) {
                setPerplexityStatus({
                    type: 'error',
                    message: 'Clipboard is empty. Please copy Perplexity\'s JSON response first.'
                });
                return;
            }

            const result = cleanAndExtractJson(rawText);
            if (result.success) {
                // Test schema validation if available
                let schemaError = null;
                if (validateSchema) {
                    try {
                        validateSchema(result.parsedData);
                    } catch (sErr) {
                        schemaError = sErr.message || String(sErr);
                    }
                }

                setJsonText(result.jsonString);
                setPerplexityStatus({
                    type: schemaError ? 'warning' : 'success',
                    message: schemaError 
                        ? `✓ Extracted JSON from Perplexity, but schema warning: ${schemaError}`
                        : '✓ Successfully extracted, cleaned & formatted JSON from Perplexity output!'
                });

                if (schemaError) {
                    setValidationError(schemaError);
                    setValidationSuccess(false);
                } else {
                    setValidationError(null);
                    setValidationSuccess(true);
                }
            } else {
                setPerplexityStatus({
                    type: 'error',
                    message: `Could not parse JSON from clipboard: ${result.error}`
                });
            }
        } catch (err) {
            alert("Clipboard read permission denied. Please paste manually into the editor with Ctrl+V / Cmd+V.");
        }
    };

    const handleSave = () => {
        const parsed = handleValidate();
        if (parsed === null) return;
        onSave(parsed);
    };

    const getContextBadgeLabel = () => {
        switch (contextType) {
            case CONTEXT_TYPES.PAPERS: return 'Research Papers';
            case CONTEXT_TYPES.RESOURCES: return 'Learning Resources';
            case CONTEXT_TYPES.BOOKS: return 'Recommended Books';
            case CONTEXT_TYPES.QUIZ: return 'Checkpoint Quiz';
            case CONTEXT_TYPES.PROBLEMS: return 'Practice Tasks';
            case CONTEXT_TYPES.FLASHCARDS: return 'Flashcards';
            case CONTEXT_TYPES.PATH: return 'Curriculum Roadmap';
            default: return 'Data Structure';
        }
    };

    const renderActionIcon = (iconName) => {
        switch (iconName) {
            case 'Globe': return <Globe size={13} />;
            case 'PlusCircle': return <PlusCircle size={13} />;
            case 'Sparkles': return <Sparkles size={13} />;
            case 'Edit3': return <Edit3 size={13} />;
            default: return <Sparkles size={13} />;
        }
    };

    const activePreset = currentPresets.find(p => p.id === selectedAction) || currentPresets[0];

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            centered
            className="themed-modal"
        >
            <Modal.Header closeButton className="border-0 pb-2 px-4 pt-4">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Modal.Title className="fw-bold themed-text-primary fs-5 mb-0">
                        {title}
                    </Modal.Title>
                    <Badge bg="info" className="bg-opacity-25 text-info border border-info border-opacity-50 fw-normal">
                        {getContextBadgeLabel()}
                    </Badge>
                    {topic && (
                        <Badge bg="secondary" className="bg-opacity-20 text-secondary fw-normal">
                            {topic}
                        </Badge>
                    )}
                </div>
            </Modal.Header>

            <Modal.Body className="px-4 py-2">
                {/* Perplexity AI Assistant Bar */}
                <div 
                    className="p-3 mb-3 rounded-3 border"
                    style={{
                        backgroundColor: 'rgba(6, 182, 212, 0.04)',
                        borderColor: 'rgba(6, 182, 212, 0.25)'
                    }}
                >
                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                        <div className="d-flex align-items-center gap-2">
                            <div 
                                className="p-1 rounded-2 d-flex align-items-center justify-content-center"
                                style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee' }}
                            >
                                <Sparkles size={16} />
                            </div>
                            <span className="fw-bold text-info" style={{ fontSize: '0.9rem', letterSpacing: '0.02em' }}>
                                Perplexity AI Assistant
                            </span>
                            <span className="text-secondary small d-none d-sm-inline">
                                • Context-aware web research & JSON collaborator
                            </span>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Button
                                variant="outline-info"
                                size="sm"
                                onClick={handleSmartPasteFromPerplexity}
                                className="d-flex align-items-center gap-1 py-1 px-2"
                                style={{ fontSize: '0.78rem' }}
                                title="Extracts clean JSON from Perplexity output in clipboard"
                            >
                                <FileJson size={13} />
                                <span>Smart Paste from Perplexity</span>
                            </Button>
                        </div>
                    </div>

                    {/* Section-Specific Action Selector Pills */}
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        {currentPresets.map(action => {
                            const isSelected = selectedAction === action.id && (!showCustomInput || action.id === 'custom');
                            return (
                                <button
                                    key={action.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedAction(action.id);
                                        if (action.id === 'custom') {
                                            setShowCustomInput(true);
                                        } else {
                                            setShowCustomInput(false);
                                        }
                                    }}
                                    className={`btn btn-sm py-1 px-2 d-flex align-items-center gap-1 rounded-2 transition-all ${
                                        isSelected 
                                            ? 'btn-info text-dark fw-semibold shadow-sm' 
                                            : 'btn-outline-secondary text-light'
                                    }`}
                                    style={{ fontSize: '0.78rem' }}
                                >
                                    {renderActionIcon(action.icon)}
                                    <span>{action.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom instruction input if selected */}
                    {showCustomInput && (
                        <div className="mb-2">
                            <Form.Control
                                size="sm"
                                type="text"
                                placeholder="E.g., Find open-access arXiv papers from 2024-2026, or add 5 hard questions about edge cases..."
                                value={customInstruction}
                                onChange={(e) => setCustomInstruction(e.target.value)}
                                className="themed-input"
                                style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    borderColor: 'rgba(6, 182, 212, 0.4)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.82rem'
                                }}
                            />
                        </div>
                    )}

                    {/* Action Execution Bar */}
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-1">
                        <div className="text-secondary small" style={{ fontSize: '0.76rem' }}>
                            {activePreset?.description || 'Perplexity will review and update your JSON according to this section\'s schema.'}
                        </div>

                        <div className="d-flex align-items-center gap-2 ms-auto">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={handleCopyPromptOnly}
                                className="d-flex align-items-center gap-1 py-1 px-2 text-nowrap"
                                style={{ fontSize: '0.78rem' }}
                            >
                                {copiedPrompt ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                                <span>Copy Prompt Only</span>
                            </Button>

                            <Button
                                variant="info"
                                size="sm"
                                onClick={handleCopyAndOpenPerplexity}
                                className="d-flex align-items-center gap-1 py-1 px-3 fw-semibold text-dark text-nowrap shadow-sm"
                                style={{ fontSize: '0.8rem' }}
                            >
                                <Sparkles size={14} />
                                <span>Copy & Open in Perplexity</span>
                                <ArrowUpRight size={14} />
                            </Button>
                        </div>
                    </div>

                    {/* Perplexity Workflow Status Toast / Alert */}
                    {perplexityStatus && (
                        <Alert 
                            variant={perplexityStatus.type === 'error' ? 'danger' : perplexityStatus.type === 'warning' ? 'warning' : 'info'}
                            className="py-1 px-2 mt-2 mb-0 small border-0 d-flex align-items-center justify-content-between"
                            style={{
                                backgroundColor: perplexityStatus.type === 'error' 
                                    ? 'rgba(239, 68, 68, 0.15)' 
                                    : perplexityStatus.type === 'warning'
                                    ? 'rgba(245, 158, 11, 0.15)'
                                    : 'rgba(6, 182, 212, 0.15)',
                                color: perplexityStatus.type === 'error'
                                    ? '#fca5a5'
                                    : perplexityStatus.type === 'warning'
                                    ? '#fcd34d'
                                    : '#67e8f9',
                                fontSize: '0.78rem'
                            }}
                        >
                            <span>{perplexityStatus.message}</span>
                            <button 
                                type="button" 
                                className="btn-close btn-close-white ms-2" 
                                style={{ fontSize: '0.5rem' }} 
                                onClick={() => setPerplexityStatus(null)}
                            />
                        </Alert>
                    )}
                </div>

                {/* Editor Container with synchronized Line Numbers */}
                <Form.Group className="mb-2">
                    <div 
                        className="d-flex position-relative rounded-3 border overflow-hidden" 
                        style={{ 
                            borderColor: 'var(--glass-border)', 
                            backgroundColor: 'rgba(0, 0, 0, 0.2)' 
                        }}
                    >
                        {/* Line numbers column */}
                        <div
                            ref={lineCounterRef}
                            style={{
                                width: '45px',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                borderRight: '1px solid var(--glass-border)',
                                color: 'var(--text-secondary)',
                                fontFamily: 'Courier New, Courier, monospace',
                                fontSize: '0.85rem',
                                lineHeight: '1.5',
                                padding: '10px 0',
                                textAlign: 'right',
                                paddingRight: '8px',
                                userSelect: 'none',
                                overflow: 'hidden',
                                whiteSpace: 'pre'
                            }}
                        >
                            {Array.from({ length: Math.max(1, jsonText.split('\n').length) }, (_, i) => i + 1).join('\n')}
                        </div>

                        {/* Textarea */}
                        <Form.Control
                            ref={textareaRef}
                            as="textarea"
                            rows={14}
                            value={jsonText}
                            onChange={(e) => {
                                setJsonText(e.target.value);
                                setValidationError(null);
                                setValidationSuccess(false);
                            }}
                            onScroll={handleScroll}
                            wrap="off"
                            style={{
                                flex: 1,
                                fontFamily: 'Courier New, Courier, monospace',
                                fontSize: '0.85rem',
                                lineHeight: '1.5',
                                padding: '10px',
                                backgroundColor: 'transparent',
                                color: 'var(--text-primary)',
                                border: 'none',
                                outline: 'none',
                                resize: 'none',
                                whiteSpace: 'pre',
                                overflowX: 'auto'
                            }}
                            className="themed-input shadow-none rounded-0"
                        />
                    </div>
                </Form.Group>

                {validationError && (
                    <Alert variant="danger" className="py-2 px-3 small border-0 text-danger bg-danger bg-opacity-10 mb-0 d-flex align-items-center gap-2">
                        <AlertCircle size={16} />
                        <div>
                            <strong>Invalid JSON:</strong> {validationError}
                        </div>
                    </Alert>
                )}

                {validationSuccess && (
                    <Alert variant="success" className="py-2 px-3 small border-0 text-success bg-success bg-opacity-10 mb-0 d-flex align-items-center gap-2">
                        <CheckCircle size={16} />
                        <div>
                            <strong>Validation Success!</strong> The JSON format and schema are valid.
                        </div>
                    </Alert>
                )}
            </Modal.Body>

            <Modal.Footer className="border-0 px-4 pb-4 pt-2 d-flex justify-content-between flex-wrap gap-2">
                <div className="d-flex gap-2 flex-wrap">
                    <Button 
                        variant="outline-info" 
                        size="sm" 
                        onClick={handleValidate}
                    >
                        Validate JSON
                    </Button>
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={handleCopyJson}
                    >
                        {copiedJson ? 'Copied!' : 'Copy JSON'}
                    </Button>
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={handleStandardPaste}
                    >
                        Paste JSON
                    </Button>
                </div>
                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={onHide}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={handleSave}
                        disabled={validationError !== null}
                    >
                        Save Changes
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default JsonEditorModal;
