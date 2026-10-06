const OpenAI = require('openai');

require('dotenv').config();

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1'
});


// ============================================================
// PROJECT ANALYSIS
// ============================================================
// ============================================================
// PROJECT ANALYSIS
// ============================================================

const analyzeProject = async (
    title,
    description,
    availableSkills
) => {

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
5. Assign a relative importance weight to every selected skill.
6. The weights must represent how important each skill is for successfully completing the project.
7. The sum of ALL skill weights MUST equal exactly 1.00.
8. Use decimal weights between 0.00 and 1.00.
9. More important skills must receive higher weights.
10. Do not include unnecessary skills just to increase the number of skills.
11. Determine the overall technical complexity from 1 to 5.
12. Give a short explanation for the complexity score.

WEIGHT CALCULATION REQUIREMENT:

The weights are relative importance values.

You MUST calculate the total of all selected skill weights before returning the response.

You MUST check the total a second time before returning the response.

The final sum MUST be exactly 1.00.

For example:

React = 0.50
Node.js = 0.30
MySQL = 0.20

Total:
0.50 + 0.30 + 0.20 = 1.00

This is valid.

Another example:

React = 0.40
Node.js = 0.30
MySQL = 0.20
CSS = 0.10

Total:
0.40 + 0.30 + 0.20 + 0.10 = 1.00

This is valid.

If your calculated total is:

1.05
0.99
1.01
0.95

or any value other than exactly 1.00,

DO NOT RETURN THE RESPONSE.

Instead, recalculate the weights and correct them first.

FINAL WEIGHT CHECK:

Before returning the JSON:

1. Add every skill weight.
2. Verify that the total is exactly 1.00.
3. Recheck the calculation.
4. Only then return the final JSON.

CRITICAL OUTPUT RULES:

- Return ONLY one valid JSON object.
- The first character of your response MUST be {.
- The last character of your response MUST be }.
- Do NOT write anything before the JSON.
- Do NOT write anything after the JSON.
- Do NOT write "User Safety".
- Do NOT write explanations outside the JSON.
- Do NOT use Markdown.
- Do NOT use code fences.
- Do NOT use \`\`\`json.
- Do NOT include comments.
- Do NOT include additional fields.

Required structure:

{
    "skills": [
        {
            "name": "React",
            "weight": 0.40
        },
        {
            "name": "Node.js",
            "weight": 0.35
        },
        {
            "name": "MySQL",
            "weight": 0.25
        }
    ],
    "complexity": 3,
    "complexity_reason": "Short explanation"
}

Rules:

- skills must contain only skills from the provided list.
- Every selected skill must have a weight.
- weight must be a number between 0 and 1.
- The sum of all weights must equal exactly 1.00.
- complexity must be an integer from 1 to 5.
- complexity_reason must be a short string.
- Do not include any additional fields.

FINAL RESPONSE MUST BE JSON ONLY.
`;

    // --------------------------------------------------------
    // JSON EXTRACTION HELPER
    // --------------------------------------------------------

    const extractJsonObject = (rawContent) => {

        if (
            typeof rawContent !== 'string' ||
            rawContent.trim() === ''
        ) {
            return null;
        }

        let content = rawContent.trim();

        // Remove Markdown code fences if the provider adds them.
        content = content
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        // Find the first JSON object.
        const jsonStart = content.indexOf('{');

        if (jsonStart === -1) {
            return null;
        }

        /*
         * Find the matching closing brace instead of simply using
         * lastIndexOf('}').
         *
         * This prevents malformed extra text from being included
         * in the JSON string.
         */
        let depth = 0;
        let inString = false;
        let escaped = false;

        for (
            let i = jsonStart;
            i < content.length;
            i++
        ) {

            const char = content[i];

            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\' && inString) {
                escaped = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                continue;
            }

            if (inString) {
                continue;
            }

            if (char === '{') {
                depth++;
            }

            if (char === '}') {
                depth--;

                if (depth === 0) {
                    return content.slice(
                        jsonStart,
                        i + 1
                    );
                }
            }
        }

        return null;
    };


    // --------------------------------------------------------
    // VALIDATION HELPER
    // --------------------------------------------------------

    const validateProjectAnalysis = (result) => {

        // ----------------------------------------------------
        // Validate top-level structure
        // ----------------------------------------------------

        if (
            !result ||
            typeof result !== 'object' ||
            Array.isArray(result)
        ) {
            throw new Error(
                'Project analysis must be a JSON object'
            );
        }


        // ----------------------------------------------------
        // Validate exact top-level fields
        // ----------------------------------------------------

        const expectedKeys = [
            'skills',
            'complexity',
            'complexity_reason'
        ];

        const actualKeys = Object.keys(result);

        if (
            actualKeys.length !== expectedKeys.length ||
            !expectedKeys.every(
                key => actualKeys.includes(key)
            )
        ) {
            throw new Error(
                'Project analysis contains invalid or additional fields'
            );
        }


        // ----------------------------------------------------
        // Validate skills
        // ----------------------------------------------------

        if (
            !Array.isArray(result.skills) ||
            result.skills.length === 0
        ) {
            throw new Error(
                'Invalid skills returned by OpenRouter'
            );
        }


        // ----------------------------------------------------
        // Build allowed skill set
        // ----------------------------------------------------

        const allowedSkills = new Set(
            availableSkills.map(skill => {

                if (typeof skill === 'string') {
                    return skill.trim();
                }

                if (
                    skill &&
                    typeof skill.name === 'string'
                ) {
                    return skill.name.trim();
                }

                return '';
            })
        );


        // ----------------------------------------------------
        // Validate each skill
        // ----------------------------------------------------

        const skillNames = new Set();

        for (const skill of result.skills) {

            if (
                !skill ||
                typeof skill !== 'object' ||
                Array.isArray(skill)
            ) {
                throw new Error(
                    'Invalid skill object returned by OpenRouter'
                );
            }


            const skillKeys = Object.keys(skill);

            if (
                skillKeys.length !== 2 ||
                !skillKeys.includes('name') ||
                !skillKeys.includes('weight')
            ) {
                throw new Error(
                    'Each skill must contain only name and weight'
                );
            }


            if (
                typeof skill.name !== 'string' ||
                skill.name.trim() === ''
            ) {
                throw new Error(
                    'Invalid skill name returned by OpenRouter'
                );
            }


            const skillName = skill.name.trim();


            // ------------------------------------------------
            // Make sure skill exists in NEXVO skill list
            // ------------------------------------------------

            if (!allowedSkills.has(skillName)) {
                throw new Error(
                    `OpenRouter returned an unknown skill: ${skillName}`
                );
            }


            // ------------------------------------------------
            // Prevent duplicate skills
            // ------------------------------------------------

            if (skillNames.has(skillName)) {
                throw new Error(
                    `Duplicate skill returned by OpenRouter: ${skillName}`
                );
            }

            skillNames.add(skillName);


            // ------------------------------------------------
            // Validate weight
            // ------------------------------------------------

            if (
                typeof skill.weight !== 'number' ||
                !Number.isFinite(skill.weight) ||
                skill.weight <= 0 ||
                skill.weight > 1
            ) {
                throw new Error(
                    `Invalid skill weight returned for ${skillName}`
                );
            }
        }


        // ----------------------------------------------------
        // Validate total weight
        // ----------------------------------------------------

        const totalWeight = result.skills.reduce(
            (sum, skill) => sum + skill.weight,
            0
        );

        console.log(
            `OPENROUTER PROJECT WEIGHT TOTAL: ${totalWeight}`
        );


        if (
            !Number.isFinite(totalWeight) ||
            Math.abs(totalWeight - 1) > 0.001
        ) {
            throw new Error(
                `Skill weights must sum to 1. Received ${totalWeight}`
            );
        }


        // ----------------------------------------------------
        // Normalize weights to EXACTLY 1.00
        // ----------------------------------------------------

        let normalizedTotal = 0;

        result.skills = result.skills.map(
            (skill, index) => {

                let weight;

                if (
                    index === result.skills.length - 1
                ) {

                    // Last skill gets the remainder.
                    weight = Number(
                        (
                            1 - normalizedTotal
                        ).toFixed(2)
                    );

                } else {

                    weight = Number(
                        skill.weight.toFixed(2)
                    );

                    normalizedTotal += weight;
                }

                return {
                    name: skill.name.trim(),
                    weight
                };
            }
        );


        // ----------------------------------------------------
        // Final exact weight safety check
        // ----------------------------------------------------

        let finalWeightTotal =
            result.skills.reduce(
                (sum, skill) => sum + skill.weight,
                0
            );

        finalWeightTotal = Number(
            finalWeightTotal.toFixed(2)
        );


        if (finalWeightTotal !== 1) {
            throw new Error(
                `Final normalized skill weights do not equal 1.00. Received ${finalWeightTotal}`
            );
        }


        // ----------------------------------------------------
        // Validate complexity
        // ----------------------------------------------------

        if (
            !Number.isInteger(result.complexity) ||
            result.complexity < 1 ||
            result.complexity > 5
        ) {
            throw new Error(
                'Invalid project complexity returned by OpenRouter'
            );
        }


        // ----------------------------------------------------
        // Validate complexity reason
        // ----------------------------------------------------

        if (
            typeof result.complexity_reason !== 'string' ||
            result.complexity_reason.trim() === ''
        ) {
            throw new Error(
                'Invalid complexity reason returned by OpenRouter'
            );
        }


        result.complexity_reason =
            result.complexity_reason.trim();


        return result;
    };


    // --------------------------------------------------------
    // REQUEST FUNCTION
    // --------------------------------------------------------

    const requestAnalysis = async () => {

        const response =
            await client.chat.completions.create({

                // DO NOT CHANGE THIS MODEL.
                model: 'openrouter/free',

                messages: [
                    {
                        role: 'system',
                        content:
                            'Return ONLY valid JSON. Your entire response must be one JSON object beginning with { and ending with }. No prose, no Markdown, no code fences, and no safety labels.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],

                response_format: {
                    type: 'json_object'
                },

                temperature: 0
            });


        return response
            .choices?.[0]
            ?.message
            ?.content;
    };


    // --------------------------------------------------------
    // TRY UP TO 3 TIMES
    // --------------------------------------------------------

    const MAX_ATTEMPTS = 3;

    let lastError = null;
    let lastRawResponse = null;

    for (
        let attempt = 1;
        attempt <= MAX_ATTEMPTS;
        attempt++
    ) {

        try {

            console.log(
                `OPENROUTER PROJECT ANALYSIS ATTEMPT ${attempt}/${MAX_ATTEMPTS}`
            );


            const content =
                await requestAnalysis();


            lastRawResponse = content;


            console.log(
                'OPENROUTER RAW PROJECT RESPONSE:'
            );

            console.log(content);


            if (
                !content ||
                typeof content !== 'string' ||
                content.trim() === ''
            ) {
                throw new Error(
                    'OpenRouter returned an empty response'
                );
            }


            const jsonContent =
                extractJsonObject(content);


            if (!jsonContent) {
                throw new Error(
                    'OpenRouter response did not contain a valid JSON object'
                );
            }


            console.log(
                'OPENROUTER EXTRACTED PROJECT JSON:'
            );

            console.log(jsonContent);


            let result;

            try {

                result = JSON.parse(
                    jsonContent
                );

            } catch (parseError) {

                console.error(
                    'JSON PARSE ERROR:',
                    parseError.message
                );

                throw new Error(
                    'OpenRouter returned malformed JSON'
                );
            }


            // Validate everything before returning.
            result =
                validateProjectAnalysis(result);


            console.log(
                'OPENROUTER PROJECT ANALYSIS VALIDATED SUCCESSFULLY'
            );

            console.log(
                JSON.stringify(
                    result,
                    null,
                    2
                )
            );


            return result;

        } catch (error) {

            lastError = error;


            console.error(
                `OPENROUTER PROJECT ANALYSIS ATTEMPT ${attempt} FAILED:`
            );

            console.error(
                error.message
            );


            if (
                attempt < MAX_ATTEMPTS
            ) {

                console.log(
                    'Retrying project analysis using the same openrouter/free model...'
                );

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            1000
                        )
                );
            }
        }
    }


    // --------------------------------------------------------
    // ALL ATTEMPTS FAILED
    // --------------------------------------------------------

    console.error(
        'OPENROUTER PROJECT ANALYSIS FAILED AFTER ALL ATTEMPTS'
    );

    console.error(
        'LAST RAW RESPONSE:'
    );

    console.error(
        lastRawResponse
    );


    throw new Error(
        `OpenRouter failed to return valid project JSON after ${MAX_ATTEMPTS} attempts: ${lastError?.message || 'Unknown error'}`
    );
};



// ============================================================
// PORTFOLIO PROJECT ANALYSIS
// ============================================================

const analyzePortfolioProject = async (
    title,
    description,
    technologies
) => {

    const prompt = `

You are the portfolio project analysis engine for NEXVO.

Analyze this freelancer portfolio project.

Project title:
${title}

Project description:
${description}

Technologies used:
${technologies}

Determine the technical complexity from 1 to 5.

1 = Very simple
2 = Basic
3 = Moderate
4 = Advanced
5 = Highly advanced

Return ONLY valid JSON.

Do not use Markdown.

Do not use code fences.

Required structure:

{
    "complexity": 1,
    "complexity_reason": "Short explanation"
}

Rules:

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
        throw new Error(
            'OpenRouter returned an empty response'
        );
    }

    content = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    try {

        const result = JSON.parse(content);

        if (
            !Number.isInteger(result.complexity) ||
            result.complexity < 1 ||
            result.complexity > 5 ||
            typeof result.complexity_reason !== 'string'
        ) {
            throw new Error(
                'Invalid portfolio analysis structure'
            );
        }

        return result;

    } catch (error) {

        console.error(
            'Invalid portfolio JSON returned by OpenRouter:'
        );

        console.error(content);

        throw new Error(
            'OpenRouter returned invalid portfolio analysis'
        );
    }
};


// ============================================================
// ASSESSMENT QUESTION GENERATION
// ============================================================

const generateAssessmentQuestions = async (
    skillName
) => {

    // NEXVO assessments always contain exactly 20 questions.
    const questionCount = 20;

    const prompt = `
You are the technical assessment generator for NEXVO,
a freelancer marketplace.

Generate a technical assessment specifically for the following skill:

Assessment skill:
${skillName}

Generate exactly ${questionCount} multiple-choice technical questions.

Rules:

1. Every question must specifically test the selected skill: ${skillName}.
2. Do not generate questions for unrelated skills.
3. Generate exactly ${questionCount} questions.
4. Every question must have exactly 4 options.
5. Options must be A, B, C and D.
6. Every question must have exactly one correct answer.
7. correct_answer must be A, B, C or D.
8. Every question is worth exactly 1 mark.
9. Questions must test technical understanding.
10. Questions should cover different concepts within the selected skill.
11. Difficulty should be appropriate for a freelancer technical assessment.
12. Do not create ambiguous questions.
13. Do not include explanations.
14. Do not include hints.
15. Return ONLY valid JSON.
16. Do not use Markdown.
17. Do not use code fences.

Required JSON structure:

{
    "questions": [
        {
            "id": 1,
            "question": "Question text",
            "options": {
                "A": "Option A",
                "B": "Option B",
                "C": "Option C",
                "D": "Option D"
            },
            "correct_answer": "B",
            "marks": 1
        }
    ]
}
`;

    const response =
        await client.chat.completions.create({

            model: 'openrouter/free',

            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

    let content =
        response.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error(
            'OpenRouter returned an empty assessment response'
        );
    }
        content = content.trim();

// --------------------------------------------------------
// EXTRACT JSON OBJECT
// --------------------------------------------------------

const jsonStart = content.indexOf('{');
const jsonEnd = content.lastIndexOf('}');

if (
    jsonStart === -1 ||
    jsonEnd === -1 ||
    jsonEnd <= jsonStart
) {
    console.error(
        'Could not find JSON object in OpenRouter assessment response:'
    );

    console.error(content);

    throw new Error(
        'OpenRouter did not return a valid assessment JSON object'
    );
}

const jsonContent = content.slice(
    jsonStart,
    jsonEnd + 1
);

let parsed;

try {

    parsed = JSON.parse(jsonContent);

} catch (error) {

    console.error(
        'Invalid assessment JSON returned by OpenRouter:'
    );

    console.error('RAW RESPONSE:');
    console.error(content);

    console.error('EXTRACTED JSON:');
    console.error(jsonContent);

    console.error('JSON PARSE ERROR:');
    console.error(error.message);

    throw new Error(
        'OpenRouter returned invalid assessment JSON'
    );
}           

    // --------------------------------------------------------
    // VALIDATE ASSESSMENT STRUCTURE
    // --------------------------------------------------------

    if (
        !parsed.questions ||
        !Array.isArray(parsed.questions)
    ) {

        throw new Error(
            'Invalid assessment structure returned by OpenRouter'
        );
    }

    // --------------------------------------------------------
    // STRICTLY REQUIRE EXACTLY 20 QUESTIONS
    // --------------------------------------------------------

    if (
        parsed.questions.length !== questionCount
    ) {

        throw new Error(
            `Expected exactly ${questionCount} questions but received ${parsed.questions.length}`
        );
    }

    const validAnswers = [
        'A',
        'B',
        'C',
        'D'
    ];

    // --------------------------------------------------------
    // VALIDATE EVERY QUESTION
    // --------------------------------------------------------

    for (const question of parsed.questions) {

        if (
            !question.id ||
            !question.question ||
            !question.options ||
            !question.correct_answer ||
            question.marks !== 1
        ) {

            throw new Error(
                'Invalid question structure returned by OpenRouter'
            );
        }

        // ----------------------------------------------------
        // VALIDATE CORRECT ANSWER
        // ----------------------------------------------------

        if (
            !validAnswers.includes(
                question.correct_answer
            )
        ) {

            throw new Error(
                'Invalid correct answer returned by OpenRouter'
            );
        }

        // ----------------------------------------------------
        // VALIDATE OPTIONS
        // ----------------------------------------------------

        const optionKeys =
            Object.keys(question.options);

        if (
            optionKeys.length !== 4 ||
            !validAnswers.every(
                key => optionKeys.includes(key)
            )
        ) {

            throw new Error(
                'Each question must contain exactly four options: A, B, C and D'
            );
        }

        // ----------------------------------------------------
        // VALIDATE OPTION VALUES
        // ----------------------------------------------------

        for (const key of validAnswers) {

            if (
                typeof question.options[key] !== 'string' ||
                question.options[key].trim() === ''
            ) {

                throw new Error(
                    `Option ${key} is invalid`
                );
            }
        }
    }

    // --------------------------------------------------------
    // FINAL QUESTION COUNT SAFETY CHECK
    // --------------------------------------------------------

    if (parsed.questions.length !== 20) {

        throw new Error(
            'Assessment must contain exactly 20 questions'
        );
    }

    return parsed;
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    analyzeProject,
    analyzePortfolioProject,
    generateAssessmentQuestions
};