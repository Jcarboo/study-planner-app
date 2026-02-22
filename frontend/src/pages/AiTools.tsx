import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type FR = { type:'fr'; question:string; rubric:string; idealAnswer:string };
type MCQ = { type:'mcq'; question:string; choices:string[]; answerIndex:number; explanation?:string };
type Q = FR | MCQ;

type NoteMeta = {
  _id: string;
  title: string;
  created_at: string;
  chars: number;
};

const NOTES_LIMIT = 5;

export default function AiTools() {
  const [tab, setTab] = useState<'summarize'|'explain'|'quiz'>('summarize');

  // Saved notes
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');

  // Summarize
  const [summary, setSummary] = useState<any>(null);
  const [sumLoading, setSumLoading] = useState(false);

  // Explain
  const [topic, setTopic] = useState('');
  const [explain, setExplain] = useState<any>(null);
  const [expLoading, setExpLoading] = useState(false);

  // Quiz
  const [numMCQ, setNumMCQ] = useState(4);
  const [numFR, setNumFR] = useState(2);
  const [difficulty, setDifficulty] = useState('medium');
  const [quiz, setQuiz] = useState<{quizId:string; questions:Q[]}|null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<any>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const questions = quiz?.questions || [];

  const canUploadMore = notes.length < NOTES_LIMIT;

  const loadNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await axios.get<NoteMeta[]>('https://study-planner-app-123478359200.us-east4.run.app/ai/notes', { withCredentials: true });
      setNotes(res.data);
      // Preserve selection if still exists, else select latest if any
      if (res.data.length) {
        const stillThere = res.data.some(n => n._id === selectedNoteId);
        setSelectedNoteId(stillThere ? selectedNoteId : res.data[0]._id);
      } else {
        setSelectedNoteId(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => { loadNotes(); /* eslint-disable-next-line */ }, []);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    if (!canUploadMore) {
      alert(`You can only keep ${NOTES_LIMIT} notes. Delete one to add more.`);
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('note', e.target.files[0]);
      if (uploadTitle.trim()) form.append('title', uploadTitle.trim());
      await axios.post('https://study-planner-app-123478359200.us-east4.run.app/ai/notes/upload', form, { withCredentials: true });
      setUploadTitle('');
      await loadNotes();
      alert('Notes uploaded!');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUploadText = async () => {
    if (!uploadText.trim()) return;
    if (!canUploadMore) {
      alert(`You can only keep ${NOTES_LIMIT} notes. Delete a note to add a new one.`);
      return;
    }
    setUploading(true);
    try {
      await axios.post('https://study-planner-app-123478359200.us-east4.run.app/ai/notes/upload', {
        text: uploadText, title: uploadTitle || undefined
      }, { withCredentials: true });
      setUploadText('');
      setUploadTitle('');
      await loadNotes();
      alert('Notes saved!');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await axios.delete(`https://study-planner-app-123478359200.us-east4.run.app/ai/notes/${id}`, { withCredentials: true });
      await loadNotes();
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  const runSummarize = async () => {
    setSumLoading(true);
    setSummary(null);
    try {
      const res = await axios.post('https://study-planner-app-123478359200.us-east4.run.app/ai/notes/summarize', {
        noteId: selectedNoteId || undefined
      }, { withCredentials: true });
      setSummary(res.data);
    } catch (e) {
      console.error(e);
      alert('Summarize failed.');
    } finally {
      setSumLoading(false);
    }
  };

  const runExplain = async () => {
    if (!topic.trim()) return;
    setExpLoading(true);
    setExplain(null);
    try {
      const res = await axios.post('https://study-planner-app-123478359200.us-east4.run.app/ai/notes/explain', {
        topic, noteId: selectedNoteId || undefined
      }, { withCredentials: true });
      setExplain(res.data);
    } catch (e) {
      console.error(e);
      alert('Explain failed.');
    } finally {
      setExpLoading(false);
    }
  };

  const genQuiz = async () => {
    if (isGeneratingQuiz) return; // guard against double clicks
    setIsGeneratingQuiz(true);
    setQuiz(null);
    setGradeResult(null);
    setAnswers([]);
    try {
      const res = await axios.post('https://study-planner-app-123478359200.us-east4.run.app/ai/quiz/generate', {
        numMCQ, numFR, difficulty, noteId: selectedNoteId || undefined
      }, { withCredentials: true });
      setQuiz({ quizId: res.data.quizId, questions: res.data.questions });
      setAnswers(new Array(res.data.questions.length).fill(null));
    } catch (e) {
      console.error(e);
      alert('Quiz generation failed.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    setGrading(true);
    setGradeResult(null);
    try {
      const res = await axios.post('https://study-planner-app-123478359200.us-east4.run.app/ai/quiz/grade', {
        quizId: quiz.quizId, answers
      }, { withCredentials: true });
      setGradeResult(res.data);
    } catch (e) {
      console.error(e);
      alert('Grading failed.');
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen text-white font-body pt-20 px-6">
      {/* Background */}
      <img
        src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/12cbe8a4-f55c-4b40-85bb-d8e1405e7b84/dez5d9x-79cb89e0-a551-4731-82cd-399bbc6ea0c5.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzEyY2JlOGE0LWY1NWMtNGI0MC04NWJiLWQ4ZTE0MDVlN2I4NFwvZGV6NWQ5eC03OWNiODllMC1hNTUxLTQ3MzEtODJjZC0zOTliYmM2ZWEwYzUuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.F3BLEOSDxCVgRlKV6n0ureGuMiFeHbMtV5bN-SGVQRc"
        alt="bg"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />

      <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-pink-400 via-indigo-400 to-cyan-300 bg-clip-text drop-shadow-[0_0_0.3rem_#ff77e9] mb-6">
        ✨ AI Study Tools
      </h1>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {(['summarize','explain','quiz'] as const).map(t => (
          <button
            key={t}
            onClick={() => !isGeneratingQuiz && setTab(t)}
            className={
              "px-4 py-2 rounded-full border transition " +
              (tab===t
                ? "bg-pink-600 border-pink-400"
                : "bg-black/40 border-indigo-500/40 hover:bg-black/60") +
              (isGeneratingQuiz ? " opacity-60 cursor-not-allowed" : "")
            }
            disabled={isGeneratingQuiz}
            title={isGeneratingQuiz ? "Please wait for generation to finish" : undefined}
          >
            {t === 'summarize' ? 'Summarize' : t === 'explain' ? 'Explain' : 'Quiz'}
          </button>
        ))}
      </div>

      {/* Notes selector + uploader */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Saved Notes */}
        <div className="bg-[#140032]/70 border border-pink-500/40 rounded-2xl p-6 shadow-[0_0_24px_rgba(255,20,147,0.25)] backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-heading text-pink-300">Saved Notes</h2>
            <span className="text-sm text-white/70">{notes.length}/{NOTES_LIMIT}</span>
          </div>

          {loadingNotes ? (
            <p className="text-white/70">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-white/70">No notes saved yet.</p>
          ) : (
            <ul className="space-y-2">
              {notes.map(n => (
                <li key={n._id} className={`flex items-center gap-2 bg-black/40 border border-indigo-500/30 rounded px-3 py-2 ${selectedNoteId===n._id ? 'ring-1 ring-pink-500/50' : ''}`}>
                  <input
                    type="radio"
                    name="noteSelect"
                    checked={selectedNoteId === n._id}
                    onChange={() => setSelectedNoteId(n._id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{n.title}</div>
                    <div className="text-xs text-white/60">{new Date(n.created_at).toLocaleString()} • {n.chars} chars</div>
                  </div>
                  <button
                    onClick={() => deleteNote(n._id)}
                    className="text-sm text-red-400 hover:text-red-300"
                    title="Delete"
                    disabled={isGeneratingQuiz}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upload block */}
        <div className="lg:col-span-2 bg-[#140032]/70 border border-indigo-500/40 rounded-2xl p-6 shadow-[0_0_24px_rgba(99,102,241,0.3)] backdrop-blur">
          <h2 className="text-xl font-heading text-indigo-300 mb-3">Upload or paste notes</h2>
          {!canUploadMore && (
            <div className="mb-3 text-sm text-yellow-300">
              Note limit reached ({NOTES_LIMIT}). Delete a note to add a new one.
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-4 items-start">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Optional title"
                value={uploadTitle}
                onChange={(e)=>setUploadTitle(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-indigo-500/40 rounded"
                disabled={!canUploadMore || uploading || isGeneratingQuiz}
              />
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleUploadFile}
                className="text-sm"
                disabled={!canUploadMore || uploading || isGeneratingQuiz}
              />
            </div>
            <div className="md:col-span-2">
              <textarea
                value={uploadText}
                onChange={(e)=>setUploadText(e.target.value)}
                placeholder="Paste raw notes here…"
                className="w-full min-h-[120px] bg-black/50 border border-indigo-500/40 rounded p-3"
                disabled={!canUploadMore || uploading || isGeneratingQuiz}
              />
              <div className="mt-2">
                <button
                  onClick={handleUploadText}
                  disabled={!canUploadMore || uploading || !uploadText.trim() || isGeneratingQuiz}
                  className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/60 disabled:text-white/60"
                >
                  {uploading ? 'Saving…' : 'Save text'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panels */}
      {tab === 'summarize' && (
        <div className="bg-[#0b0018]/70 border border-indigo-500/40 rounded-2xl p-6 shadow-[0_0_24px_rgba(99,102,241,0.3)] backdrop-blur">
          <button onClick={runSummarize} disabled={sumLoading || isGeneratingQuiz}
            className="mb-4 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-full disabled:bg-pink-800/60 disabled:text-white/60">
            {sumLoading ? 'Summarizing…' : 'Summarize Selected / Latest'}
          </button>
          {summary && (
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-indigo-300 font-semibold mb-2">Key Points</h3>
                <ul className="list-disc list-inside space-y-1">
                  {(summary.keyPoints||[]).map((s:string,i:number)=><li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-indigo-300 font-semibold mb-2">Concepts</h3>
                <ul className="space-y-1">
                  {(summary.concepts||[]).map((c:any,i:number)=>(
                    <li key={i} className="bg-black/40 rounded px-2 py-1">
                      <span className="text-pink-300 font-semibold">{c.term}:</span> {c.explanation}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-indigo-300 font-semibold mb-2">Action Items</h3>
                <ul className="list-disc list-inside space-y-1">
                  {(summary.actionItems||[]).map((s:string,i:number)=><li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'explain' && (
        <div className="bg-[#0b0018]/70 border border-indigo-500/40 rounded-2xl p-6 shadow-[0_0_24px_rgba(99,102,241,0.3)] backdrop-blur">
          <div className="flex gap-2 mb-4">
            <input
              value={topic}
              onChange={(e)=>setTopic(e.target.value)}
              placeholder="e.g., Dijkstra’s algorithm"
              className="flex-1 px-3 py-2 bg-black/50 border border-indigo-500/40 rounded"
              disabled={isGeneratingQuiz}
            />
            <button onClick={runExplain} disabled={expLoading || isGeneratingQuiz}
              className="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800/60 disabled:text-white/60">
              {expLoading ? 'Explaining…' : 'Explain'}
            </button>
          </div>
          {explain && (
            <div className="space-y-3">
              <div><span className="text-pink-300 font-semibold">Explanation:</span> {explain.explanation}</div>
              {explain.analogy && <div><span className="text-pink-300 font-semibold">Analogy:</span> {explain.analogy}</div>}
              {Array.isArray(explain.steps) && (
                <div>
                  <span className="text-pink-300 font-semibold">Steps:</span>
                  <ul className="list-disc list-inside">
                    {explain.steps.map((s:string,i:number)=><li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'quiz' && (
        <div className="bg-[#0b0018]/70 border border-pink-500/40 rounded-2xl p-6 shadow-[0_0_24px_rgba(255,20,147,0.25)] backdrop-blur">
          {!quiz && (
            <>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <label className="flex items-center gap-2">MCQ:
                  <input type="number" min={0} max={10} value={numMCQ}
                    onChange={(e)=>setNumMCQ(Number(e.target.value))}
                    className="w-20 bg-black/50 border border-indigo-500/40 rounded px-2 py-1"/>
                </label>
                <label className="flex items-center gap-2">Free Response:
                  <input type="number" min={0} max={10} value={numFR}
                    onChange={(e)=>setNumFR(Number(e.target.value))}
                    className="w-20 bg-black/50 border border-indigo-500/40 rounded px-2 py-1"/>
                </label>
                <label className="flex items-center gap-2">Difficulty:
                  <select value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}
                    className="bg-black/50 border border-indigo-500/40 rounded px-2 py-1">
                    <option>easy</option><option>medium</option><option>hard</option>
                  </select>
                </label>
              </div>
              <button
                onClick={genQuiz}
                disabled={isGeneratingQuiz}
                className="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-800/60 disabled:text-white/60"
                title={isGeneratingQuiz ? 'Generating…' : undefined}
              >
                {isGeneratingQuiz ? 'Generating…' : 'Generate Quiz from Selected / Latest'}
              </button>
            </>
          )}

          {quiz && (
            <div className="space-y-5">
              {questions.map((q, i) => (
                <div key={i} className="bg-black/40 border border-indigo-500/30 rounded-xl p-4">
                  <div className="mb-2">
                    <span className="text-cyan-300 mr-2">Q{i+1}.</span> {q.question}
                  </div>
                  {'choices' in q ? (
                    <div className="space-y-1">
                      {q.choices.map((c, idx) => (
                        <label key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`q${i}`}
                            checked={answers[i] === idx}
                            onChange={()=> {
                              const next = [...answers]; next[i]=idx; setAnswers(next);
                            }}
                            disabled={isGeneratingQuiz}
                          />
                          <span>{c}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={answers[i] || ""}
                      onChange={(e)=>{
                        const next = [...answers]; next[i]=e.target.value; setAnswers(next);
                      }}
                      placeholder="Type your answer…"
                      className="w-full min-h-[90px] bg-black/60 border border-indigo-500/40 rounded p-2"
                      disabled={isGeneratingQuiz}
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-3">
                <button onClick={()=>{ setQuiz(null); setAnswers([]); setGradeResult(null); }}
                        className="px-4 py-2 rounded-full bg-black/50 border border-indigo-500/40">
                  Reset
                </button>
                <button onClick={submitQuiz} disabled={grading || isGeneratingQuiz}
                        className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/60 disabled:text-white/60">
                  {grading ? 'Grading…' : 'Submit for Grading'}
                </button>
              </div>

              {gradeResult && (
                <div className="mt-4 p-4 bg-[#120020]/70 border border-pink-500/40 rounded-xl">
                  <div className="text-lg mb-2">
                    Score: <span className="text-pink-300 font-semibold">{gradeResult.score}</span> / {gradeResult.total}
                  </div>
                  <div className="space-y-2">
                    {gradeResult.details.map((d:any, i:number) => (
                      <div key={i} className="bg-black/40 rounded p-3">
                        <div className="text-sm text-indigo-200 mb-1">{d.question}</div>
                        {d.type === 'mcq' ? (
                          <div className="text-sm">
                            <div>Your answer: {d.yourIndex !== null ? d.yourIndex : '—'}</div>
                            <div>Correct answer: {d.correctIndex}</div>
                            {d.explanation && <div className="text-white/80 mt-1">Why: {d.explanation}</div>}
                            <div className={d.correct ? 'text-green-400' : 'text-red-400'}>
                              {d.correct ? '✓ Correct' : '✗ Incorrect'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">
                            <div className="text-white/80">Feedback: {d.feedback}</div>
                            <div className={d.score ? 'text-green-400' : 'text-red-400'}>
                              {d.score ? '✓ Meets rubric' : '✗ Needs work'}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full-screen neon generating overlay */}
      {isGeneratingQuiz && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-md">
          <div className="relative w-72 h-72 grid place-items-center">
            {/* inner glow pulse */}
            <div
              className="w-40 h-40 rounded-full"
              style={{
                boxShadow: '0 0 50px rgba(255,0,204,0.35), 0 0 100px rgba(124,58,237,0.25)',
                background:
                  'radial-gradient(closest-side, rgba(255,0,204,.2), rgba(0,0,0,0))',
                animation: 'pulseGlow 1.6s ease-in-out infinite',
              }}
            />
            <div className="text-center px-6">
              <p className="text-lg font-semibold text-pink-300 drop-shadow-[0_0_0.4rem_#ff77e966]">
                Generating your quiz…
              </p>
              <p className="mt-2 text-sm text-indigo-200/80">
                Cooking questions, options & answers…
              </p>
            </div>
            {/* shimmer bar */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-56 h-2 rounded-full bg-white/10 overflow-hidden">
              <span
                className="absolute inset-y-0 w-24 rounded-full"
                style={{
                  background: 'linear-gradient(90deg,transparent,#22d3ee,transparent)',
                  filter: 'drop-shadow(0 0 8px #22d3ee)',
                  animation: 'shimmerX 2s linear infinite',
                }}
              />
            </div>
          </div>
          {/* keyframes inline (tailwind-free) */}
          <style>
            {`
              @keyframes pulseGlow { 0%,100%{transform:scale(.95)} 50%{transform:scale(1.05)} }
              @keyframes shimmerX { 0%{transform:translateX(-100%)} 100%{transform:translateX(230%)} }
            `}
          </style>
        </div>
      )}
    </div>
  );
}
