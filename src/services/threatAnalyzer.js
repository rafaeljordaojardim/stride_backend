import OpenAIClient from './openaiClient.js';

const STRIDE_CATEGORIES = {
  SPOOFING: 'Spoofing (Falsificação de Identidade)',
  TAMPERING: 'Tampering (Adulteração)',
  REPUDIATION: 'Repudiation (Repúdio)',
  INFORMATION_DISCLOSURE: 'Information Disclosure (Divulgação de Informações)',
  DENIAL_OF_SERVICE: 'Denial of Service (Negação de Serviço)',
  ELEVATION_OF_PRIVILEGE: 'Elevation of Privilege (Elevação de Privilégio)'
};

class ThreatAnalyzer {
  constructor() {
    this.client = new OpenAIClient();
  }

  createThreatPrompt(systemName, architecture, category) {
    const componentsDesc = architecture.components
      .map(c => `- ${c.name} (${c.type}): ${c.description}`)
      .join('\n');

    return `Você é um especialista em segurança de software especializado em modelagem de ameaças STRIDE.

Sistema: ${systemName}

Arquitetura:
${componentsDesc}

Fluxos de dados:
${architecture.data_flows?.join('\n') || 'Não especificado'}

Analise as ameaças da categoria "${category}" para este sistema.

Forneça a análise no seguinte formato JSON:

{
  "threats": [
    {
      "title": "Título da ameaça",
      "description": "Descrição detalhada da ameaça",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "affected_components": ["componente1", "componente2"],
      "attack_scenario": "Cenário de ataque detalhado",
      "mitigation": "Estratégia de mitigação recomendada",
      "references": ["referência1", "referência2"]
    }
  ]
}

Identifique pelo menos 2-3 ameaças relevantes para esta categoria.
Responda APENAS com o JSON, sem texto adicional.`;
  }

  async analyzeThreats(systemName, architecture) {
    console.log('🔒 Starting STRIDE threat analysis...');
    
    const allThreats = [];
    
    for (const [key, category] of Object.entries(STRIDE_CATEGORIES)) {
      console.log(`  Analyzing: ${category}`);
      
      const prompt = this.createThreatPrompt(systemName, architecture, category);
      const response = await this.client.generateText(prompt, 4096);
      
      // Extract JSON from response
      let jsonStr = response;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      try {
        const result = JSON.parse(jsonStr);
        
        // Add category to each threat
        const threats = result.threats.map(threat => ({
          ...threat,
          category: key,
          category_name: category
        }));
        
        allThreats.push(...threats);
        console.log(`  ✓ Found ${threats.length} threats`);
      } catch (error) {
        console.error(`Error parsing threats for ${category}:`, error);
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Total threats identified: ${allThreats.length}`);
    
    return {
      system_name: systemName,
      architecture: architecture,
      threats: allThreats,
      summary: this.generateSummary(allThreats),
      timestamp: new Date().toISOString()
    };
  }

  generateSummary(threats) {
    const criticalCount = threats.filter(t => t.severity === 'CRITICAL').length;
    const highCount = threats.filter(t => t.severity === 'HIGH').length;
    const mediumCount = threats.filter(t => t.severity === 'MEDIUM').length;
    const lowCount = threats.filter(t => t.severity === 'LOW').length;
    
    return `Análise identificou ${threats.length} ameaças: ${criticalCount} críticas, ${highCount} altas, ${mediumCount} médias e ${lowCount} baixas.`;
  }
}

export default ThreatAnalyzer;
