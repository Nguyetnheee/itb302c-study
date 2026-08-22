import React, { useState } from 'react';
import { 
  Upload, FileText, Check, AlertCircle, Trash2, Edit2, AlertTriangle, 
  Settings2, Copy, Search, Eye, Filter, ArrowRight, HelpCircle
} from 'lucide-react';
import { Question, Choice, QuestionType, StudySet } from '../lib/types';
import { parseQuestionBank, detectDuplicates, DuplicateMatch } from '../lib/parser';

interface ImportWorkflowProps {
  onImportComplete: (set: StudySet) => void;
  onCancel: () => void;
}

export default function ImportWorkflow({ onImportComplete, onCancel }: ImportWorkflowProps) {
  const [inputText, setInputText] = useState('');
  const [stage, setStage] = useState<'upload' | 'analyzing' | 'preview'>('upload');
  const [analysisStep, setAnalysisStep] = useState(0); // 0 = Extract, 1 = Segment, 2 = Duplicate, 3 = Validate
  
  // Parsed results
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  
  // UI states
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

  // Analysis steps simulation
  const analysisSteps = [
    'Extracting raw text documents...',
    'Segmenting questions and answer choices...',
    'Running duplicate similarity checks...',
    'Validating key mappings and options...'
  ];

  const handleTextPaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setStage('analyzing');
    setAnalysisStep(0);

    // Simulate pipeline analysis
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < 4) {
        setAnalysisStep(step);
      } else {
        clearInterval(interval);
        runParsingPipeline();
      }
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStage('analyzing');
    setAnalysisStep(0);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);

      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step < 4) {
          setAnalysisStep(step);
        } else {
          clearInterval(interval);
          runParsingPipeline(file.name.replace(/\.[^/.]+$/, ""));
        }
      }, 600);
    };
    reader.readAsText(file);
  };

  const runParsingPipeline = (fallbackTitle = '') => {
    const result = parseQuestionBank(inputText);
    const dupes = detectDuplicates(result.questions);
    
    setQuestions(result.questions);
    setDuplicates(dupes);
    setTitle(fallbackTitle || 'My New Study Set');
    setDescription('Imported question bank.');
    setStage('preview');
  };

  // Question editing handlers
  const handleEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
  };

  const handleSaveQuestion = (updatedQ: Question) => {
    setQuestions(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
    setEditingQuestionId(null);
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Delete this question from the set?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      setDuplicates(prev => prev.filter(d => d.questionA !== id && d.questionB !== id));
    }
  };

  // Duplicate actions
  const handleKeepBoth = (index: number) => {
    setDuplicates(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveDuplicate = (targetQuestionText: string, index: number) => {
    setQuestions(prev => prev.filter(q => q.questionText !== targetQuestionText));
    setDuplicates(prev => prev.filter((_, idx) => idx !== index));
  };

  // Build Study Set object
  const handleCommitImport = () => {
    if (!title.trim()) {
      alert('Please provide a Study Set Title.');
      return;
    }
    if (questions.length === 0) {
      alert('Cannot import an empty study set.');
      return;
    }

    // Standardize question numbers after cleaning/deleting
    const finalizedQuestions = questions.map((q, idx) => ({
      ...q,
      questionNumber: idx + 1
    }));

    onImportComplete({
      id: Math.random().toString(36).substring(2, 9),
      title,
      description,
      createdAt: new Date().toISOString(),
      questions: finalizedQuestions
    });
  };

  // Counts
  const singleCount = questions.filter(q => q.questionType === 'single').length;
  const multipleCount = questions.filter(q => q.questionType === 'multiple').length;
  const fillCount = questions.filter(q => q.questionType === 'fill' || q.questionType === 'short').length;
  const booleanCount = questions.filter(q => q.questionType === 'boolean').length;
  const warnCount = questions.filter(q => q.warnings.length > 0).length;

  const filteredQuestions = questions.filter(q => {
    if (filterType === 'single' && q.questionType !== 'single') return false;
    if (filterType === 'multiple' && q.questionType !== 'multiple') return false;
    if (filterType === 'fill' && q.questionType !== 'fill' && q.questionType !== 'short') return false;
    if (filterType === 'warn' && q.warnings.length === 0) return false;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return q.questionText.toLowerCase().includes(query) || 
             q.choices.some(c => c.text.toLowerCase().includes(query));
    }
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. UPLOAD ZONE */}
      {stage === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '1.8rem' }}>Upload Question Bank</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Paste raw quiz texts, Quizlet exports, or upload CSV files containing question/answer formats.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* File Drag and Drop */}
            <div 
              className="card flex-center" 
              style={{ 
                flexDirection: 'column', 
                borderStyle: 'dashed', 
                borderWidth: '2px', 
                padding: '3rem 2rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input 
                type="file" 
                id="file-upload-input" 
                accept=".txt,.csv" 
                style={{ display: 'none' }} 
                onChange={handleFileUpload}
              />
              <Upload size={40} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Select text or CSV files</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Supports standard formats (.txt, .csv)
              </p>
            </div>

            {/* Direct Paste Form */}
            <form onSubmit={handleTextPaste} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea 
                className="input" 
                placeholder="Paste question bank text here..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ height: '180px', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={!inputText.trim()}>
                  Analyze & Parse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ANALYZING PROGRESS LOADER */}
      {stage === 'analyzing' && (
        <div 
          className="card flex-center" 
          style={{ 
            flexDirection: 'column', 
            padding: '5rem 2rem', 
            textAlign: 'center',
            background: 'var(--bg-card)'
          }}
        >
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--color-accent)', animation: 'spin 1s linear infinite', marginBottom: '2rem' }} />
          <h2 style={{ fontFamily: 'var(--font-header)', fontSize: '1.6rem', fontWeight: 800 }}>
            Analyzing question bank...
          </h2>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '400px' }}>
            {analysisSteps.map((step, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  fontSize: '0.9rem',
                  color: idx === analysisStep ? 'var(--text-primary)' : idx < analysisStep ? 'var(--color-success)' : 'var(--text-tertiary)',
                  fontWeight: idx === analysisStep ? '600' : '400',
                  textAlign: 'left'
                }}
              >
                {idx < analysisStep ? (
                  <Check size={16} color="var(--color-success)" />
                ) : (
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border-color)', display: 'inline-flex' }} />
                )}
                <span>{step}</span>
              </div>
            ))}
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* 3. IMPORT PREVIEW SCREEN */}
      {stage === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Header Metadata Inputs */}
          <div className="card flex-between" style={{ padding: '1.5rem 2rem', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Study Set Title</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. ITB302c – Business Intelligence" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>
            <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Description</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Brief summary of the study set..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
          </div>

          {/* GRID BREAKDOWN PANEL */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-header)', fontSize: '1.2rem', marginBottom: '1rem' }}>Import Preview Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent)' }}>{questions.length}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Questions</div>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{singleCount}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Single Choice</div>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{multipleCount}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Multiple Select</div>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{fillCount}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fill/Short Answer</div>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-warning)' }}>{warnCount}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Needs Review</div>
              </div>
              <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-error)' }}>{duplicates.length}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Duplicates Found</div>
              </div>
            </div>
          </div>

          {/* DUPLICATE ALERTS LIST */}
          {duplicates.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--color-warning)', background: 'rgba(245, 158, 11, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)' }}>
                <AlertTriangle size={18} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Duplicate Questions Detected</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {duplicates.map((dupe, index) => (
                  <div key={index} className="card" style={{ padding: '1rem', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ color: 'var(--color-error)' }}>[A]</strong> {dupe.questionA}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--color-success)' }}>[B]</strong> {dupe.questionB}
                        </div>
                        <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          Similarity: {dupe.similarity}%
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px' }}>
                        <button className="btn btn-secondary" onClick={() => handleKeepBoth(index)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                          Keep Both
                        </button>
                        <button className="btn btn-danger" onClick={() => handleRemoveDuplicate(dupe.questionB, index)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                          Remove [B]
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAIN EDITABLE GRID AND LIST */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            
            {/* Search/Filter navigation */}
            <div className="flex-between" style={{ gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterType('all')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  All ({questions.length})
                </button>
                <button className={`btn ${filterType === 'single' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterType('single')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  Single Choice ({singleCount})
                </button>
                <button className={`btn ${filterType === 'multiple' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterType('multiple')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  Multiple Select ({multipleCount})
                </button>
                <button className={`btn ${filterType === 'fill' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterType('fill')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  Fill/Short ({fillCount})
                </button>
                <button className={`btn ${filterType === 'warn' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterType('warn')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  Needs Review ({warnCount})
                </button>
              </div>

              <div style={{ position: 'relative', width: '260px' }}>
                <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Search questions..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2rem' }}
                />
              </div>
            </div>

            {/* Questions preview grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredQuestions.map((q, qIndex) => {
                const isEditing = editingQuestionId === q.id;

                if (isEditing) {
                  return (
                    <QuestionEditor 
                      key={q.id} 
                      question={q} 
                      onSave={handleSaveQuestion} 
                      onCancel={() => setEditingQuestionId(null)} 
                    />
                  );
                }

                return (
                  <div 
                    key={q.id} 
                    className="card" 
                    style={{ 
                      borderColor: q.warnings.length > 0 ? 'var(--color-warning)' : 'var(--border-color)',
                      background: q.warnings.length > 0 ? 'rgba(245, 158, 11, 0.01)' : 'var(--bg-card)'
                    }}
                  >
                    <div className="flex-between" style={{ alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>Q{q.questionNumber}</span>
                          <span className={`badge ${
                            q.questionType === 'single' ? 'badge-learning' :
                            q.questionType === 'multiple' ? 'badge-review' :
                            q.questionType === 'boolean' ? 'badge-familiar' : 'badge-new'
                          }`}>
                            {q.questionType === 'single' ? 'Single Choice' :
                             q.questionType === 'multiple' ? 'Multiple Select' :
                             q.questionType === 'boolean' ? 'True/False' : 'Fill In Blank'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Topic: {q.topic}</span>
                        </div>
                        
                        <h4 style={{ fontSize: '1.05rem', margin: '0.5rem 0', fontWeight: '600' }}>{q.questionText}</h4>

                        {/* Options preview */}
                        {q.choices.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', paddingLeft: '0.5rem' }}>
                            {q.choices.map((c) => (
                              <div key={c.id} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <span style={{ 
                                  fontWeight: '700', 
                                  color: c.isCorrect ? 'var(--color-success)' : 'var(--text-secondary)'
                                }}>{c.label}.</span>
                                <span style={{ color: c.isCorrect ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{c.text}</span>
                                {c.isCorrect && <Check size={14} color="var(--color-success)" style={{ alignSelf: 'center' }} />}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', background: 'var(--bg-app)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                          <strong>Answer Context:</strong> {q.explanation}
                        </div>

                        {/* Parsing warnings list */}
                        {q.warnings.map((warn, wIdx) => (
                          <div key={wIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-warning)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            <AlertCircle size={12} />
                            <span>{warn}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => handleEditQuestion(q)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleDeleteQuestion(q.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--color-error)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex-between" style={{ marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={onCancel}>
              Discard Import
            </button>
            <button className="btn btn-primary" onClick={handleCommitImport} style={{ padding: '0.75rem 2.5rem' }}>
              Import Study Set ({questions.length} Questions)
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

// INLINE EDITOR COMPONENT FOR A SINGLE QUESTION
interface QuestionEditorProps {
  question: Question;
  onSave: (q: Question) => void;
  onCancel: () => void;
}

function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [text, setText] = useState(question.questionText);
  const [type, setType] = useState<QuestionType>(question.questionType);
  const [choices, setChoices] = useState<Choice[]>(question.choices);
  const [explanation, setExplanation] = useState(question.explanation);
  const [topic, setTopic] = useState(question.topic);

  const handleChoiceTextChange = (id: string, newText: string) => {
    setChoices(prev => prev.map(c => c.id === id ? { ...c, text: newText } : c));
  };

  const handleCorrectChoiceChange = (id: string) => {
    if (type === 'single' || type === 'boolean') {
      setChoices(prev => prev.map(c => ({ ...c, isCorrect: c.id === id })));
    } else {
      setChoices(prev => prev.map(c => c.id === id ? { ...c, isCorrect: !c.isCorrect } : c));
    }
  };

  const handleAddChoice = () => {
    const nextLabel = String.fromCharCode(65 + choices.length); // A, B, C, D...
    setChoices(prev => [...prev, { id: Math.random().toString(), label: nextLabel, text: '', isCorrect: false }]);
  };

  const handleRemoveChoice = (id: string) => {
    setChoices(prev => prev.filter(c => c.id !== id).map((c, idx) => ({
      ...c,
      label: String.fromCharCode(65 + idx)
    })));
  };

  const handleSave = () => {
    onSave({
      ...question,
      questionText: text,
      questionType: type,
      choices,
      explanation,
      topic,
      warnings: [] // Clean warnings upon manual edits
    });
  };

  return (
    <div className="card" style={{ borderColor: 'var(--color-accent)', background: 'rgba(79, 70, 229, 0.01)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h4 style={{ fontWeight: '700' }}>Edit Question {question.questionNumber}</h4>

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Question Text</label>
            <textarea 
              className="input" 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              style={{ height: '80px', marginTop: '0.25rem', resize: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Question Type</label>
              <select 
                className="input" 
                value={type} 
                onChange={(e) => setType(e.target.value as QuestionType)}
                style={{ marginTop: '0.25rem' }}
              >
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Select</option>
                <option value="fill">Fill in the Blank</option>
                <option value="boolean">True/False</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Topic Label</label>
              <input 
                type="text" 
                className="input" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              />
            </div>
          </div>
        </div>

        {/* Choices Editor */}
        {(type === 'single' || type === 'multiple' || type === 'boolean') && (
          <div>
            <div className="flex-between">
              <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Choices</label>
              {type !== 'boolean' && (
                <button className="btn btn-secondary" onClick={handleAddChoice} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                  + Add Choice
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {choices.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input 
                    type={type === 'multiple' ? 'checkbox' : 'radio'} 
                    checked={c.isCorrect} 
                    onChange={() => handleCorrectChoiceChange(c.id)}
                    name="correct-choice-radio"
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '700', width: '15px' }}>{c.label}</span>
                  <input 
                    type="text" 
                    className="input" 
                    value={c.text} 
                    onChange={(e) => handleChoiceTextChange(c.id, e.target.value)} 
                    style={{ flex: 1, padding: '0.4rem 0.75rem' }}
                  />
                  {type !== 'boolean' && (
                    <button className="btn btn-secondary" onClick={() => handleRemoveChoice(c.id)} style={{ padding: '0.4rem', color: 'var(--color-error)' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Explanation & Correct Answers</label>
          <input 
            type="text" 
            className="input" 
            value={explanation} 
            onChange={(e) => setExplanation(e.target.value)} 
            style={{ marginTop: '0.25rem' }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ padding: '0.5rem 1rem' }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: '0.5rem 1.5rem' }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
