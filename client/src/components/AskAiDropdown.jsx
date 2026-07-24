import React, { useState } from 'react';
import { DropdownButton, Dropdown } from 'react-bootstrap';
import { Copy, Check, ExternalLink } from 'lucide-react';

const AskAiDropdown = ({
    prompt,
    settings,
    title = "Ask AI",
    variant = "outline-info",
    size = "sm",
    id,
    className = ""
}) => {
    const [copiedId, setCopiedId] = useState(null);

    const providers = settings?.askAiProviders || [];
    const enabledProviders = providers.filter(p => p.enabled !== false);

    const handleCopyAndOpen = (providerId, textToCopy, urlToOpen) => {
        navigator.clipboard.writeText(textToCopy);
        setCopiedId(providerId);
        setTimeout(() => {
            setCopiedId(null);
            if (urlToOpen) {
                window.open(urlToOpen, '_blank');
            }
        }, 1000);
    };

    if (enabledProviders.length === 0) {
        return null;
    }

    return (
        <DropdownButton
            id={id}
            title={title}
            variant={variant}
            size={size}
            className={`px-0 ${className}`}
            style={{ fontSize: size === 'sm' ? '0.75rem' : '0.85rem' }}
        >
            {enabledProviders.map(provider => {
                const getCompiledPrompt = () => {
                    if (!provider.customInstructions || !provider.customInstructions.trim()) {
                        return prompt;
                    }
                    const trimmedBase = prompt.trim();
                    const needsPeriod = !/[.!?]$/.test(trimmedBase);
                    return `${trimmedBase}${needsPeriod ? '.' : ''} ${provider.customInstructions.trim()}`;
                };

                const compiledPrompt = getCompiledPrompt();

                if (provider.type === 'url') {
                    const finalUrl = provider.url.replace('{query}', encodeURIComponent(compiledPrompt));
                    return (
                        <Dropdown.Item
                            key={provider.id}
                            href={finalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="d-flex align-items-center justify-content-between gap-3"
                        >
                            <span>{provider.name}</span>
                            <ExternalLink size={12} className="text-secondary opacity-50" />
                        </Dropdown.Item>
                    );
                } else if (provider.type === 'copy') {
                    const isCopied = copiedId === provider.id;
                    return (
                        <Dropdown.Item
                            key={provider.id}
                            onClick={() => handleCopyAndOpen(provider.id, compiledPrompt, provider.url)}
                            className="d-flex align-items-center justify-content-between gap-3"
                        >
                            <span>{isCopied ? `Copied & Opening...` : provider.name}</span>
                            {isCopied ? (
                                <Check size={12} className="text-success" />
                            ) : (
                                <Copy size={12} className="text-secondary opacity-50" />
                            )}
                        </Dropdown.Item>
                    );
                }
                return null;
            })}

            <Dropdown.Divider />
            <Dropdown.Item
                onClick={() => handleCopyAndOpen('copy-only', prompt, null)}
                className="d-flex align-items-center justify-content-between gap-3"
            >
                <span>{copiedId === 'copy-only' ? 'Copied!' : 'Copy Prompt'}</span>
                {copiedId === 'copy-only' ? (
                    <Check size={12} className="text-success" />
                ) : (
                    <Copy size={12} className="text-secondary opacity-50" />
                )}
            </Dropdown.Item>
        </DropdownButton>
    );
};

export default AskAiDropdown;
