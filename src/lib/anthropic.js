// src/lib/anthropic.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, you'd want this on your backend
});

// Function to format CRM data for Claude analysis
export const formatCRMDataForAnalysis = (sheetData) => {
  if (!sheetData.data || !sheetData.headers) {
    return "No CRM data available for analysis.";
  }

  const headers = sheetData.headers;
  const data = sheetData.data;

  // Create a summary of the data structure
  const dataSummary = {
    totalLeads: data.length,
    headers: headers,
    sampleData: data.slice(0, 3).map(row => row.values), // First 3 rows as examples
    
    // Calculate some basic metrics
    leadStages: {},
    leadStatuses: {
      status1: {},
      status2: {},
      status3: {},
      status4: {}
    },
    dateRange: {
      earliest: null,
      latest: null
    }
  };

  // Analyze lead stages (Column N - index 13)
  data.forEach(row => {
    const leadStage = row.values[13] || 'Unknown';
    dataSummary.leadStages[leadStage] = (dataSummary.leadStages[leadStage] || 0) + 1;

    // Analyze lead statuses (Columns P, Q, R, S - indices 15, 16, 17, 18)
    const statuses = [row.values[15], row.values[16], row.values[17], row.values[18]];
    statuses.forEach((status, index) => {
      if (status) {
        const statusKey = `status${index + 1}`;
        dataSummary.leadStatuses[statusKey][status] = (dataSummary.leadStatuses[statusKey][status] || 0) + 1;
      }
    });

    // Track date range (Column A - index 0)
    const submissionDate = new Date(row.values[0]);
    if (!isNaN(submissionDate)) {
      if (!dataSummary.dateRange.earliest || submissionDate < dataSummary.dateRange.earliest) {
        dataSummary.dateRange.earliest = submissionDate;
      }
      if (!dataSummary.dateRange.latest || submissionDate > dataSummary.dateRange.latest) {
        dataSummary.dateRange.latest = submissionDate;
      }
    }
  });

  return `
CRM DATA ANALYSIS CONTEXT:

HEADERS:
${headers.map((header, index) => `${String.fromCharCode(65 + index)}: ${header}`).join('\n')}

DATASET OVERVIEW:
- Total Leads: ${dataSummary.totalLeads}
- Date Range: ${dataSummary.dateRange.earliest?.toLocaleDateString()} to ${dataSummary.dateRange.latest?.toLocaleDateString()}

LEAD STAGES BREAKDOWN:
${Object.entries(dataSummary.leadStages).map(([stage, count]) => `- ${stage}: ${count} leads`).join('\n')}

LEAD STATUS BREAKDOWNS:
Status 1 (${headers[15]}):
${Object.entries(dataSummary.leadStatuses.status1).map(([status, count]) => `  - ${status}: ${count}`).join('\n')}

Status 2 (${headers[16]}):
${Object.entries(dataSummary.leadStatuses.status2).map(([status, count]) => `  - ${status}: ${count}`).join('\n')}

Status 3 (${headers[17]}):
${Object.entries(dataSummary.leadStatuses.status3).map(([status, count]) => `  - ${status}: ${count}`).join('\n')}

Status 4 (${headers[18]}):
${Object.entries(dataSummary.leadStatuses.status4).map(([status, count]) => `  - ${status}: ${count}`).join('\n')}

SAMPLE DATA (First 3 leads):
${data.slice(0, 3).map((row, index) => {
  return `Lead ${index + 1}:
  - Submission: ${row.values[0]} at ${row.values[1]}
  - Name: ${row.values[2]} ${row.values[3]}
  - Email: ${row.values[4]}
  - Phone: ${row.values[5]}
  - Event Type: ${row.values[6]}
  - Event Date: ${row.values[7]}
  - Guest Count: ${row.values[8]}
  - Lead Stage: ${row.values[13]}
  - Lead Status 1: ${row.values[15]}
  - Lead Status 2: ${row.values[16]}
  - Lead Status 3: ${row.values[17]}
  - Lead Status 4: ${row.values[18]}`;
}).join('\n\n')}

This is wedding venue CRM data for Milea Estate Vineyard. The lead stages typically progress from "Hot" -> various warm stages -> "Closed-Won" or "Closed-Lost". 
Lead statuses track the communication and sales process: "Contacted" -> "Contacted & Communicated" -> "Tour Scheduled" -> "Proposal Sent" -> "Closed-Won/Closed-Lost".

Please analyze this data to answer the user's question about their wedding venue business metrics.
`;
};

// Function to ask Claude questions about CRM data
export const askClaudeAboutCRM = async (question, sheetData) => {
  try {
    const formattedData = formatCRMDataForAnalysis(sheetData);
    
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      temperature: 0.1,
      system: `You are an AI assistant helping a winery general manager analyze their wedding venue CRM data. 
      
      You have access to comprehensive CRM data including lead stages, statuses, dates, and conversion metrics. 
      
      When answering questions:
      1. Be specific and data-driven
      2. Calculate percentages and rates when relevant
      3. Provide context about what the numbers mean for the business
      4. Suggest actionable insights when appropriate
      5. If you need to make assumptions, state them clearly
      
      Focus on practical business insights that would help a winery general manager make decisions.`,
      messages: [
        {
          role: "user",
          content: `${formattedData}\n\nUser Question: ${question}`
        }
      ]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw new Error(`Failed to analyze data: ${error.message}`);
  }
}; 