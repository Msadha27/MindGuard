import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: any, res: any) {
    try {
        const { income, expense } = req.body;

        const prompt = `
    Income: ${income}
    Expense: ${expense}

    Give simple financial advice in 2 lines.
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });

        res.status(200).json({
            advice: response.choices[0].message.content,
        });

    } catch (err) {
        res.status(500).json({ error: "AI error" });
    }
}