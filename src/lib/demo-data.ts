import { StudySet, Question, QuestionProgress } from './types';
import { generateId } from './parser';

export const DEMO_SET_ID = 'demo-business-intelligence';

export const DEMO_QUESTIONS: Omit<Question, 'id'>[] = [
  // --- BATCH 1 (Questions 1 - 10) ---
  {
    questionNumber: 1,
    questionText: 'What are the typical responsibilities of a business intelligence analyst? Select all that apply.',
    questionType: 'multiple',
    choices: [
      { id: 'c1-1', label: 'A', text: 'Evaluate and streamline devices, infrastructures, and information channels.', isCorrect: false },
      { id: 'c1-2', label: 'B', text: 'Gather requirements from stakeholders, partners, and team members.', isCorrect: true },
      { id: 'c1-3', label: 'C', text: 'Retrieve, organize, and interpret an organization\'s data.', isCorrect: true },
      { id: 'c1-4', label: 'D', text: 'Create visualizations, dashboards, and reports.', isCorrect: true }
    ],
    explanation: 'Correct Answers: B, C, D. BI analysts focus on requirements gathering, data analysis, and report generation, whereas engineers evaluate hardware and infrastructures.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 2,
    questionText: 'Fill in the blank: To enable different computer programs to communicate with one another, companies can use an application programming _____. This is a set of functions and procedures that integrate diverse systems.',
    questionType: 'fill',
    choices: [],
    explanation: 'Correct Answer: Interface (or API). Application Programming Interfaces enable communication between disparate software systems.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 3,
    questionText: 'Which stakeholders do business intelligence professionals collaborate with in order to maximize available data and data tools?',
    questionType: 'single',
    choices: [
      { id: 'c3-1', label: 'A', text: 'Information technology professionals', isCorrect: true },
      { id: 'c3-2', label: 'B', text: 'Data warehousing specialists', isCorrect: false },
      { id: 'c3-3', label: 'C', text: 'Data analysts', isCorrect: false },
      { id: 'c3-4', label: 'D', text: 'Data governance professionals', isCorrect: false }
    ],
    explanation: 'Correct Answer: A. Information technology (IT) professionals ensure hardware, software, and permissions are correctly aligned.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 4,
    questionText: 'A business intelligence professional is considering how effectively their team is able to use the data available to them in order to extract actionable insights. What BI concept is the focus of this situation?',
    questionType: 'single',
    choices: [
      { id: 'c4-1', label: 'A', text: 'Data structure', isCorrect: false },
      { id: 'c4-2', label: 'B', text: 'Data governance', isCorrect: false },
      { id: 'c4-3', label: 'C', text: 'Data analysis', isCorrect: false },
      { id: 'c4-4', label: 'D', text: 'Data maturity', isCorrect: true }
    ],
    explanation: 'Correct Answer: D. Data maturity describes how effectively an organization utilizes its data assets to drive decision-making.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 5,
    questionText: 'In business intelligence, which stage might involve querying a database to return a financial dataset or accessing a spreadsheet of marketing campaign data?',
    questionType: 'single',
    choices: [
      { id: 'c5-1', label: 'A', text: 'Analyze', isCorrect: false },
      { id: 'c5-2', label: 'B', text: 'Capture', isCorrect: true },
      { id: 'c5-3', label: 'C', text: 'Share', isCorrect: false },
      { id: 'c5-4', label: 'D', text: 'Monitor', isCorrect: false }
    ],
    explanation: 'Correct Answer: B. The Capture stage involves gathering raw inputs from databases, files, and external systems.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 6,
    questionText: 'In what ways might data analysis be used in order to help business intelligence professionals provide data-driven insights? Select all that apply.',
    questionType: 'multiple',
    choices: [
      { id: 'c6-1', label: 'A', text: 'Automating processes and information channels', isCorrect: false },
      { id: 'c6-2', label: 'B', text: 'Exploring why things happened', isCorrect: true },
      { id: 'c6-3', label: 'C', text: 'Understanding relationships between data points', isCorrect: true },
      { id: 'c6-4', label: 'D', text: 'Examining data more in-depth', isCorrect: true }
    ],
    explanation: 'Correct Answers: B, C, D. Data analysis helps answer questions about reasons, correlations, and depth, while engineering deals with automation.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 7,
    questionText: 'What concept involves managing the people, processes, and tools used in the business intelligence process?',
    questionType: 'single',
    choices: [
      { id: 'c7-1', label: 'A', text: 'Business intelligence strategy', isCorrect: true },
      { id: 'c7-2', label: 'B', text: 'Business intelligence governance', isCorrect: false },
      { id: 'c7-3', label: 'C', text: 'Data maturity', isCorrect: false },
      { id: 'c7-4', label: 'D', text: 'Data governance', isCorrect: false }
    ],
    explanation: 'Correct Answer: A. Business intelligence strategy coordinates the organizational elements, technologies, and rules to maximize data value.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 8,
    questionText: 'A data pipeline is a series of processes that transports data from different sources to a new destination. What happens to the data at this destination?',
    questionType: 'single',
    choices: [
      { id: 'c8-1', label: 'A', text: 'Archival or destruction', isCorrect: false },
      { id: 'c8-2', label: 'B', text: 'Storage and analysis', isCorrect: true },
      { id: 'c8-3', label: 'C', text: 'Graphical representation', isCorrect: false },
      { id: 'c8-4', label: 'D', text: 'Live monitoring', isCorrect: false }
    ],
    explanation: 'Correct Answer: B. The destination of a data pipeline (e.g. data warehouse) is designated for structured storage and analytical processing.',
    topic: 'ETL',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 9,
    questionText: 'A business intelligence professional wants to improve a procedure in order to achieve better outcomes. To do this, they repeat the procedure over and over until they get closer to the desired results. What business intelligence concept does this situation describe?',
    questionType: 'single',
    choices: [
      { id: 'c9-1', label: 'A', text: 'Monitoring', isCorrect: false },
      { id: 'c9-2', label: 'B', text: 'Flow', isCorrect: false },
      { id: 'c9-3', label: 'C', text: 'Iteration', isCorrect: true },
      { id: 'c9-4', label: 'D', text: 'Transformation', isCorrect: false }
    ],
    explanation: 'Correct Answer: C. Iteration is the cycle of testing, reviewing, and refining a model or process to achieve optimized results.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 10,
    questionText: 'What is data science?',
    questionType: 'single',
    choices: [
      { id: 'c10-1', label: 'A', text: 'The collection, transformation, and organization of data in order to draw conclusions and drive informed decision-making', isCorrect: false },
      { id: 'c10-2', label: 'B', text: 'A field of study that uses data to create new ways of modeling and understanding the unknown', isCorrect: true },
      { id: 'c10-3', label: 'C', text: 'A tool for organizing data elements and how they relate to one another', isCorrect: false },
      { id: 'c10-4', label: 'D', text: 'A process used to solve complex problems in a user-centric way', isCorrect: false }
    ],
    explanation: 'Correct Answer: B. Data science is exploratory and focuses on creating new models to understand unknowns, whereas data analytics draws specific business conclusions.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },

  // --- BATCH 2 (Questions 11 - 20) ---
  {
    questionNumber: 11,
    questionText: 'What is the key difference between qualitative and quantitative data?',
    questionType: 'single',
    choices: [
      { id: 'c11-1', label: 'A', text: 'Qualitative data describes qualities and characteristics; quantitative data measures numerical facts.', isCorrect: true },
      { id: 'c11-2', label: 'B', text: 'Qualitative data is subjective; quantitative data is specific.', isCorrect: false },
      { id: 'c11-3', label: 'C', text: 'Qualitative data is about quality; quantitative data is about inventory.', isCorrect: false },
      { id: 'c11-4', label: 'D', text: 'Qualitative data measures numeric items; quantitative data measures characteristics.', isCorrect: false }
    ],
    explanation: 'Correct Answer: A. Qualitative data measures traits (colors, opinions, categories), while quantitative data measures absolute quantities (counts, dollar amounts).',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 12,
    questionText: 'Which of the following statements accurately describe wide and long data? Select all that apply.',
    questionType: 'multiple',
    choices: [
      { id: 'c12-1', label: 'A', text: 'Wide data subjects can have data in multiple columns.', isCorrect: true },
      { id: 'c12-2', label: 'B', text: 'Long data subjects can have multiple rows that hold the values of subject attributes.', isCorrect: true },
      { id: 'c12-3', label: 'C', text: 'Long data subjects can have data in multiple columns.', isCorrect: false },
      { id: 'c12-4', label: 'D', text: 'Wide data subjects can have multiple rows that hold the values of subject attributes.', isCorrect: false }
    ],
    explanation: 'Correct Answers: A, B. Wide data uses column fields for multiple variable values; long data uses multiple key-value rows per subject.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 13,
    questionText: 'Structured data is likely to be found in which of the following formats? Select all that apply.',
    questionType: 'multiple',
    choices: [
      { id: 'c13-1', label: 'A', text: 'Digital photo', isCorrect: false },
      { id: 'c13-2', label: 'B', text: 'Audio file', isCorrect: false },
      { id: 'c13-3', label: 'C', text: 'Database table', isCorrect: true },
      { id: 'c13-4', label: 'D', text: 'Spreadsheet', isCorrect: true }
    ],
    explanation: 'Correct Answers: C, D. Databases and spreadsheets store highly structured tabular data, while photos and audio are unstructured.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 14,
    questionText: 'Fill in the blank: A Boolean data type can have _____ possible values.',
    questionType: 'fill',
    choices: [],
    explanation: 'Correct Answer: Two (or 2). A Boolean expression is binary and must be either True or False.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 15,
    questionText: 'What is the term for the individuals who have invested time and resources in a project and are interested in its outcome?',
    questionType: 'single',
    choices: [
      { id: 'c15-1', label: 'A', text: 'Subject-matter experts', isCorrect: false },
      { id: 'c15-2', label: 'B', text: 'Executives', isCorrect: false },
      { id: 'c15-3', label: 'C', text: 'Project sponsors', isCorrect: false },
      { id: 'c15-4', label: 'D', text: 'Stakeholders', isCorrect: true }
    ],
    explanation: 'Correct Answer: D. Stakeholders include anyone impacted by or investing in the deliverables of a project.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 16,
    questionText: 'When collecting data for a study, what are some reasons to consider sample size? Select all that apply.',
    questionType: 'multiple',
    choices: [
      { id: 'c16-1', label: 'A', text: 'To include as many participants as possible in the study', isCorrect: false },
      { id: 'c16-2', label: 'B', text: 'To eliminate certain segments of a population', isCorrect: false },
      { id: 'c16-3', label: 'C', text: 'To make sure a few unusual responses don\'t skew results', isCorrect: true },
      { id: 'c16-4', label: 'D', text: 'To collect data that represents a diverse set of perspectives', isCorrect: true }
    ],
    explanation: 'Correct Answers: C, D. Robust sample sizes reduce outlier influence and capture a statistically sound distribution of views.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 17,
    questionText: 'The SMART methodology can be used to ask a question that promotes change. What type of SMART question leads to change?',
    questionType: 'single',
    choices: [
      { id: 'c17-1', label: 'A', text: 'Action-oriented', isCorrect: true },
      { id: 'c17-2', label: 'B', text: 'Results-focused', isCorrect: false },
      { id: 'c17-3', label: 'C', text: 'Transformational', isCorrect: false },
      { id: 'c17-4', label: 'D', text: 'Motivational', isCorrect: false }
    ],
    explanation: 'Correct Answer: A. Action-oriented questions focus on "how" and drive direct actionable modifications.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 18,
    questionText: 'Which of the following inquiries are leading questions? Select all that apply.',
    questionType: 'multiple',
    choices: [
      { id: 'c18-1', label: 'A', text: 'How did you learn about our company?', isCorrect: false },
      { id: 'c18-2', label: 'B', text: 'How satisfied were you with our customer representative?', isCorrect: true },
      { id: 'c18-3', label: 'C', text: 'In what ways did our product meet your needs?', isCorrect: true },
      { id: 'c18-4', label: 'D', text: 'What do you enjoy most about our service?', isCorrect: true }
    ],
    explanation: 'Correct Answers: B, C, D. Leading questions nudge respondents toward a positive rating instead of keeping open neutrality.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 19,
    questionText: 'Which of the following data security tools can be used to ensure only specific people can access, edit, and download a spreadsheet? Select all that apply.',
    questionType: 'multiple',
    choices: [
      { id: 'c19-1', label: 'A', text: 'Filters', isCorrect: false },
      { id: 'c19-2', label: 'B', text: 'Tabs', isCorrect: false },
      { id: 'c19-3', label: 'C', text: 'Sharing permissions', isCorrect: true },
      { id: 'c19-4', label: 'D', text: 'Encryption', isCorrect: true }
    ],
    explanation: 'Correct Answers: C, D. Access controls and encryption lock files securely, while filters and tabs are purely UI adjustments.',
    topic: 'Data Governance',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 20,
    questionText: 'Which type of bias is the tendency to construe ambiguous situations in a positive or negative way?',
    questionType: 'single',
    choices: [
      { id: 'c20-1', label: 'A', text: 'Confirmation bias', isCorrect: false },
      { id: 'c20-2', label: 'B', text: 'Cultural bias', isCorrect: false },
      { id: 'c20-3', label: 'C', text: 'Interpretation bias', isCorrect: true },
      { id: 'c20-4', label: 'D', text: 'Observer bias', isCorrect: false }
    ],
    explanation: 'Correct Answer: C. Interpretation bias is color-coding neutral data into a preconceived positive/negative view.',
    topic: 'Business Intelligence Fundamentals',
    confidence: 100,
    warnings: []
  },

  // --- BATCH 3 (Questions 21 - 30) ---
  {
    questionNumber: 21,
    questionText: 'Before completing a survey, an individual acknowledges reading information about how and why the data they provide will be used. What concept does this describe?',
    questionType: 'single',
    choices: [
      { id: 'c21-1', label: 'A', text: 'Transaction transparency', isCorrect: false },
      { id: 'c21-2', label: 'B', text: 'Openness', isCorrect: false },
      { id: 'c21-3', label: 'C', text: 'Consent', isCorrect: true },
      { id: 'c21-4', label: 'D', text: 'Privacy', isCorrect: false }
    ],
    explanation: 'Correct Answer: C. Consent is the explicit, informed agreement to provide information under set terms.',
    topic: 'Data Governance',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 22,
    questionText: 'A data analyst commits a SQL query to a repository as a new and improved query. Then, they specify the modifications they made during data cleaning and why they were made. What process does this scenario describe?',
    questionType: 'single',
    choices: [
      { id: 'c22-1', label: 'A', text: 'Data reporting', isCorrect: false },
      { id: 'c22-2', label: 'B', text: 'Data transferal', isCorrect: false },
      { id: 'c22-3', label: 'C', text: 'Creating a changelog', isCorrect: true },
      { id: 'c22-4', label: 'D', text: 'Sharing results', isCorrect: false }
    ],
    explanation: 'Correct Answer: C. A changelog captures detailed histories of code edits, rationales, and developers.',
    topic: 'Data Governance',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 23,
    questionText: 'Fill in the blank: To remove leading, trailing, and repeated spaces when cleaning data, use the _____ function.',
    questionType: 'fill',
    choices: [],
    explanation: 'Correct Answer: TRIM. The TRIM function cleans up irregular spacing inside textual data rows.',
    topic: 'Data Governance',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 24,
    questionText: 'Which spreadsheet tool changes how cells appear when values meet a specific condition?',
    questionType: 'single',
    choices: [
      { id: 'c24-1', label: 'A', text: 'Protected ranges', isCorrect: false },
      { id: 'c24-2', label: 'B', text: 'Alternating colors', isCorrect: false },
      { id: 'c24-3', label: 'C', text: 'Conditional formatting', isCorrect: true },
      { id: 'c24-4', label: 'D', text: 'Data validation', isCorrect: false }
    ],
    explanation: 'Correct Answer: C. Conditional formatting updates backgrounds/fonts based on formula triggers.',
    topic: 'Dashboards',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 25,
    questionText: 'Fill in the blank: In a spreadsheet, the SPLIT function divides a text string around a _____ and puts each fragment into a new, separate cell.',
    questionType: 'fill',
    choices: [],
    explanation: 'Correct Answer: Delimiter. The split utility breaks text strings around a delimiter character (e.g. comma).',
    topic: 'Data Governance',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 26,
    questionText: 'The date and time a photo was taken is an example of which kind of metadata?',
    questionType: 'single',
    choices: [
      { id: 'c26-1', label: 'A', text: 'Structural', isCorrect: false },
      { id: 'c26-2', label: 'B', text: 'Administrative', isCorrect: true },
      { id: 'c26-3', label: 'C', text: 'Representative', isCorrect: false },
      { id: 'c26-4', label: 'D', text: 'Descriptive', isCorrect: false }
    ],
    explanation: 'Correct Answer: B. Administrative metadata tracks creation dates, permissions, and file types.',
    topic: 'Data Governance',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 27,
    questionText: 'In spreadsheets, an absolute reference is used to lock a function array so that rows and columns don\'t change if the function is copied. What symbol is used to create an absolute reference?',
    questionType: 'single',
    choices: [
      { id: 'c27-1', label: 'A', text: 'Asterisk (*)', isCorrect: false },
      { id: 'c27-2', label: 'B', text: 'Ampersand (&)', isCorrect: false },
      { id: 'c27-3', label: 'C', text: 'Hash (#)', isCorrect: false },
      { id: 'c27-4', label: 'D', text: 'Dollar sign ($)', isCorrect: true }
    ],
    explanation: 'Correct Answer: D. The dollar sign ($) locks cells (e.g. $A$1) to static locations when dragging.',
    topic: 'Data Governance',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 28,
    questionText: 'Which spreadsheet function vertically searches for a certain value in a column in order to return a corresponding piece of information?',
    questionType: 'single',
    choices: [
      { id: 'c28-1', label: 'A', text: 'VALIDATE', isCorrect: false },
      { id: 'c28-2', label: 'B', text: 'VLOOKUP', isCorrect: true },
      { id: 'c28-3', label: 'C', text: 'VALUE', isCorrect: false },
      { id: 'c28-4', label: 'D', text: 'VIEW', isCorrect: false }
    ],
    explanation: 'Correct Answer: B. VLOOKUP searches vertically in the leftmost column of a range and retrieves cells in matching rows.',
    topic: 'Data Governance',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 29,
    questionText: 'When creating a SQL query, which JOIN clause returns all matching records in two or more database tables?',
    questionType: 'single',
    choices: [
      { id: 'c29-1', label: 'A', text: 'INNER', isCorrect: true },
      { id: 'c29-2', label: 'B', text: 'LEFT', isCorrect: false },
      { id: 'c29-3', label: 'C', text: 'RIGHT', isCorrect: false },
      { id: 'c29-4', label: 'D', text: 'OUTER', isCorrect: false }
    ],
    explanation: 'Correct Answer: A. INNER JOIN filters rows to keep only records that meet joining criteria in both tables.',
    topic: 'SQL',
    confidence: 100,
    warnings: []
  },
  {
    questionNumber: 30,
    questionText: 'In a SQL query, which calculation does the modulo (%) operator perform?',
    questionType: 'single',
    choices: [
      { id: 'c30-1', label: 'A', text: 'It finds the square root of a number.', isCorrect: false },
      { id: 'c30-2', label: 'B', text: 'It applies an exponent to a value.', isCorrect: false },
      { id: 'c30-3', label: 'C', text: 'It returns the remainder of a division calculation.', isCorrect: true },
      { id: 'c30-4', label: 'D', text: 'It converts a decimal to a percent.', isCorrect: false }
    ],
    explanation: 'Correct Answer: C. Modulo divides two integers and returns only the integer remainder.',
    topic: 'SQL',
    confidence: 100,
    warnings: []
  }
];

// Returns pre-configured progress data to demonstrate mastery levels and gates
export function getDemoProgress(questions: Question[]): { [qId: string]: QuestionProgress } {
  const progress: { [qId: string]: QuestionProgress } = {};
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const longAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

  questions.forEach((q) => {
    if (q.questionNumber <= 10) {
      // --- Batch 1 Mastered (Mastery Score 4) ---
      // These are mastered, but let's make Question 1 overdue for review to demonstrate spaced repetition backlog
      const isOverdue = q.questionNumber === 1;
      progress[q.id] = {
        userId: 'local-user',
        questionId: q.id,
        state: isOverdue ? 'REVIEW_DUE' : 'MASTERED',
        masteryScore: 4,
        correctCount: 4,
        incorrectCount: 0,
        correctStreak: 4,
        averageResponseTime: 2300,
        lastAttemptAt: isOverdue ? longAgo : yesterday,
        lastCorrectAt: isOverdue ? longAgo : yesterday,
        lastReviewedAt: isOverdue ? longAgo : yesterday,
        // Make nextReviewAt in the past for Question 1 so it's due
        nextReviewAt: isOverdue 
          ? new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() 
          : new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        reviewInterval: isOverdue ? 3 : 7,
        easeFactor: 2.6,
        incorrectCountStreak: 0,
        responseTimeHistory: [2100, 2500, 2300],
        confidenceHistory: ['confident', 'confident', 'confident']
      };
    } else if (q.questionNumber <= 20) {
      // --- Batch 2 Unlocked but Incomplete ---
      // This batch is currently active. Some mastered, some learning, some weak.
      if (q.questionNumber === 11 || q.questionNumber === 12) {
        // Mastered
        progress[q.id] = {
          userId: 'local-user',
          questionId: q.id,
          state: 'MASTERED',
          masteryScore: 4,
          correctCount: 3,
          incorrectCount: 0,
          correctStreak: 3,
          averageResponseTime: 3100,
          lastAttemptAt: yesterday,
          lastCorrectAt: yesterday,
          lastReviewedAt: yesterday,
          nextReviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          reviewInterval: 3,
          easeFactor: 2.5,
          incorrectCountStreak: 0,
          responseTimeHistory: [3500, 3100, 2700],
          confidenceHistory: ['unsure', 'confident', 'confident']
        };
      } else if (q.questionNumber === 13 || q.questionNumber === 14) {
        // Familiar / Learning
        progress[q.id] = {
          userId: 'local-user',
          questionId: q.id,
          state: 'LEARNING',
          masteryScore: 2,
          correctCount: 1,
          incorrectCount: 1,
          correctStreak: 1,
          averageResponseTime: 5400,
          lastAttemptAt: yesterday,
          lastCorrectAt: yesterday,
          lastReviewedAt: yesterday,
          nextReviewAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          reviewInterval: 1,
          easeFactor: 2.3,
          incorrectCountStreak: 0,
          responseTimeHistory: [8200, 5400],
          confidenceHistory: ['guessed', 'unsure']
        };
      } else if (q.questionNumber === 15) {
        // Weak Question (Mastery score 1, high mistakes, misconception)
        progress[q.id] = {
          userId: 'local-user',
          questionId: q.id,
          state: 'WEAK',
          masteryScore: 1,
          correctCount: 0,
          incorrectCount: 3,
          correctStreak: 0,
          averageResponseTime: 7100,
          lastAttemptAt: yesterday,
          lastCorrectAt: undefined,
          lastReviewedAt: undefined,
          nextReviewAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // overdue review for weak
          reviewInterval: 0.5,
          easeFactor: 1.9,
          incorrectCountStreak: 3,
          responseTimeHistory: [6800, 7400, 7100],
          confidenceHistory: ['confident', 'unsure', 'confident'] // answered confidently wrong
        };
      } else {
        // Unseen/New in active batch
        progress[q.id] = {
          userId: 'local-user',
          questionId: q.id,
          state: 'NEW',
          masteryScore: 0,
          correctCount: 0,
          incorrectCount: 0,
          correctStreak: 0,
          averageResponseTime: 0,
          reviewInterval: 0,
          easeFactor: 2.5,
          incorrectCountStreak: 0,
          responseTimeHistory: [],
          confidenceHistory: []
        };
      }
    } else {
      // --- Batch 3 Locked (Questions 21 - 30) ---
      // These are locked because Batch 2 is not fully mastered yet!
      progress[q.id] = {
        userId: 'local-user',
        questionId: q.id,
        state: 'NEW',
        masteryScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        correctStreak: 0,
        averageResponseTime: 0,
        reviewInterval: 0,
        easeFactor: 2.5,
        incorrectCountStreak: 0,
        responseTimeHistory: [],
        confidenceHistory: []
      };
    }
  });

  return progress;
}

export function buildDemoStudySet(): StudySet {
  const questions: Question[] = DEMO_QUESTIONS.map((q, idx) => ({
    ...q,
    id: `demo-q-${idx + 1}`
  }));

  return {
    id: DEMO_SET_ID,
    title: 'ITB302c – Business Intelligence (Demo Set)',
    description: 'A realistic set of 30 questions covering Business Intelligence analyst responsibilities, ETL, data schemas, data warehousing, and dashboards.',
    createdAt: new Date().toISOString(),
    questions
  };
}
