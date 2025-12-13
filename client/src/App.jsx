import React, { useState } from 'react';
import Onboarding from './components/Onboarding';
import Assessment from './components/Assessment';
import PathView from './components/PathView';
import NodeContent from './components/NodeContent';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_key') || '');
  const [topic, setTopic] = useState('');
  const [step, setStep] = useState('onboarding'); // onboarding, assessment, path, node
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [completedNodes, setCompletedNodes] = useState([]);
  const [pathData, setPathData] = useState(null);

  // Helper to persist key
  const handleStart = (key, topicName) => {
    setApiKey(key);
    setTopic(topicName);
    localStorage.setItem('gemini_key', key);
    setStep('assessment');
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

  return (
    <div>
      {step === 'onboarding' && <Onboarding onStart={handleStart} />}

      {step === 'assessment' && (
        <Assessment
          apiKey={apiKey}
          topic={topic}
          onComplete={handleAssessmentComplete}
        />
      )}

      {step === 'path' && (
        <PathView
          apiKey={apiKey}
          topic={topic}
          assessmentResults={assessmentResults}
          onOpenNode={handleOpenNode}
          completedNodes={completedNodes}
          pathData={pathData}
          setPathData={setPathData}
          updateNodeResources={updateNodeResources}
        />
      )}

      {step === 'node' && currentNode && (
        <NodeContent
          apiKey={apiKey}
          node={currentNode}
          topic={topic}
          onBack={() => setStep('path')}
          onCompleteNode={handleCompleteNode}
          updateNodeResources={updateNodeResources}
        />
      )}
    </div>
  );
}

export default App;
