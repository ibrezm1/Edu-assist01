import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Stack, Alert, Spinner } from 'react-bootstrap';
import { ArrowLeft, Save, Trash2, Key, Info, RefreshCw, Sun, Moon } from 'lucide-react';

import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';


const Settings = ({ onBack }) => {
    const [settings, setSettings] = useState(storageService.getSettings());
    const [saved, setSaved] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);

    useEffect(() => {
        const fetchModels = async () => {
            if (!settings.apiKey) {
                setAvailableModels([]);
                return;
            }
            setLoadingModels(true);
            try {
                const models = await aiService.listModels(settings.apiKey);
                // Filter for models that support generateContent (usually 'models/' prefix)
                const filtered = models
                    .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                    .map(m => m.name.replace('models/', ''));
                setAvailableModels(filtered);
            } catch (err) {
                console.error("Error fetching models:", err);
            } finally {
                setLoadingModels(false);
            }
        };
        fetchModels();
    }, [settings.apiKey]);


    const handleSave = (e) => {
        e.preventDefault();
        storageService.saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear all learning history? This cannot be undone.')) {
            localStorage.removeItem('getpath_db');
            window.location.reload();
        }
    };

    return (
        <Row className="justify-content-center">
            <Col md={8} lg={6}>
                <div className="mb-4">
                    <Button variant="link" onClick={onBack} className="themed-text-primary text-decoration-none p-0 d-flex align-items-center opacity-75">
                        <ArrowLeft size={18} className="me-2" /> Back to Dashboard
                    </Button>

                </div>

                <Card className="themed-card shadow-lg">
                    <Card.Header className="bg-transparent border-secondary py-3">
                        <h4 className="mb-0">Settings</h4>
                    </Card.Header>


                    <Card.Body className="p-4">
                        {saved && (
                            <Alert variant="success" className="bg-success bg-opacity-10 border-success text-success mb-4">
                                Settings saved successfully!
                            </Alert>
                        )}

                        <Form onSubmit={handleSave}>
                            <h6 className="text-primary mb-3">AI Configuration</h6>

                            <Form.Group className="mb-4">
                                <Form.Label className="d-flex justify-content-between">
                                    Gemini API Key
                                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-decoration-none x-small" style={{ fontSize: '0.75rem' }}>
                                        Get Free Key <Key size={12} />
                                    </a>
                                </Form.Label>
                                <Form.Control
                                    type="password"
                                    value={settings.apiKey}
                                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                    placeholder="Enter your Google Gemini API Key"
                                    className="themed-input"


                                />
                                <Form.Text className="text-secondary small d-flex align-items-center mt-2">
                                    <Info size={14} className="me-1" /> Your key is stored locally in your browser.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="d-flex justify-content-between align-items-center">
                                    Gemini Model
                                    {loadingModels && <Spinner size="sm" animation="border" variant="primary" />}
                                </Form.Label>
                                <Form.Select
                                    value={settings.model || 'gemini-2.0-flash'}
                                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                                    className="themed-input"


                                    disabled={loadingModels}
                                >
                                    {availableModels.length > 0 ? (
                                        availableModels.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Default)</option>
                                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        </>
                                    )}
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    {availableModels.length > 0 ? "Models fetched from your API Key." : "Enter a valid API key to fetch available models."}
                                </Form.Text>
                            </Form.Group>



                            <hr className="border-secondary my-4" />

                            <h6 className="text-primary mb-3">Assessment & Quiz Settings</h6>

                            <Row className="mb-4">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Assessment Questions</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={settings.assessmentQuestions}
                                            onChange={(e) => setSettings({ ...settings, assessmentQuestions: parseInt(e.target.value) })}
                                            className="themed-input"


                                        />
                                        <Form.Text className="text-muted">Questions during onboarding</Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Checkpoint Questions</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={settings.quizQuestions}
                                            onChange={(e) => setSettings({ ...settings, quizQuestions: parseInt(e.target.value) })}
                                            className="themed-input"


                                        />
                                        <Form.Text className="text-muted">Questions per module</Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <hr className="border-secondary my-4" style={{ borderColor: 'var(--glass-border)' }} />

                            <h6 className="text-primary mb-3">Appearance</h6>
                            <Form.Group className="mb-4">
                                <Form.Label>Theme Mode</Form.Label>
                                <div className="d-flex gap-3">
                                    <Button
                                        variant={settings.theme === 'dark' ? 'primary' : 'outline-secondary'}
                                        className="d-flex align-items-center gap-2 flex-grow-1 justify-content-center"
                                        onClick={() => setSettings({ ...settings, theme: 'dark' })}
                                    >
                                        <Moon size={18} /> Dark
                                    </Button>
                                    <Button
                                        variant={settings.theme === 'light' ? 'primary' : 'outline-secondary'}
                                        className="d-flex align-items-center gap-2 flex-grow-1 justify-content-center"
                                        onClick={() => setSettings({ ...settings, theme: 'light' })}
                                    >
                                        <Sun size={18} /> Light
                                    </Button>
                                </div>
                            </Form.Group>

                            <hr className="border-secondary my-4" style={{ borderColor: 'var(--glass-border)' }} />


                            <h6 className="text-primary mb-3">Data Management</h6>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <p className="mb-0 fw-bold">Clear Local Data</p>
                                    <p className="small text-secondary mb-0">Deletes all saved paths and history from this browser.</p>
                                </div>
                                <Button variant="outline-danger" size="sm" onClick={handleClearHistory}>
                                    <Trash2 size={16} className="me-1" /> Clear All
                                </Button>
                            </div>

                            <div className="d-grid mt-5">
                                <Button variant="primary" type="submit" size="lg">
                                    <Save size={18} className="me-2" /> Save Settings
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default Settings;
