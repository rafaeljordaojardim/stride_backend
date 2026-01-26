import OpenAIClient from './openaiClient.js';

class DiagramAnalyzer {
  constructor() {
    this.client = new OpenAIClient();
  }

  createAnalysisPrompt() {
    return `Você é um especialista em arquitetura de software e segurança de sistemas.

Analise este diagrama de arquitetura e forneça uma análise detalhada no seguinte formato JSON:

{
  "description": "Descrição geral da arquitetura (2-3 frases)",
  "components": [
    {
      "name": "Nome do componente",
      "type": "APPLICATION|DATABASE|API|SERVICE|EXTERNAL|NETWORK|USER|STORAGE",
      "description": "Descrição detalhada do componente",
      "technologies": ["tecnologia1", "tecnologia2"]
    }
  ],
  "data_flows": [
    "Descrição do fluxo de dados entre componentes"
  ],
  "trust_boundaries": [
    "Descrição das fronteiras de confiança identificadas"
  ]
}

Seja preciso e identifique TODOS os componentes visíveis no diagrama.
Responda APENAS com o JSON, sem texto adicional.`;
  }

  async analyzeDiagram(imagePath) {
    console.log('🔍 Analyzing architecture diagram...');
    
    const prompt = this.createAnalysisPrompt();
    const response = await this.client.analyzeImage(imagePath, prompt, 4096);
    
    console.log('📊 Extracting structured components...');
    
    // Extract JSON from response
    let jsonStr = response;
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    try {
      const architecture = JSON.parse(jsonStr);
      console.log(`✅ Identified ${architecture.components?.length || 0} components`);
      return architecture;
    } catch (error) {
      console.error('Error parsing architecture JSON:', error);
      console.log('Raw response:', response);
      throw new Error('Failed to parse architecture analysis');
    }
  }
}

export default DiagramAnalyzer;
