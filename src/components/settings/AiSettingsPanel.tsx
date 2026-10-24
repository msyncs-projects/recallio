'use client';

import React, { useState } from 'react';
import { 
  Key, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Loader2, 
  ExternalLink,
  Cpu,
  Server,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { useRem } from '@/context/RemContext';
import { AiProvider } from '@/types';

export const AiSettingsPanel: React.FC = () => {
  const { aiConfig, saveAiConfig } = useRem();

  const [provider, setProvider] = useState<AiProvider>(aiConfig.provider || 'gemini');
  const [model, setModel] = useState<string>(aiConfig.model || 'gemini-1.5-flash');
  const [apiKey, setApiKey] = useState<string>(aiConfig.apiKey || '');
  const [baseUrl, setBaseUrl] = useState<string>(aiConfig.baseUrl || '');
  const [showKey, setShowKey] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Model options per provider
  const modelPresets: Record<AiProvider, Array<{ id: string; name: string; badge?: string }>> = {
    gemini: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', badge: 'Recommended • Fast & Free' },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'Latest • Next-Gen Speed' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', badge: 'Deep Reasoning' },
    ],
    openai: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'Recommended • Fast & Affordable' },
      { id: 'gpt-4o', name: 'GPT-4o', badge: 'Flagship Intelligence' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', badge: 'Legacy' },
    ],
    anthropic: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', badge: 'Recommended' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', badge: 'Ultra-Fast' },
    ],
    custom: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', badge: 'Fast Open Source' },
      { id: 'custom-input', name: 'Custom Model Name', badge: 'Enter Below' },
    ],
    builtin: [
      { id: 'builtin-nlp', name: 'Recallio Built-in NLP', badge: 'Offline • Zero Setup' },
    ],
  };

  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider);
    const defaultModel = modelPresets[newProvider][0]?.id || '';
    setModel(defaultModel);
    setTestResult(null);

    // If switching to custom, default Groq url as helpful suggestion
    if (newProvider === 'custom' && !baseUrl) {
      setBaseUrl('https://api.groq.com/openai/v1');
    }
  };

  const handleSave = async () => {
    await saveAiConfig({
      provider,
      model,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'test',
          config: {
            provider,
            model,
            apiKey: apiKey.trim(),
            baseUrl: baseUrl.trim(),
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult({
          success: true,
          message: data.message || `Successfully connected to ${model}!`,
        });
        // Auto-save on successful test
        await saveAiConfig({
          provider,
          model,
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim(),
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed. Please check your API key.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while testing connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Informational Banner */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 space-y-1">
        <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>Bring Your Own Key (BYOK) & Privacy</span>
        </div>
        <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
          Your API keys are stored securely on your device and are never saved on external servers. A standardized master system prompt in the backend ensures any model you choose immediately understands Recallio&apos;s flashcard and outliner syntax!
        </p>
      </div>

      {/* Provider Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          AI Provider:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleProviderChange('gemini')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              provider === 'gemini'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Google Gemini</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Free tier • High speed</div>
          </button>

          <button
            type="button"
            onClick={() => handleProviderChange('openai')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              provider === 'openai'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              <span>OpenAI</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">GPT-4o & GPT-4o-mini</div>
          </button>

          <button
            type="button"
            onClick={() => handleProviderChange('anthropic')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              provider === 'anthropic'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-500" />
              <span>Anthropic Claude</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Claude 3.5 Sonnet</div>
          </button>

          <button
            type="button"
            onClick={() => handleProviderChange('custom')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              provider === 'custom'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-amber-500" />
              <span>Groq / Ollama / Local</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Custom endpoint</div>
          </button>

          <button
            type="button"
            onClick={() => handleProviderChange('builtin')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              provider === 'builtin'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>Built-in Engine</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">No key needed • Offline</div>
          </button>
        </div>
      </div>

      {/* Model Selection */}
      {provider !== 'builtin' && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
            <span>Model Selection:</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {modelPresets[provider]?.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setModel(preset.id)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  model === preset.id
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                }`}
              >
                <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                  {preset.name}
                </div>
                {preset.badge && (
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                    {preset.badge}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Model input if custom provider */}
          {provider === 'custom' && (
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-medium text-zinc-500">
                Custom Model Identifier:
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. llama-3.3-70b-versatile or mistral-large"
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Custom Base URL (for Groq / Ollama / Local) */}
      {provider === 'custom' && (
        <div className="space-y-1">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            OpenAI-Compatible Base URL:
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.groq.com/openai/v1 or http://localhost:11434/v1"
            className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:border-blue-500"
          />
          <div className="text-[10px] text-zinc-400">
            Supports Groq, OpenRouter, Together AI, Perplexity, and local Ollama / LM Studio.
          </div>
        </div>
      )}

      {/* API Key Input */}
      {provider !== 'builtin' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>{provider.toUpperCase()} API Key / Token:</span>
            </label>
            {provider === 'gemini' && (
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-500 hover:underline flex items-center gap-1"
              >
                <span>Get free Gemini key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {provider === 'openai' && (
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-500 hover:underline flex items-center gap-1"
              >
                <span>Get OpenAI key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {provider === 'anthropic' && (
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-500 hover:underline flex items-center gap-1"
              >
                <span>Get Anthropic key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder={
                provider === 'gemini'
                  ? 'AIzaSy...'
                  : provider === 'openai'
                  ? 'sk-...'
                  : provider === 'anthropic'
                  ? 'sk-ant-...'
                  : 'gsk_... or api key'
              }
              className="w-full pr-10 pl-3 py-2 text-xs font-mono rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Test Connection & Action Buttons */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={isTesting}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-500" />}
          <span>Test Connection</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
          <span>{savedSuccess ? 'Settings Saved!' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Test Result Feedback */}
      {testResult && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          {testResult.success ? (
            <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}
    </div>
  );
};
