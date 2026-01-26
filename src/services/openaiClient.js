import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

class OpenAIClient {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.visionModel = process.env.OPENAI_VISION_MODEL || 'gpt-4o';
    this.textModel = process.env.OPENAI_TEXT_MODEL || 'gpt-4o';
  }

  async analyzeImage(imagePath, prompt, maxTokens = 4096) {
    try {
      console.log('🔍 Analyzing image with GPT-4 Vision...');
      
      // Read image and convert to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/png;base64,${base64Image}`;

      const response = await this.client.chat.completions.create({
        model: this.visionModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: { url: imageUrl } 
              }
            ]
          }
        ],
        max_tokens: maxTokens
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  async generateText(prompt, maxTokens = 4096) {
    try {
      console.log('💬 Generating text with GPT-4...');
      
      const response = await this.client.chat.completions.create({
        model: this.textModel,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating text:', error);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }
}

export default OpenAIClient;
