import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Stack, Alert, Spinner } from 'react-bootstrap';
import { ArrowLeft, Save, Trash2, Key, Info, RefreshCw, Sun, Moon } from 'lucide-react';

import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';


const Settings = ({ onBack, onSync }) => {

    const [settings, setSettings] = useState(storageService.getSettings());
    const [saved, setSaved] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);

    const handleThemeChange = (newTheme) => {
        const updated = { ...settings, theme: newTheme };
        setSettings(updated);
        storageService.saveSettings(updated);
        console.log("Theme changed to:", newTheme);
        if (onSync) onSync();
    };


    useEffect(() => {
        const fetchModels = async () => {
            if (settings.provider === 'openrouter') {
                if (!settings.openrouterKey) {
                    setAvailableModels([]);
                    return;
                }
                setLoadingModels(true);
                try {
                    const models = await aiService.listOpenRouterModels(settings.openrouterKey);
                    const mapped = models.map(m => m.id).sort((a, b) => a.localeCompare(b));
                    setAvailableModels(mapped);
                } catch (err) {
                    console.error("Error fetching OpenRouter models:", err);
                } finally {
                    setLoadingModels(false);
                }
            } else {
                if (!settings.apiKey) {
                    setAvailableModels([]);
                    return;
                }
                setLoadingModels(true);
                try {
                    const models = await aiService.listModels(settings.apiKey);
                    const filtered = models
                        .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                        .map(m => m.name.replace('models/', ''))
                        .sort((a, b) => a.localeCompare(b));
                    setAvailableModels(filtered);
                } catch (err) {
                    console.error("Error fetching Gemini models:", err);
                } finally {
                    setLoadingModels(false);
                }
            }
        };
        fetchModels();
    }, [settings.provider, settings.apiKey, settings.openrouterKey]);


    const handleSave = (e) => {
        e.preventDefault();
        try {
            storageService.saveSettings(settings);
            setSaved(true);
            if (onBack) {
                onBack();
            }
        } catch (err) {
            console.error("Failed to save settings:", err);
            alert("Failed to save settings: " + err.message);
        }
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
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={onBack}
                        className="rounded-2 d-flex align-items-center gap-2 px-3 py-2 border-opacity-50"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Dashboard</span>
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
                                <Form.Label>AI Provider</Form.Label>
                                <Form.Select
                                    value={settings.provider || 'gemini'}
                                    onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                                    className="themed-input"
                                >
                                    <option value="gemini">Google Gemini (Direct)</option>
                                    <option value="openrouter">OpenRouter</option>
                                </Form.Select>
                            </Form.Group>

                            {settings.provider === 'openrouter' ? (
                                <>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="d-flex justify-content-between">
                                            OpenRouter API Key
                                            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-decoration-none x-small" style={{ fontSize: '0.75rem' }}>
                                                Get OpenRouter Key <Key size={12} />
                                            </a>
                                        </Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={settings.openrouterKey || ''}
                                            onChange={(e) => setSettings({ ...settings, openrouterKey: e.target.value })}
                                            placeholder="Enter your OpenRouter API Key"
                                            className="themed-input"
                                        />
                                        <Form.Text className="text-secondary small d-flex align-items-center mt-2">
                                            <Info size={14} className="me-1" /> Your OpenRouter key is stored locally in your browser.
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Check
                                            type="switch"
                                            id="openrouter-search-switch"
                                            label="Enable Web Search"
                                            checked={settings.openrouterSearch !== false}
                                            onChange={(e) => setSettings({ ...settings, openrouterSearch: e.target.checked })}
                                            className="themed-text-primary"
                                        />
                                        <Form.Text className="text-secondary small">
                                            Enables real-time web searches using OpenRouter's web search tool.
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="d-flex justify-content-between align-items-center">
                                            OpenRouter Model
                                            {loadingModels && <Spinner size="sm" animation="border" variant="primary" />}
                                        </Form.Label>
                                        <Form.Select
                                            value={settings.openrouterModel || 'google/gemini-2.5-flash-lite'}
                                            onChange={(e) => setSettings({ ...settings, openrouterModel: e.target.value })}
                                            className="themed-input"
                                            disabled={loadingModels}
                                        >
                                            {availableModels.length > 0 ? (
                                                availableModels.map(model => (
                                                    <option key={model} value={model}>{model}</option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="google/gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Default)</option>
                                                    <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                                                    <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B Instruct</option>
                                                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                                    <option value="deepseek/deepseek-chat">DeepSeek V3</option>
                                                    <option value="openai/gpt-4o-mini">GPT-4o mini</option>
                                                </>
                                            )}
                                        </Form.Select>
                                        <Form.Text className="text-muted">
                                            {availableModels.length > 0 ? "Models fetched from OpenRouter API." : "Enter an OpenRouter API key to fetch available models."}
                                        </Form.Text>
                                    </Form.Group>
                                </>
                            ) : (
                                <>
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
                                            value={settings.model || 'gemini-2.5-flash-lite'}
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
                                                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Default)</option>
                                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                </>
                                            )}
                                        </Form.Select>
                                        <Form.Text className="text-muted">
                                            {availableModels.length > 0 ? "Models fetched from your API Key." : "Enter a valid API key to fetch available models."}
                                        </Form.Text>
                                    </Form.Group>
                                </>
                            )}

                            <Form.Group className="mb-4">
                                <Form.Check
                                    type="switch"
                                    id="demo-mode-switch"
                                    label="Demo Mode (Use Mock Data)"
                                    checked={settings.demoMode}
                                    onChange={(e) => setSettings({ ...settings, demoMode: e.target.checked })}
                                    className="themed-text-primary"
                                />
                                <Form.Text className="text-secondary small">
                                    Enable this to explore the app without an API key using simulated responses.
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
                                        onClick={() => handleThemeChange('dark')}
                                    >
                                        <Moon size={18} /> Dark
                                    </Button>
                                    <Button
                                        variant={settings.theme === 'light' ? 'primary' : 'outline-secondary'}
                                        className="d-flex align-items-center gap-2 flex-grow-1 justify-content-center"
                                        onClick={() => handleThemeChange('light')}
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

                        <div className="mt-5 pt-3 border-top border-secondary text-center">
                            <p className="themed-text-secondary small mb-1">
                                <strong>Course Craft</strong> v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'}
                            </p>
                            <p className="themed-text-secondary x-small opacity-50 mb-0" style={{ fontSize: '0.7rem' }}>
                                Last Deployed: {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'Just now'}
                            </p>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>

    );
};

export default Settings;
