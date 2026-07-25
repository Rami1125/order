import React, { useState, useEffect } from 'react';
import { Customer, LogisticsProduct, LogisticsRule } from '../types';
import { getNoaSystemPrompt } from '../lib/systemPrompt';
import { Code, Sparkles, Save, RefreshCw, Copy, Check, RotateCcw, AlertCircle, ShieldCheck, Cpu } from 'lucide-react';

interface SystemPromptEditorProps {
  activeCustomer: Customer;
  products: LogisticsProduct[];
  rules: LogisticsRule[];
}

export const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({
  activeCustomer,
  products,
  rules,
}) => {
  const generatedPrompt = getNoaSystemPrompt(activeCustomer, products, rules);

  const [promptText, setPromptText] = useState<string>(generatedPrompt);
  const [isCustomActive, setIsCustomActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch current server status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/system-prompt').catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (data.success && data.isCustomized && data.prompt) {
            setIsCustomActive(true);
            setPromptText(data.prompt);
          } else {
            setIsCustomActive(false);
            setPromptText(generatedPrompt);
          }
        }
      } catch {
        // Fallback
      }
    };
    fetchStatus();
  }, [activeCustomer.id, products.length, rules.length]);

  // Regenerate Auto Prompt
  const handleRegenerateAutoPrompt = () => {
    const autoP = getNoaSystemPrompt(activeCustomer, products, rules);
    setPromptText(autoP);
    setStatusMsg('הפרומפט חולל מחדש בהצלחה לפי המילון והחוקים הפעילים!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  // Save Custom Prompt to Server
  const handleSavePrompt = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await res.json();
      if (data.success) {
        setIsCustomActive(true);
        setStatusMsg('ה-System Prompt עודכן ונשמר בהצלחה! נועה AI תשתמש בהנחיות אלו בכל השיחות.');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch {
      alert('שגיאה בשמירת הפרומפט בשרת');
    } finally {
      setLoading(false);
    }
  };

  // Reset to Auto Default
  const handleResetDefault = async () => {
    if (!confirm('האם לאפס את הפרומפט בחזרה לברירת המחדל האוטומטית שנוצרת מחוקי המערכת?')) return;

    setLoading(true);
    try {
      await fetch('/api/system-prompt', {
        method: 'DELETE',
      });

      const autoP = getNoaSystemPrompt(activeCustomer, products, rules);
      setPromptText(autoP);
      setIsCustomActive(false);
      setStatusMsg('הפרומפט אופס בהצלחה לברירת המחדל האוטומטית.');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch {
      alert('שגיאה באיפוס הפרומפט');
    } finally {
      setLoading(false);
    }
  };

  // Copy to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-white text-lg">
                עורך ה-System Prompt הקשיח של נועה AI (Gemini 3.6 Flash)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ערוך ושמור הנחיות קשיחות, חוקי התנהגות, תבניות HTML והנחיות ניסוח עבור מנוע ה-AI
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${
                isCustomActive
                  ? 'bg-amber-950 text-amber-300 border-amber-700/80 animate-pulse'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              {isCustomActive ? 'סטטוס: Prompt מותאם אישית פעיל בשרת' : 'סטטוס: Prompt אוטומטי מסונכרן'}
            </span>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs font-bold">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSavePrompt}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>שמור System Prompt פעיל</span>
            </button>

            <button
              onClick={handleRegenerateAutoPrompt}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>חולל אוטומטית לפי מילון וחוקים</span>
            </button>

            {isCustomActive && (
              <button
                onClick={handleResetDefault}
                disabled={loading}
                className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>אפס לברירת מחדל</span>
              </button>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'הועתק לקליפבורד!' : 'העתק Prompt'}</span>
          </button>
        </div>

        {statusMsg && (
          <div className="bg-emerald-900/80 text-emerald-100 border border-emerald-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Main Code Editor Block */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono px-1">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            systemInstruction (Gemini 3.6 Flash)
          </span>
          <span>תווים: {promptText.length.toLocaleString()}</span>
        </div>

        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={22}
          className="w-full bg-slate-900 text-emerald-300 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-hidden focus:border-amber-500/80 leading-relaxed dir-rtl whitespace-pre-wrap selection:bg-amber-500 selection:text-slate-950"
          placeholder="הכנס או ערוך את הנחיות ה-System Prompt כאן..."
        />
      </div>

      {/* Informational Guidance */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <span>כיצד פועל ה-System Prompt במערכת נועה AI?</span>
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-600">
          <li>
            ה-System Prompt מוזרק לכל קריאת API של Gemini 3.6 Flash בעת שיחה עם לקוחות.
          </li>
          <li>
            כאשר אתה שומר Prompt מותאם אישית, המערכת תשתמש בדיוק בטקסט שערכת.
          </li>
          <li>
            בלחיצה על "חולל אוטומטית לפי מילון וחוקים", המערכת תבנה מחדש את הטקסט העדכני כולל כל המוצרים והחוקים הפעילים הנוכחיים במערכת.
          </li>
        </ul>
      </div>
    </div>
  );
};
