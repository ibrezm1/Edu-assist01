import React, { useState } from 'react';
import { Container } from 'react-bootstrap';

import Onboarding from './components/Onboarding';
import Assessment from './components/Assessment';
import PathView from './components/PathView';
import NodeContent from './components/NodeContent';
import Settings from './components/Settings';
import { storageService } from './services/storageService';


function App() {
  const [topic, setTopic] = useState('');
  const [step, setStep] = useState('onboarding'); // onboarding, assessment, path, node
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [completedNodes, setCompletedNodes] = useState([]);
  const [pathData, setPathData] = useState(null);
  const [settings, setSettings] = useState(storageService.getSettings());

  const refreshSettings = () => {
    setSettings(storageService.getSettings());
  };



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
    // Update current node if it's open
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

    <div className="bg-dark min-vh-100 text-white">
      <Container className="py-4">
        {step === 'onboarding' && (
          <Onboarding
            onStart={handleStart}
            onSelectSavedPath={handleSelectSavedPath}
            onOpenSettings={() => setStep('settings')}
          />
        )}

        {step === 'settings' && (
          <Settings
            onBack={() => {
              refreshSettings();
              setStep('onboarding');
            }}
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
