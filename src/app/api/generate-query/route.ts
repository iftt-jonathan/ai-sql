import OpenAI from "openai";
const client = new OpenAI();

export async function POST(req: Request) {
  const { prompt } = await req.json();

  try {
    const systemPrompt = `You are a helpful assistant that generates SQL queries from natural language.
    You will receive a natural language prompt and you need to generate the corresponding SQL query.`;

    const response = await client.responses.create({
      model: "gpt-4",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Create a SQL query that will answer this question: ${prompt}`,
        },
      ],
      temperature: 0.7,
    });

    return Response.json({ text: response.output_text });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return Response.json({ error: "Failed to generate text" }, { status: 500 });
  }
}
