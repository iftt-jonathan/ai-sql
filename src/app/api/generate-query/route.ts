import OpenAI from "openai";
const client = new OpenAI();

export async function POST(req: Request) {
  const { prompt } = await req.json();

  try {
    const systemPrompt = `You are a PostgreSQL and Supabase expert that generates SQL queries from natural language.
    You will receive a natural language prompt and you need to generate the corresponding SQL query.
    Only output the SQL query. Do not include any explanations or additional text. Here is the schema of the database:
    - users: id (int), name (text), age (int)
    - orders: id (int), user_id (int), total (float)`;

    const response = await client.responses.create({
      model: "gpt-4",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Convert the following natural language question into a SQL query that will answer the question: ${prompt}`,
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
