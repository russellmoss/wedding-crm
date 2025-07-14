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
    },
    
    // Store all leads for comprehensive analysis
    allLeads: data
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
  const firstName = row.values[2] || '';
  const lastName = row.values[3] || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  return `Lead ${index + 1}: ${fullName || 'Name not provided'}
  - Submission Date: ${row.values[0]} at ${row.values[1]}
  - Contact: ${fullName || 'N/A'} | ${row.values[4] || 'No email'} | ${row.values[5] || 'No phone'}
  - Event Details: ${row.values[6] || 'N/A'} on ${row.values[7] || 'No date'} for ${row.values[8] || 'N/A'} guests
  - Message/Notes: ${row.values[9] || 'No message'}
  - Ceremony Type: ${row.values[10] || 'N/A'}
  - Wedding Style: ${row.values[11] || 'N/A'}
  - Associated Events: ${row.values[12] || 'None'}
  - Lead Stage: ${row.values[13] || 'N/A'}
  - Lead Status 1: ${row.values[15] || 'None'}
  - Lead Status 2: ${row.values[16] || 'None'}
  - Lead Status 3: ${row.values[17] || 'None'}
  - Lead Status 4: ${row.values[18] || 'None'}
  - Last Updated: ${row.values[20] || 'N/A'}
  - Inquiry Source: ${row.values[21] || 'N/A'}
  - Partner's Name: ${row.values[22] || 'N/A'}
  - Planning Stage: ${row.values[23] || 'N/A'}`;
}).join('\n\n')}

COMPREHENSIVE LEADS DATA (All ${data.length} leads):
${data.map((row, index) => {
  const firstName = row.values[2] || '';
  const lastName = row.values[3] || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const leadStage = row.values[13] || 'N/A';
  const status1 = row.values[15] || 'None';
  const status2 = row.values[16] || 'None';
  const status3 = row.values[17] || 'None';
  const status4 = row.values[18] || 'None';
  
  return `${index + 1}. ${fullName || 'Name not provided'} | ${row.values[4] || 'No email'} | Stage: ${leadStage} | Status1: ${status1} | Status2: ${status2} | Status3: ${status3} | Status4: ${status4} | Submitted: ${row.values[0]} | Source: ${row.values[21] || 'N/A'}`;
}).join('\n')}

BUSINESS CONTEXT - MILEA ESTATE VINEYARD WEDDING VENUE:

DATA STRUCTURE:
• Column A: Submission Date - When the lead first inquired
• Column B: Submission Time - Time of the initial inquiry
• Column C: First Name
• Column D: Last Name
• Column E: Email Address
• Column F: Phone Number
• Column G: Event Type (Wedding, Corporate Event, etc.)
• Column H: Desired Event Date
• Column I: Guest Count
• Column J: Message/Notes from the inquiry
• Column K: Ceremony Type
• Column L: Wedding Style/Vision
• Column M: Associated Events (Rehearsal dinner, etc.)
• Column N: Lead Stage (Hot, Hot - Manual Reply, Warm - no call, etc.)
• Column O: Update Lead button (not data)
• Column P: Lead Status 1
• Column Q: Lead Status 2
• Column R: Lead Status 3
• Column S: Lead Status 4
• Column T: Update Lead button (not data)
• Column U: Last Updated timestamp
• Column V: Inquiry Source (Website, Instagram, etc.)
• Column W: Partner's Name
• Column X: Planning Stage

LEAD STAGES EXPLANATION:
• "Hot" - All new leads start here. These are fresh inquiries that just came in.
• "Hot - Manual Reply" - Leads where we manually responded to specific questions via email or text (not through automated flow).
• "Warm - no call" - Leads we switched to this stage after no response. They enter an automated "no call" flow with emails and texts to encourage booking a call.
• "Warm - no tour" - Leads we manually moved here after having a call but no tour booked. This flow tries to get them to book a tour.
• "Cold" - Leads we haven't heard from in about 3 months since initial contact.
• "Closed-Won" - We won the deal and booked the wedding.
• "Closed-Lost" - We closed the deal but didn't get the booking.

LEAD STATUS EXPLANATION:
• "Contacted" - We called them but didn't hear back or get a response.
• "Contacted & Communicated" - We called and talked to them OR we had back-and-forth communication via text/email.
• "Tour Scheduled" - They are coming for a tour of the venue.
• "Proposal Sent" - We sent them a proposal/quote for their wedding.
• "Closed-Won" - We won the deal and booked the wedding.
• "Closed-Lost" - We closed the deal but didn't get the booking.

SALES PROCESS FLOW:
1. New lead comes in as "Hot"
2. If they have specific questions → "Hot - Manual Reply" (manual response)
3. If no response after initial contact → "Warm - no call" (automated follow-up flow)
4. If we had a call but no tour → "Warm - no tour" (tour booking flow)
5. If no activity for ~3 months → "Cold"
6. Throughout the process, lead statuses track communication: Contacted → Contacted & Communicated → Tour Scheduled → Proposal Sent → Closed-Won/Closed-Lost

KEY METRICS TO FOCUS ON:
• Hot to Warm conversion rates
• Call booking rates from Warm - no call flow
• Tour booking rates from Warm - no tour flow
• Overall conversion from lead to booking
• Time spent in each stage
• Response rates to different communication methods

EXAMPLE QUESTIONS YOU CAN ANSWER:
• "What's my conversion rate from Hot leads to bookings?"
• "How many leads are currently in my Warm - no call flow?"
• "What's the average time a lead spends in the Hot stage?"
• "How many tours have we scheduled this month?"
• "What's my best performing inquiry source?"
• "How many proposals have we sent vs. how many bookings?"
• "What's the conversion rate from Tour Scheduled to Closed-Won?"
• "How many leads have we lost to Cold status?"
• "Can you show me examples of leads that have been in Hot stage for more than a week?"
• "Who are the leads that have Tour Scheduled status?"
• "Which leads from this month haven't been contacted yet?"
• "Show me all the leads with Closed-Won status and their names"
• "Who are the leads currently in Warm - no call stage?"
• "List all leads that have Tour Scheduled in any status column"
• "Which leads came from Instagram and what's their current status?"

This is wedding venue CRM data for Milea Estate Vineyard. Please analyze this data to answer the user's question about their wedding venue business metrics, keeping in mind the specific business processes and lead flow described above.
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
      system: `You are an AI assistant helping a winery general manager analyze their wedding venue CRM data for Milea Estate Vineyard. 
      
      You have access to comprehensive CRM data including ALL leads with their names, lead stages, statuses, dates, and conversion metrics. You understand the specific business processes and lead flow for this wedding venue.
      
      IMPORTANT: You have access to the complete list of all leads in the "COMPREHENSIVE LEADS DATA" section. Use this data to answer questions about specific leads, statuses, or stages. You can reference leads by name and provide detailed analysis of any subset of leads.
      
      BUSINESS CONTEXT:
      - All leads start as "Hot" when they first inquire
      - "Hot - Manual Reply" means you manually responded to specific questions
      - "Warm - no call" is an automated follow-up flow for leads who haven't responded
      - "Warm - no tour" is for leads who had a call but didn't book a tour
      - "Cold" leads haven't been heard from in ~3 months
      - Lead statuses track communication: Contacted → Contacted & Communicated → Tour Scheduled → Proposal Sent → Closed-Won/Closed-Lost
      
      When answering questions:
      1. Be specific and data-driven with actual numbers from their CRM
      2. Calculate percentages and rates when relevant (e.g., conversion rates between stages)
      3. Provide context about what the numbers mean for the wedding venue business
      4. Suggest actionable insights for improving the sales process
      5. If you need to make assumptions, state them clearly
      6. Reference specific lead stages and statuses using the exact terminology from their system
      7. Consider the sales funnel: Hot → Warm stages → Tour → Proposal → Booking
      8. When relevant, reference specific leads by name from the sample data to provide concrete examples
      9. Use the contact information (names, emails) to make your analysis more personal and actionable
      
      Focus on practical business insights that would help a winery general manager optimize their wedding venue sales process and improve conversion rates.`,
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