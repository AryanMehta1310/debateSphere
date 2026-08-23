const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('[Gemini Client Init Error]:', err.message);
    return null;
  }
};

/**
 * Generate a random college-level debate topic using Gemini API
 * @returns {Promise<string>} Generated debate topic
 */
const generateDebateTopic = async () => {
  const aiClient = getGeminiClient();

  const fallbackTopics = [
    'Should artificial intelligence replace traditional college classrooms?',
    'Is social media more harmful than beneficial for university students?',
    'Should physical lecture attendance be compulsory for college students?',
    'Should government regulation be mandated for advanced AI models?',
    'Is remote work more productive than traditional office environments?'
  ];

  if (aiClient) {
    try {
      const prompt = `Generate a single compelling, controversial college-level debate topic. Return ONLY the debate topic as a single sentence without markdown or quotes. Example: "Should artificial intelligence replace traditional classrooms?"`;
      
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text ? response.text.trim() : '';
      let cleanTopic = responseText.replace(/^["']|["']$/g, '').trim();

      if (cleanTopic.length > 10) {
        return cleanTopic;
      }
    } catch (apiError) {
      console.warn('[Gemini Topic Generation Warning]:', apiError.message);
    }
  }

  // Return a random topic from fallbacks if API key is unconfigured or rate limited
  const randomIndex = Math.floor(Math.random() * fallbackTopics.length);
  return fallbackTopics[randomIndex];
};

/**
 * Generate AI analysis for a completed debate using Google Gemini API
 * @param {string} topic - Debate topic
 * @param {string} description - Debate description
 * @param {Array} argumentsList - Array of argument objects with content, votes, and user
 * @returns {Object} Structured analysis (summary, mainPoints, strengths, weaknesses, conclusion, generatedAt)
 */
const generateDebateAnalysis = async (topic, description, argumentsList) => {
  const aiClient = getGeminiClient();

  const formattedArgs = argumentsList
    .map((arg, idx) => `${idx + 1}. [User: ${arg.user?.name || 'Participant'}] "${arg.content}" (Votes: ${arg.votes})`)
    .join('\n');

  const prompt = `You are an AI debate analyst.

Analyze the following online debate.

Debate Topic: "${topic}"
Description: "${description}"

Submitted Arguments from Participants:
${formattedArgs}

Provide an objective analysis structured as valid JSON with the following keys:
- "summary": a brief 2-3 sentence overview of the debate.
- "mainPoints": an array of 2-4 key bullet points discussed.
- "strengths": an array of 2-3 strong arguments or well-supported points.
- "weaknesses": an array of 1-2 weak arguments or areas needing stronger evidence.
- "conclusion": a brief final concluding assessment.

Do not invent information that was not present in the debate.
Return strictly valid JSON without markdown wrapping.`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text ? response.text.trim() : '';

      let cleanText = responseText;
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
      }

      try {
        const parsedData = JSON.parse(cleanText);
        return {
          summary: parsedData.summary || 'Summary unavailable.',
          mainPoints: Array.isArray(parsedData.mainPoints) ? parsedData.mainPoints : [],
          strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths : [],
          weaknesses: Array.isArray(parsedData.weaknesses) ? parsedData.weaknesses : [],
          conclusion: parsedData.conclusion || 'Conclusion unavailable.',
          rawAnalysis: responseText,
          generatedAt: new Date()
        };
      } catch (jsonErr) {
        return {
          summary: responseText.slice(0, 300) + '...',
          mainPoints: argumentsList.map(a => `${a.user?.name}: ${a.content.slice(0, 80)}`),
          strengths: argumentsList.filter(a => a.votes > 0).map(a => a.content),
          weaknesses: argumentsList.filter(a => a.votes === 0).map(a => a.content),
          conclusion: 'Analysis complete based on participant arguments.',
          rawAnalysis: responseText,
          generatedAt: new Date()
        };
      }
    } catch (apiError) {
      console.warn('[Gemini API Call Warning]:', apiError.message);
    }
  }

  const sortedArgs = [...argumentsList].sort((a, b) => b.votes - a.votes);

  return {
    summary: `Debate on "${topic}" featured ${argumentsList.length} participant arguments. Discussion focused on ${description}.`,
    mainPoints: argumentsList.map((a) => `${a.user?.name || 'Participant'}: "${a.content}"`),
    strengths: sortedArgs.slice(0, 2).map((a) => `"${a.content}" by ${a.user?.name || 'Participant'} (${a.votes} votes)`),
    weaknesses: sortedArgs.slice(-1).map((a) => `"${a.content}" by ${a.user?.name || 'Participant'}`),
    conclusion: `The debate concluded with active participation and consensus centered around top-voted arguments.`,
    rawAnalysis: 'Rule-based fallback summary generated.',
    generatedAt: new Date()
  };
};

module.exports = {
  generateDebateTopic,
  generateDebateAnalysis
};
