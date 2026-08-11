import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const JsonEditorModal = ({
    show,
    onHide,
    title,
    data,
    onSave,
    validateSchema
}) => {
    const [jsonText, setJsonText] = useState('');
    const [validationError, setValidationError] = useState(null);
    const [validationSuccess, setValidationSuccess] = useState(false);

    const [copied, setCopied] = useState(false);

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
        }
    }, [show, data]);

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

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setJsonText(text);
                setValidationError(null);
                setValidationSuccess(false);
            }
        } catch (err) {
            alert("Clipboard read permission denied. Please paste manually using Ctrl+V or Cmd+V.");
        }
    };

    const handleSave = () => {
        const parsed = handleValidate();
        if (parsed === null) return;
        onSave(parsed);
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
            className="themed-modal"
        >
            <Modal.Header closeButton className="border-0 pb-0 px-4 pt-4">
                <Modal.Title className="fw-bold themed-text-primary fs-5">
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-3">
                <p className="themed-text-secondary small mb-3">
                    Directly edit the structure below in standard JSON format. Ensure all brackets, commas, and keys are properly structured.
                </p>
                <Form.Group className="mb-3">
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
                            rows={15}
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
                    <Alert variant="danger" className="py-2 px-3 small border-0 text-danger bg-danger bg-opacity-10 mb-0">
                        <strong>Invalid JSON:</strong> {validationError}
                    </Alert>
                )}

                {validationSuccess && (
                    <Alert variant="success" className="py-2 px-3 small border-0 text-success bg-success bg-opacity-10 mb-0">
                        <strong>Validation Success!</strong> The JSON format is correct.
                    </Alert>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 px-4 pb-4 pt-2 d-flex justify-content-between">
                <div className="d-flex gap-2">
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
                        onClick={handleCopy}
                    >
                        {copied ? 'Copied!' : 'Copy JSON'}
                    </Button>
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        onClick={handlePaste}
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
