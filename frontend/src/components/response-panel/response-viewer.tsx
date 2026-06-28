'use client';

import React, { useState } from 'react';
import { Tab } from '@/store/useWorkspaceStore';
import { Play, Copy, Check, Info, ShieldAlert, Award } from 'lucide-react';
import { toast } from 'sonner';

interface ResponseViewerProps {
  tab: Tab;
  isSending: boolean;
}

export default function ResponseViewer({ tab, isSending }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty');
  const [copied, setCopied] = useState(false);

  const response = tab.response;

  // Handle Clipboard Copy
  const handleCopy = () => {
    if (!response?.body) return;
    navigator.clipboard.writeText(response.body);
    setCopied(true);
    toast.success('Response body copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-pm-get bg-pm-get/10 border-pm-get/25';
    if (status >= 300 && status < 400) return 'text-pm-post bg-pm-post/10 border-pm-post/25';
    if (status >= 400) return 'text-pm-delete bg-pm-delete/10 border-pm-delete/25';
    return 'text-pm-text-secondary bg-pm-bg-tertiary border-pm-border';
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPrettyBody = (bodyText: string) => {
    if (!bodyText) return '';
    try {
      const parsed = JSON.parse(bodyText);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return bodyText;
    }
  };

  // 1. Loading State
  if (isSending) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-pm-bg-primary/20 select-none animate-pulse p-6">
        <div className="flex items-center space-x-2 text-xs text-pm-text-secondary">
          <div className="w-4 h-4 border-2 border-t-transparent border-pm-orange rounded-full animate-spin" />
          <span>Sending request to server...</span>
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (!response) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-pm-bg-primary text-center p-6 select-none border-t border-pm-border/30">
        <div className="w-12 h-12 bg-pm-bg-secondary border border-pm-border rounded-xl flex items-center justify-center text-pm-text-muted mb-3">
          <Play className="w-5 h-5 fill-current opacity-40" />
        </div>
        <h3 className="font-semibold text-xs text-pm-text-secondary">
          No Response Yet
        </h3>
        <p className="text-[11px] text-pm-text-muted mt-0.5">
          Enter a URL and click Send to receive the response.
        </p>
      </div>
    );
  }

  // 3. Error State (outbound client exception)
  if (response.error) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-pm-bg-primary border-t border-pm-border">
        {/* Error Info Header */}
        <div className="h-10 border-b border-pm-border/60 bg-pm-bg-secondary/40 px-4 flex items-center justify-between text-xs text-pm-delete shrink-0 select-none font-bold">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-pm-delete" />
            <span>Could not execute request</span>
          </div>
          <span className="text-[10px] text-pm-text-secondary bg-pm-bg-tertiary px-2 py-0.5 rounded border border-pm-border">
            Status: {response.status}
          </span>
        </div>

        {/* Error Panel Content */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs select-all text-pm-delete/90 bg-pm-delete/5">
          <div className="border-l-4 border-pm-delete pl-4 py-1.5 space-y-1">
            <div className="font-bold">Error Detail:</div>
            <div className="whitespace-pre-wrap leading-relaxed">{response.error}</div>
          </div>
          <div className="mt-4 text-[10px] text-pm-text-secondary font-sans leading-relaxed">
            💡 Common reasons for connection failures:
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li>URL does not exist or has a typo.</li>
              <li>Target API server is down or running locally on a different port.</li>
              <li>Network timeouts or DNS lookup failures.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const prettyBody = getPrettyBody(response.body);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-pm-bg-primary h-full border-t border-pm-border select-none">
      {/* Response Header Info bar */}
      <div className="h-12 border-b border-pm-border bg-pm-bg-secondary px-4 flex items-center justify-between shrink-0 select-none text-xs">
        {/* Left tabs: Body / Headers */}
        <div className="flex space-x-3 h-full items-center">
          <button
            onClick={() => setActiveTab('body')}
            className={`h-full px-2 border-b-2 transition cursor-pointer font-semibold ${
              activeTab === 'body'
                ? 'border-pm-orange text-pm-orange'
                : 'border-transparent text-pm-text-secondary hover:text-pm-text-primary'
            }`}
          >
            Response Body
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`h-full px-2 border-b-2 transition cursor-pointer font-semibold ${
              activeTab === 'headers'
                ? 'border-pm-orange text-pm-orange'
                : 'border-transparent text-pm-text-secondary hover:text-pm-text-primary'
            }`}
          >
            Headers ({response.headers?.length || 0})
          </button>
        </div>

        {/* Right metrics: Status, Time, Size */}
        <div className="flex items-center space-x-4 select-none font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="text-pm-text-muted">Status:</span>
            <span className={`px-2 py-0.5 border rounded-sm font-bold font-mono text-[11px] ${getStatusColor(response.status)}`}>
              {response.status} {response.status_text}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-pm-text-muted">Time:</span>
            <span className="text-pm-get font-bold font-mono">{response.time_ms} ms</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-pm-text-muted">Size:</span>
            <span className="text-pm-put font-bold font-mono">{formatSize(response.size_bytes)}</span>
          </div>
        </div>
      </div>

      {/* Main Response Viewer View */}
      <div className="flex-1 flex flex-col overflow-hidden bg-pm-bg-primary">
        {/* Render Body */}
        {activeTab === 'body' && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* View Controls bar */}
            <div className="h-9 px-4 border-b border-pm-border/40 bg-pm-bg-primary/20 flex items-center justify-between shrink-0 select-none text-[11px]">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('pretty')}
                  className={`px-2 py-1.5 rounded transition cursor-pointer ${
                    viewMode === 'pretty' ? 'bg-pm-bg-tertiary text-pm-orange font-bold' : 'text-pm-text-secondary hover:text-pm-text-primary'
                  }`}
                >
                  Pretty JSON
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-2 py-1.5 rounded transition cursor-pointer ${
                    viewMode === 'raw' ? 'bg-pm-bg-tertiary text-pm-orange font-bold' : 'text-pm-text-secondary hover:text-pm-text-primary'
                  }`}
                >
                  Raw Text
                </button>
              </div>

              {/* Copy Button */}
              {response.body && (
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 hover:bg-pm-bg-tertiary px-2 py-1 rounded transition text-pm-text-secondary hover:text-pm-text-primary cursor-pointer font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-pm-get" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {/* Pretty / Raw Display area */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs select-all text-pm-text-primary bg-[#030304]">
              {viewMode === 'pretty' ? (
                <pre className="whitespace-pre-wrap leading-relaxed font-mono">
                  {prettyBody}
                </pre>
              ) : (
                <pre className="whitespace-pre-wrap leading-relaxed font-mono break-all">
                  {response.body}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Render Headers list */}
        {activeTab === 'headers' && (
          <div className="flex-1 overflow-y-auto p-4 select-text">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-pm-border text-pm-text-secondary">
                  <th className="py-2 pr-4 font-bold w-1/3">Header Key</th>
                  <th className="py-2 pr-4 font-bold w-2/3">Value</th>
                </tr>
              </thead>
              <tbody>
                {response.headers?.map((header: any, index: number) => (
                  <tr key={index} className="border-b border-pm-border/50 hover:bg-pm-bg-tertiary/20">
                    <td className="py-2 pr-4 font-mono font-semibold text-pm-text-secondary truncate select-all">{header.key}</td>
                    <td className="py-2 pr-4 font-mono text-pm-text-primary select-all break-all">{header.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
