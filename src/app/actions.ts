"use server";

import { supabaseServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";
const client = new OpenAI();

// SQL strategies
const setupSqlScript = `
-- Schema:
-- users: id (int), name (text), age (int)
-- orders: id (int), user_id (int), total (float)
`;

const commonSqlOnlyRequest = " Give me a PostgreSQL SELECT statement that answers the question. Only respond with PostgreSQL syntax. If there is an error, do not explain it!";
const strategies = {
  zero_shot: setupSqlScript + commonSqlOnlyRequest,
  single_domain_double_shot:
    setupSqlScript +
    " Who doesn't have a way for us to text them? " +
    `
    SELECT p.person_id, p.name
    FROM person p
    LEFT JOIN phone ph ON p.person_id = ph.person_id AND ph.can_receive_sms = 1
    WHERE ph.phone_id IS NULL;
    ` +
    commonSqlOnlyRequest,
  cross_domain_few_shot:
    setupSqlScript +
    `
    -- Cross-domain demonstration examples:
    -- Example 1:
    -- Database: Library
    -- Schema: books: id (int), title (text), author (text), year (int)
    -- NLQ: "List all books published after 2000."
    -- SQL: SELECT * FROM books WHERE year > 2000;

    -- Example 2:
    -- Database: E-commerce
    -- Schema: products: id (int), name (text), price (float), stock (int)
    -- NLQ: "Find all products that cost more than $50."
    -- SQL: SELECT * FROM products WHERE price > 50;

    -- Task instruction:
    -- Convert the following natural language question into a SQL query for the test database:
    ` +
    commonSqlOnlyRequest,
};

export async function generateSQL(prompt: string, strategy: keyof typeof strategies = "zero_shot"): Promise<string> {
  try {
    const systemPrompt = strategies[strategy];

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

    return response.output_text.trim();
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
//   try {
//     const { data, error } = await supabaseServerClient.rpc('execute_raw_sql', { query });

//     if (error) {
//       console.error("Supabase SQL error:", error);
//       throw new Error("Failed to execute SQL query");
//     }

//     return JSON.stringify(data, null, 2);
//   } catch (error) {
//     console.error("Database execution error:", error);
//     throw new Error("Failed to execute SQL query");
//   }
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