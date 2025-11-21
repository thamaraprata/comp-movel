import { Router } from "express";
import { z } from "zod";
import { generateWeatherTips, generateAlertMessage } from "../../integrations/gemini.js";
import { logger } from "../../config/logger.js";

export const tipsRouter = Router();

const weatherContextSchema = z.object({
  temperature: z.number(),
  humidity: z.number().min(0).max(100),
  location: z.string(),
  conditions: z.string().optional().default("Sem informações")
});

const alertContextSchema = z.object({
  sensorId: z.string(),
  value: z.number(),
  threshold: z.number()
});

tipsRouter.post("/weather", async (req, res) => {
  try {
    const context = weatherContextSchema.parse(req.body);
    const tips = await generateWeatherTips(context);
    
    res.json({
      status: "success",
      data: tips
    });
  } catch (error) {
    logger.error(error, "Error in weather tips endpoint");
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: "error",
        message: "Invalid request body",
        errors: error.errors
      });
    }
    
    res.status(500).json({
      status: "error",
      message: "Failed to generate tips"
    });
  }
});

tipsRouter.post("/alert-message", async (req, res) => {
  try {
    const context = alertContextSchema.parse(req.body);
    const message = await generateAlertMessage(context.sensorId, context.value, context.threshold);
    
    res.json({
      status: "success",
      data: { message }
    });
  } catch (error) {
    logger.error(error, "Error in alert message endpoint");
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: "error",
        message: "Invalid request body",
        errors: error.errors
      });
    }
    
    res.status(500).json({
      status: "error",
      message: "Failed to generate alert message"
    });
  }
});
