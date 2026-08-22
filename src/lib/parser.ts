import { Question, Choice, QuestionType } from './types';

// Helper to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Calculate similarity between two strings (Normalized Levenshtein Distance)
export function getSimilarity(s1: string, s2: string): number {
  const clean1 = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = s2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (clean1 === clean2) return 1.0;
  if (!clean1 || !clean2) return 0.0;

  const track = Array(clean2.length + 1).fill(null).map(() =>
    Array(clean1.length + 1).fill(null)
  );

  for (let i = 0; i <= clean1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= clean2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= clean2.length; j += 1) {
    for (let i = 1; i <= clean1.length; i += 1) {
      const indicator = clean1[i - 1] === clean2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[clean2.length][clean1.length];
  const maxLength = Math.max(clean1.length, clean2.length);
  return 1.0 - distance / maxLength;
}

// Detect duplicate questions in a list
export interface DuplicateMatch {
  indexA: number;
  indexB: number;
  questionA: string;
  questionB: string;
  similarity: number;
}

export function detectDuplicates(questions: Question[], threshold = 0.85): DuplicateMatch[] {
  const duplicates: DuplicateMatch[] = [];
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const sim = getSimilarity(questions[i].questionText, questions[j].questionText);
      if (sim >= threshold) {
        duplicates.push({
          indexA: i,
          indexB: j,
          questionA: questions[i].questionText,
          questionB: questions[j].questionText,
          similarity: Math.round(sim * 100)
        });
      }
    }
  }
  return duplicates;
}

// Clean OCR artifact texts
export function cleanOCRText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    // Remove page footer pagination e.g., "1 / 80" or "12 / 80" or "80 / 80" at start/end of lines
    .replace(/^\s*\d+\s*[\/|]\s*\d+\s*$/gm, '')
    // Remove Quizlet header branding if present
    .replace(/ITB302c - Coursera/gi, '')
    .replace(/Học trực tuyến tại https:\/\/quizlet\.com\/_\w+/gi, '')
    // Clean broken hyphenated line wraps e.g. "infor mation" or "stakehold ers"
    .trim();
}

// Main parsing function
export function parseQuestionBank(rawText: string): { questions: Question[]; warningsCount: number; uncertainCount: number } {
  const cleaned = cleanOCRText(rawText);
  
  const blocks: string[] = [];
  const lines = cleaned.split('\n');
  let currentBlock: string[] = [];
  
  const questionNumberRegex = /^\s*(\d+)(?:\s*[\.\-\s]\s*\d+)?[\.\s]+(.*)/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const isNewQuestion = questionNumberRegex.test(line);
    
    if (isNewQuestion && currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
      currentBlock = [];
    }
    currentBlock.push(line);
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  const parsedQuestions: Question[] = [];
  let warningsCount = 0;
  let uncertainCount = 0;

  blocks.forEach((block, index) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let questionNumber = index + 1;
    const questionTextLines: string[] = [];
    const choiceLines: string[] = [];
    let answerText = '';
    
    const firstLineMatch = lines[0].match(questionNumberRegex);
    let startLineIndex = 0;
    if (firstLineMatch) {
      questionNumber = parseInt(firstLineMatch[1], 10);
      questionTextLines.push(firstLineMatch[2]);
      startLineIndex = 1;
    }

    let parsingChoices = false;
    let parsedAnswerIndex = -1;

    for (let i = startLineIndex; i < lines.length; i++) {
      const line = lines[i];
      const choiceMatch = line.match(/^\s*([A-F])[\.\)]\s*(.*)/i);
      
      if (choiceMatch) {
        parsingChoices = true;
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1 && colonIndex > 2) {
          const choiceText = line.substring(0, colonIndex).replace(/^\s*[A-F][\.\)]\s*/i, '').trim();
          const potentialAnswer = line.substring(colonIndex + 1).trim();
          
          choiceLines.push(`${line.match(/^\s*([A-F])/i)?.[1]}. ${choiceText}`);
          answerText = potentialAnswer;
          parsedAnswerIndex = i;
          break;
        } else {
          choiceLines.push(line);
        }
      } else {
        if (parsingChoices) {
          if (parsedAnswerIndex !== -1 || answerText) {
            answerText += '\n' + line;
          } else {
            if (choiceLines.length > 0) {
              choiceLines[choiceLines.length - 1] += ' ' + line;
            }
          }
        } else {
          questionTextLines.push(line);
        }
      }
    }

    if (parsedAnswerIndex !== -1 && parsedAnswerIndex + 1 < lines.length) {
      for (let j = parsedAnswerIndex + 1; j < lines.length; j++) {
        answerText += '\n' + lines[j];
      }
    }

    const questionText = questionTextLines.join(' ').trim();
    const choices: Choice[] = [];
    const warnings: string[] = [];
    let confidence = 100;

    choiceLines.forEach((choiceLine) => {
      const match = choiceLine.match(/^\s*([A-F])[\.\)]\s*(.*)/i);
      if (match) {
        choices.push({
          id: generateId(),
          label: match[1].toUpperCase(),
          text: match[2].trim(),
          isCorrect: false
        });
      }
    });

    let questionType: QuestionType = 'single';
    const lowerText = questionText.toLowerCase();
    
    const isMultipleSelectIndicator = 
      lowerText.includes('select all that apply') || 
      lowerText.includes('choose all correct') || 
      lowerText.includes('choose all that apply') ||
      lowerText.includes('multiple answers') ||
      lowerText.includes('which of the following statements accurately describe') ||
      lowerText.includes('what are the main benefits') ||
      lowerText.includes('what are some typical') ||
      lowerText.includes('what goals do developers use') ||
      lowerText.includes('which of the following are appropriate') ||
      lowerText.includes('what are some of the primary responsibilities') ||
      lowerText.includes('what events might occur');

    const isFillIn = lowerText.includes('fill in the blank') || questionText.includes('_____') || questionText.includes('____');
    const isTrueFalse = choices.length === 2 && 
      ((choices[0].text.toLowerCase() === 'true' && choices[1].text.toLowerCase() === 'false') ||
       (choices[0].text.toLowerCase() === 'yes' && choices[1].text.toLowerCase() === 'no'));

    if (isTrueFalse) {
      questionType = 'boolean';
    } else if (isFillIn && choices.length === 0) {
      questionType = 'fill';
    } else if (choices.length === 0) {
      questionType = 'short';
    } else if (isMultipleSelectIndicator) {
      questionType = 'multiple';
    }

    let correctCount = 0;
    if (choices.length > 0) {
      if (answerText) {
        choices.forEach((choice) => {
          const labelRegex = new RegExp(`(?:^|\\b|\\s|:)${choice.label}(?:\\b|\\s|\\.|,|:|$)`);
          const labelMatches = labelRegex.test(answerText);
          const textMatches = answerText.toLowerCase().includes(choice.text.toLowerCase()) && choice.text.length > 3;

          if (labelMatches || textMatches) {
            choice.isCorrect = true;
            correctCount++;
          }
        });

        if (correctCount === 0 && answerText.trim().length === 1) {
          const potentialLabel = answerText.trim().toUpperCase();
          const targetChoice = choices.find(c => c.label === potentialLabel);
          if (targetChoice) {
            targetChoice.isCorrect = true;
            correctCount = 1;
          }
        }
      }

      if (correctCount === 0) {
        choices[0].isCorrect = true;
        warnings.push('Could not confidently detect the correct answer. Defaulted to Choice A.');
        confidence -= 30;
        uncertainCount++;
      } else if (correctCount > 1 && questionType === 'single') {
        questionType = 'multiple';
      }
    } else {
      if (!answerText) {
        const lastLine = lines[lines.length - 1];
        if (lastLine.toLowerCase().startsWith('answer:') || lastLine.toLowerCase().startsWith('correct answer:')) {
          answerText = lastLine.replace(/^(answer|correct answer):/i, '').trim();
        } else {
          answerText = lastLine;
          warnings.push('Could not find explicit Answer label. Used the last line of the block.');
          confidence -= 20;
          uncertainCount++;
        }
      }
    }

    if (questionText.length < 10) {
      warnings.push('Question text is unusually short.');
      confidence -= 10;
    }
    if (choices.length === 0 && questionType !== 'fill' && questionType !== 'short') {
      warnings.push('No choices detected for choice-type question.');
      confidence -= 20;
      uncertainCount++;
    }

    if (warnings.length > 0) {
      warningsCount++;
    }

    let topic = 'General';
    const topicsMap: { [key: string]: string[] } = {
      'SQL': ['sql', 'query', 'join', 'select', 'database table', 'inner join', 'outer join'],
      'ETL': ['etl', 'pipeline', 'extract', 'transform', 'load', 'data warehouse', 'data lake'],
      'Dashboards': ['dashboard', 'visualization', 'mockup', 'chart', 'pie chart', 'line chart', 'bar chart', 'tableau'],
      'Data Governance': ['governance', 'security', 'privacy', 'integrity', 'metadata', 'permission', 'conformity', 'compliance'],
      'Business Intelligence Fundamentals': ['business intelligence', 'bi analyst', 'data maturity', 'strategy', 'metrics', 'kpi', 'stakeholder']
    };

    for (const [topicName, keywords] of Object.entries(topicsMap)) {
      if (keywords.some(keyword => lowerText.includes(keyword) || (choices.some(c => c.text.toLowerCase().includes(keyword))))) {
        topic = topicName;
        break;
      }
    }

    parsedQuestions.push({
      id: generateId(),
      questionNumber,
      questionText,
      questionType,
      choices,
      explanation: answerText ? `Correct Answer Context: ${answerText}` : 'No explanation provided in the source.',
      topic,
      confidence: Math.max(0, confidence),
      warnings
    });
  });

  return {
    questions: parsedQuestions,
    warningsCount,
    uncertainCount
  };
}
