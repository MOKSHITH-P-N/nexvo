const OpenAI = require('openai');
require('dotenv').config();

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1'
});

const analyzeProject = async (title, description, availableSkills) => {

    const prompt = `
You are the project analysis engine for NEXVO, a freelancer marketplace.

Analyze the following project.

Project title:
${title}

Project description:
${description}

Available NEXVO skills:
${JSON.stringify(availableSkills)}

Your tasks:

1. Identify the technical skills genuinely required to complete the project.
2. Select skills ONLY from the Available NEXVO skills list.
3. Use the EXACT spelling of the skills from the list.
4. Do not invent, rename, combine, or modify skill names.
5. Determine the overall technical complexity from 1 to 5.
6. Give a short explanation for the complexity score.

Return ONLY valid JSON.
Do not use Markdown.
Do not use code fences.

Required structure:

{
  "skills": ["React", "Node.js"],
  "complexity": 1,
  "complexity_reason": "Short explanation"
}

Rules:
- skills must contain only skills from the provided list.
- complexity must be an integer from 1 to 5.
- complexity_reason must be a short string.
`;

    const response = await client.chat.completions.create({
        model: 'openrouter/free',
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ]
    });

    let content = response.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('OpenRouter returned an empty response');
    }

    content = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    try {
        return JSON.parse(content);
    } catch (error) {
        console.error('Invalid JSON returned by OpenRouter:');
        console.error(content);

        throw new Error('OpenRouter returned invalid JSON');
    }
};

module.exports = {
    analyzeProject
};