import React, { useState, useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { Settings as SettingsIcon, MessageSquare } from 'lucide-react';

import Onboarding from './components/Onboarding';
import Assessment from './components/Assessment';
import PathView from './components/PathView';
import NodeContent from './components/NodeContent';
import Settings from './components/Settings';
import Chat from './components/Chat';
import { storageService } from './services/storageService';

function App() {
  const [topic, setTopic] = useState('');
  const [step, setStep] = useState('onboarding'); // onboarding, assessment, path, node, settings, chat
  const [prevStep, setPrevStep] = useState('onboarding');
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [completedNodes, setCompletedNodes] = useState([]);
  const [pathData, setPathData] = useState(null);
  const [settings, setSettings] = useState(storageService.getSettings());

  const refreshSettings = () => {
    setSettings(storageService.getSettings());
  };

  const handleOpenSettings = () => {
    setPrevStep(step);
    setStep('settings');
  };

  const handleOpenChat = () => {
    setPrevStep(step);
    setStep('chat');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  const handleStart = (topicName) => {
    setTopic(topicName);
    setStep('assessment');
  };

  const handleSelectSavedPath = (data) => {
    setTopic(data.topic);
    setPathData(data);
    setStep('path');
  };

  const handleAssessmentComplete = (results) => {
    setAssessmentResults(results);
    setStep('path');
  };

  const handleOpenNode = (node) => {
    setCurrentNode(node);
    setStep('node');
  };

  const updateNodeResources = (nodeId, resources) => {
    if (!pathData) return;
    const updatedNodes = pathData.nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, resources };
      }
      return n;
    });
    setPathData({ ...pathData, nodes: updatedNodes });
    if (currentNode && currentNode.id === nodeId) {
      setCurrentNode({ ...currentNode, resources });
    }
  };

  const handleCompleteNode = (success) => {
    if (success && currentNode) {
      if (!completedNodes.includes(currentNode.id)) {
        setCompletedNodes([...completedNodes, currentNode.id]);
      }
    }
    setStep('path');
    setCurrentNode(null);
  };

  const handleGoHome = () => {
    setStep('onboarding');
    setTopic('');
    setPathData(null);
    setAssessmentResults(null);
    setCompletedNodes([]);
  };

  return (
    <div className="min-vh-100 transition-theme" style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <Container className="py-4">
        {/* Floating Action Buttons */}
        {step !== 'settings' && step !== 'chat' && (
          <div className="position-fixed top-0 end-0 p-3 d-flex flex-column gap-2" style={{ zIndex: 1050 }}>
            <Button
              variant="link"
              className="floating-settings rounded-circle p-0"
              onClick={handleOpenSettings}
              title="Settings"
            >
              <SettingsIcon size={20} />
            </Button>
            <Button
              variant="link"
              className="floating-settings rounded-circle p-0"
              onClick={handleOpenChat}
              title="Tutor Chat"
              style={{ background: 'var(--primary-color)', color: 'white' }}
            >
              <MessageSquare size={20} />
            </Button>
          </div>
        )}

        {step === 'onboarding' && (
          <Onboarding
            onStart={handleStart}
            onSelectSavedPath={handleSelectSavedPath}
            onOpenSettings={handleOpenSettings}
          />
        )}

        {step === 'settings' && (
          <Settings
            onBack={() => {
              refreshSettings();
              setStep(prevStep);
            }}
            onSync={refreshSettings}
          />
        )}

        {step === 'chat' && (
          <Chat
            settings={settings}
            onBack={() => setStep(prevStep)}
          />
        )}

        {step === 'assessment' && (
          <Assessment
            topic={topic}
            settings={settings}
            onComplete={handleAssessmentComplete}
          />
        )}

        {step === 'path' && (
          <PathView
            topic={topic}
            settings={settings}
            assessmentResults={assessmentResults}
            onOpenNode={handleOpenNode}
            completedNodes={completedNodes}
            pathData={pathData}
            setPathData={setPathData}
            updateNodeResources={updateNodeResources}
            onHome={handleGoHome}
          />
        )}

        {step === 'node' && currentNode && (
          <NodeContent
            node={currentNode}
            topic={topic}
            settings={settings}
            onBack={() => setStep('path')}
            onCompleteNode={handleCompleteNode}
            updateNodeResources={updateNodeResources}
          />
        )}
      </Container>
    </div>
  );
}

export default App;
