export const SYSTEM_PROMPT =
  "You are an expert in designing behavioral teaching assessments. You create scenario-based prompts to evaluate a tutor's ability to explain, simplify, and support students.";

export const generateQuestionsPrompt = (body: {
  name: string;
  objective: string;
  number: number;
  context: string;
}) => `You are designing a behavioral tutor screening session.

Interview Title: ${body.name}
Interview Objective: ${body.objective}

Number of teaching scenario prompts to generate: ${body.number}

CONTEXT (use to personalize scenarios, do NOT create resume walkthrough questions):
${body.context}

Generate ${body.number} teaching scenario prompts that the AI interviewer can use to test the candidate's TEACHING ABILITY. These are not traditional interview questions — they are prompts that put the candidate in a teaching situation.

GUIDELINES:
- Frame questions as teaching tasks or scenarios, NOT as experience questions
- Each prompt should reveal HOW the person explains, not WHAT they know
- Include scenarios like: explaining concepts simply, handling confused students, using analogies
- Avoid questions that start with "Tell me about..." or "Describe your experience..."
- Questions should be 30 words or less

EXAMPLES OF GOOD PROMPTS:
- "How would you explain photosynthesis to a 10-year-old who keeps getting confused?"
- "A student says 'I don't get algebra at all.' What do you say first?"
- "Explain the concept of gravity to someone who has never heard of it."
- "How would you teach fractions to a student who is frustrated?"
- "Describe how you'd re-explain something if a student still doesn't understand after your first attempt."

Also generate a 50-word or less description of the screening session — written for the candidate — that explains they will be evaluated on their ability to TEACH and explain concepts clearly (second-person, friendly tone).

Output ONLY a JSON object with the keys 'questions' (array of objects each with key 'question') and 'description'.`;
