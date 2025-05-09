"use server";

import OpenAI from "openai";
const client = new OpenAI();

export async function generateSQL(prompt: string): Promise<string> {
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

    return response.output_text;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate SQL query");
  }
}

export async function executeSQLQuery(query: string): Promise<string> {
  try {
    // Simulate a database response
    const simulatedResponse = [
      { id: 1, name: "John Doe", age: 30 },
      { id: 2, name: "Jane Smith", age: 25 },
    ];

    // Convert the simulated response to a string
    const responseString = simulatedResponse
      .map((item) => `ID: ${item.id}, Name: ${item.name}, Age: ${item.age}`)
      .join('\n');

    return responseString;
  } catch (error) {
    console.error("Database execution error:", error);
    throw new Error("Failed to execute SQL query");
  }
}

export async function getNaturalResponse(query: string): Promise<string> {
  try {
    // Simulate a natural language response
    const simulatedResponse = `There are 2 users: John Doe who is 30 years old and Jane Smith who is 25 years old.`;
    return simulatedResponse;
  }
  catch (error) {
    console.error("Natural language response error:", error);
    throw new Error("Failed to generate natural language response");
  }
}