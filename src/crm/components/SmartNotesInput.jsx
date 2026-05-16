// src/crm/components/SmartNotesInput.jsx
// Intelligent notes input with auto-detection, suggestions, templates, and history insights
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { NOTE_TEMPLATES } from '@/crm/data/noteTemplates';
import { analyzeNote, analyzeNoteHistory, getSentimentEmoji, getSentimentColor } from '@/lib/noteAnalyzer';
import {
  Mic, MicOff, Sparkles, ChevronDown, ChevronUp, AlertTriangle,
  TrendingUp, Info, Calendar, Tag, Zap, MessageCircle
} from 'lucide-react';

const SmartNotesInput = ({
  value,
  onChange,
  onSuggestionAccept,
  existingNotes = '',
  placeholder = 'What did the lead say? Any remarks...',
  maxLength = 500,
  rows = 3,
  className = '',
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // Analyze current note text in real-time
  const analysis = useMemo(() => analyzeNote(value), [value]);

  // Analyze note history for patterns
  const historyAnalysis = useMemo(() => analyzeNoteHistory(existingNotes), [existingNotes]);

  const hasInsights = historyAnalysis.patterns.length > 0 || historyAnalysis.insights.length > 0;

  const handleTemplateSelect = useCallback((template) => {
    const timestamp = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
    const noteText = `[${timestamp}] ${template.text}`;
    onChange(noteText);

    // Pass auto-actions as suggestions
    if (template.autoActions && onSuggestionAccept) {
      onSuggestionAccept(template.autoActions);
    }

    setShowTemplates(false);
    textareaRef.current?.focus();
  }, [onChange, onSuggestionAccept]);

  const handleSuggestionClick = useCallback((suggestion) => {
    if (onSuggestionAccept) {
      if (suggestion.type === 'status') {
        onSuggestionAccept({ suggestStatus: suggestion.value });
      } else if (suggestion.type === 'follow_up_date') {
        onSuggestionAccept({ suggestFollowUp: suggestion.days, followUpDate: suggestion.value });
      } else if (suggestion.type === 'flag') {
        onSuggestionAccept({ flagForManager: true });
      }
    }
  }, [onSuggestionAccept]);

  // Voice-to-text using Web Speech API
  const toggleVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return; // Speech API not available
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (event.results[event.results.length - 1].isFinal) {
        onChange((value ? value + ' ' : '') + transcript.trim());
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, value, onChange]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const hasSpeechAPI = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Quick Templates */}
      <div>
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-[#0F3A5F] uppercase tracking-widest mb-1.5 active:opacity-70"
        >
          <Zap size={11} />
          Quick Templates
          {showTemplates ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {showTemplates && (
          <div className="grid grid-cols-2 gap-1.5 mb-3 max-h-48 overflow-y-auto">
            {NOTE_TEMPLATES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateSelect(t)}
                className="text-left px-2.5 py-2 rounded-xl border border-gray-100 bg-gray-50 text-xs font-medium text-gray-700 hover:bg-[#0F3A5F]/5 hover:border-[#0F3A5F]/20 active:scale-[0.98] transition-all touch-manipulation"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Textarea with voice button */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className="w-full border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-[#0F3A5F] pr-20"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {hasSpeechAPI && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-1.5 rounded-full transition-all touch-manipulation ${
                isListening
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          )}
          <span className="text-[10px] text-gray-400 pointer-events-none">
            {value?.length || 0}/{maxLength}
          </span>
        </div>
      </div>

      {/* Real-time analysis chips */}
      {value && value.length > 5 && (analysis.tags.length > 0 || analysis.sentiment !== 'neutral') && (
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Sentiment indicator */}
          {analysis.sentiment !== 'neutral' && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getSentimentColor(analysis.sentiment)}`}>
              {getSentimentEmoji(analysis.sentiment)} {analysis.sentiment}
            </span>
          )}

          {/* Detected tags */}
          {analysis.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
              <Tag size={9} /> {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* Smart suggestions */}
      {value && analysis.suggestions.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Sparkles size={10} /> Smart Suggestions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 active:scale-[0.97] transition-all touch-manipulation"
              >
                {s.type === 'status' && <Tag size={10} />}
                {s.type === 'follow_up_date' && <Calendar size={10} />}
                {s.type === 'flag' && <AlertTriangle size={10} />}
                {s.type === 'status' && `Set status: ${s.value}`}
                {s.type === 'follow_up_date' && `Follow-up in ${s.days}d`}
                {s.type === 'flag' && 'Flag for manager'}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-amber-600 mt-1">{analysis.suggestions[0]?.reason}</p>
        </div>
      )}

      {/* Detected actions */}
      {value && analysis.detectedActions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {analysis.detectedActions.map((action, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700">
              <MessageCircle size={9} /> Action: {action}
            </span>
          ))}
        </div>
      )}

      {/* Note History Insights */}
      {hasInsights && (
        <div>
          <button
            type="button"
            onClick={() => setShowInsights(!showInsights)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest active:opacity-70"
          >
            <TrendingUp size={11} />
            History Insights
            {showInsights ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {showInsights && (
            <div className="mt-1.5 space-y-1.5">
              {historyAnalysis.patterns.map((p, i) => (
                <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${
                  p.severity === 'high' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  <AlertTriangle size={11} />
                  "{p.label}" appeared {p.count} times
                </div>
              ))}
              {historyAnalysis.insights.map((ins, i) => (
                <div key={i} className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-[11px] ${
                  ins.type === 'warning' ? 'bg-red-50 text-red-700' :
                  ins.type === 'positive' ? 'bg-emerald-50 text-emerald-700' :
                  ins.type === 'flag' ? 'bg-amber-50 text-amber-700' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {ins.type === 'warning' ? <AlertTriangle size={11} className="shrink-0 mt-0.5" /> :
                   ins.type === 'positive' ? <TrendingUp size={11} className="shrink-0 mt-0.5" /> :
                   <Info size={11} className="shrink-0 mt-0.5" />}
                  {ins.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartNotesInput;
