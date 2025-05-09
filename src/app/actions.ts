"use server";

import { supabaseServerClient } from "@/lib/supabase/server";
import OpenAI from "openai";
const client = new OpenAI();

// SQL strategies
const setupSqlScript = `
-- Schema:
-- Address: id (BIGSERIAL), street (VARCHAR(100)), city (VARCHAR(50)), state (CHAR(2)), zip (CHAR(5))
-- Person: id (SERIAL), first_name (VARCHAR(50)), last_name (VARCHAR(50)), address_id (BIGINT), phone_number (VARCHAR(15))
-- Customer: person_id (INT), birthdate (DATE)
-- Mechanic: person_id (INT), salary (NUMERIC(10, 2))
-- Garage: id (BIGSERIAL), address_id (BIGINT), phone_number (VARCHAR(15)), number_of_vehicle_lifts (INT)
-- MechanicGarage: mechanic_id (INT), garage_id (BIGINT)
-- Car: id (BIGSERIAL), make (VARCHAR(50)), model (VARCHAR(50))
-- CustomerCar: customer_id (INT), car_id (BIGINT)
-- TireType: id (BIGSERIAL), name (VARCHAR(50))
-- Tire: barcode (BIGINT), tire_type_id (BIGINT), tread (INTEGER), brand (VARCHAR(50)), date_installed (TIMESTAMP), last_rotated_date (TIMESTAMP), car_id (BIGINT)
-- Purchase: id (BIGSERIAL), tire_id (BIGINT), customer_id (INT), mechanic_id (INT), purchase_date (TIMESTAMP)
`;

const commonSqlOnlyRequest = " Give me a PostgreSQL SELECT statement that answers the question. Only respond with PostgreSQL syntax. If there is an error, do not explain it!";
const strategies = {
  zero_shot: setupSqlScript + commonSqlOnlyRequest,
  single_domain_double_shot:
    setupSqlScript +
    " Who are the customers who own cars and have made purchases? " +
    `
    SELECT c.first_name, c.last_name, car.make, car.model
    FROM Customer cu
    JOIN Person c ON cu.person_id = c.id
    JOIN CustomerCar cc ON cu.person_id = cc.customer_id
    JOIN Car car ON cc.car_id = car.id
    JOIN Purchase p ON p.customer_id = cu.person_id;
    ` +
    commonSqlOnlyRequest,
  cross_domain_few_shot:
    setupSqlScript +
    `
    -- Cross-domain demonstration examples:
    -- Example 1:
    -- Database: Automotive
    -- Schema: Customer, Car, Purchase
    -- NLQ: "List all customers who purchased tires in the last month."
    -- SQL: SELECT c.first_name, c.last_name, p.purchase_date
    --      FROM Customer cu
    --      JOIN Person c ON cu.person_id = c.id
    --      JOIN Purchase p ON p.customer_id = cu.person_id
    --      WHERE p.purchase_date >= NOW() - INTERVAL '1 month';

    -- Example 2:
    -- Database: Garage
    -- Schema: Mechanic, Garage, MechanicGarage
    -- NLQ: "Find all mechanics working in garages with more than 5 vehicle lifts."
    -- SQL: SELECT m.first_name, m.last_name, g.number_of_vehicle_lifts
    --      FROM Mechanic me
    --      JOIN Person m ON me.person_id = m.id
    --      JOIN MechanicGarage mg ON me.person_id = mg.mechanic_id
    --      JOIN Garage g ON mg.garage_id = g.id
    --      WHERE g.number_of_vehicle_lifts > 5;

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

export async function executeSQLQuery(rawQuery: string): Promise<string> {
  try {
    const query = rawQuery.trim().replace(/;+\s*$/, '');

    const { data, error } = await supabaseServerClient.rpc('execute_raw_sql', { query });

    if (error) {
      console.error("Supabase SQL error:", error);
      throw new Error("Failed to execute SQL query");
    }

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Database execution error:", error);
    throw new Error("Failed to execute SQL query");
  }
}

export async function getNaturalResponse(prompt: string, dbResponse: string): Promise<string> {
  try {
    const systemPrompt = "I asked a question \"" + prompt +"\" and the response was \""+dbResponse+"\" Please, just give a concise response in a more friendly way? Please do not give any other suggests or chatter."

    const response = await client.responses.create({
      model: "gpt-4",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Convert the following JSON response from the database into natural language that will answer the question: ${prompt}`,
        },
      ],
      temperature: 0.7,
    });

    return response.output_text.trim();
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate natural language response");
  }
}