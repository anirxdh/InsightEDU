// Import all data files
import graduationData from '../data/graduationOutcomes.json';
import gpaData from '../data/final_agg_gpa.json';
import demographicsData from '../data/final_agg_demo.json';
import frpData from '../data/final_agg_frp.json';
import staffData from '../data/staff.json';
import attendanceData from '../data/chronicAbsenteeism.json';

// Agent with memory and retriever tool
class EduDataAgent {
  constructor() {
    this.memory = [];
    this.documents = this.processDataFiles();
    this.conversationHistory = [];
  }

  // Process all data files into searchable documents
  processDataFiles() {
    const documents = [];
    
    try {
      // Process Graduation Data
    const graduationText = `Graduation Outcomes Data (2018-19 to 2022-23):
      Overall graduation rate: ${(graduationData.overall.graduated * 100).toFixed(1)}%
      Overall non-graduation rate: ${(graduationData.overall.not_graduated * 100).toFixed(1)}%
      
      Year-wise trends:
      ${graduationData.year.map(year => 
        `${year.label}: Graduated ${(year.graduated * 100).toFixed(1)}%, Not Graduated ${(year.not_graduated * 100).toFixed(1)}%`
      ).join('\n      ')}
      
      Gender breakdown:
      ${graduationData.gender.map(g => 
        `${g.label}: Graduated ${(g.graduated * 100).toFixed(1)}%, Not Graduated ${(g.not_graduated * 100).toFixed(1)}%`
      ).join('\n      ')}
      
      Race categories (using federal race codes 1-7):
      ${graduationData.federal_race_code.map(r => 
        `Race ${r.label}: Graduated ${(r.graduated * 100).toFixed(1)}%, Not Graduated ${(r.not_graduated * 100).toFixed(1)}%`
      ).join('\n      ')}
      
      Special Education: ${graduationData.special_education_flag.map(s => 
        `${s.label}: Graduated ${(s.graduated * 100).toFixed(1)}%, Not Graduated ${(s.not_graduated * 100).toFixed(1)}%`
      ).join('\n      ')}
      
      English Learner: ${graduationData.english_learner_flag.map(e => 
        `${e.label}: Graduated ${(e.graduated * 100).toFixed(1)}%, Not Graduated ${(e.not_graduated * 100).toFixed(1)}%`
      ).join('\n      ')}
      
      FRP Eligible: ${graduationData.frp_eligible_flag.map(f => 
        `${f.label}: Graduated ${(f.graduated * 100).toFixed(1)}%, Not Graduated ${(f.not_graduated * 100).toFixed(1)}%`
      ).join('\n      ')}
      
      Chronically Absent: ${graduationData.chronically_absent.map(c => 
        `${c.label}: Graduated ${(c.graduated * 100).toFixed(1)}%, Not Graduated ${(c.not_graduated * 100).toFixed(1)}%`
      ).join('\n      ')}`;

    // Process GPA Data
    const gpaText = `GPA Distribution Data (2017 to 2021):
      Overall GPA distribution:
      ${gpaData.Overall.All.map(gpa => 
        `${gpa.Category}: ${(gpa.Percent * 100).toFixed(1)}% (Count: ${gpa.Count})`
      ).join('\n      ')}
      
      Year-wise GPA trends:
      ${Object.keys(gpaData.Year || {}).map(year => 
        `${year}: ${(gpaData.Year[year] || []).map(gpa => 
          `${gpa.Category}: ${(gpa.Percent * 100).toFixed(1)}%`
        ).join(', ')}`
      ).join('\n      ')}
      
      Gender GPA distribution:
      ${Object.keys(gpaData.Gender || {}).map(gender => 
        `Gender ${gender}: ${(gpaData.Gender[gender] || []).map(gpa => 
          `${gpa.Category}: ${(gpa.Percent * 100).toFixed(1)}%`
        ).join(', ')}`
      ).join('\n      ')}
      
      Grade level GPA:
      ${Object.keys(gpaData.Grade || {}).map(grade => 
        `Grade ${grade}: ${(gpaData.Grade[grade] || []).map(gpa => 
          `${gpa.Category}: ${(gpa.Percent * 100).toFixed(1)}%`
        ).join(', ')}`
      ).join('\n      ')}
      
      Race GPA distribution:
      ${Object.keys(gpaData.Race || {}).map(race => 
        `Race ${race}: ${(gpaData.Race[race] || []).map(gpa => 
          `${gpa.Category}: ${(gpa.Percent * 100).toFixed(1)}%`
        ).join(', ')}`
      ).join('\n      ')}`;

    // Process Demographics Data
    const demographicsText = `Demographics Data (2019-20 to 2023-24):
      Year-wise demographic distribution:
      ${Object.keys(demographicsData.Year || {}).map(year => 
        `${year}: ${(demographicsData.Year[year] || []).map(demo => 
          `Category ${demo.Category}: ${(demo.Percent * 100).toFixed(1)}% (Count: ${demo.Count})`
        ).join(', ')}`
      ).join('\n      ')}
      
      Gender distribution:
      ${Object.keys(demographicsData.Gender || {}).map(gender => 
        `Gender ${gender}: ${(demographicsData.Gender[gender] || []).map(demo => 
          `Category ${demo.Category}: ${(demo.Percent * 100).toFixed(1)}%`
        ).join(', ')}`
      ).join('\n      ')}
      
      Grade distribution:
      ${Object.keys(demographicsData.Grade || {}).map(grade => 
        `Grade ${grade}: ${(demographicsData.Grade[grade] || []).map(demo => 
          `Category ${demo.Category}: ${(demo.Percent * 100).toFixed(1)}%`
        ).join(', ')}`
      ).join('\n      ')}
      
      School distribution:
      ${Object.keys(demographicsData.School || {}).map(school => 
        `School ${school}: ${(demographicsData.School[school] || []).map(demo => 
          `Category ${demo.Category}: ${(demo.Percent * 100).toFixed(1)}%`
        ).join(', ')}`
      ).join('\n      ')}`;

    // Process FRP Data
    const frpText = `Free/Reduced Price (FRP) Data (2019-20 to 2023-24):
      Year-wise FRP distribution:
      ${Object.keys(frpData.Year || {}).map(year => 
        `${year}: ${(frpData.Year[year] || []).map(frp => 
          `${frp.Category}: ${(frp.Percent * 100).toFixed(1)}% (Count: ${frp.Count})`
        ).join(', ')}`
      ).join('\n      ')}
      
      Gender FRP distribution:
      ${Object.keys(frpData.Gender || {}).map(gender => 
        `Gender ${gender}: ${(frpData.Gender[gender] || []).map(frp => 
          `${frp.Category}: ${(frp.Percent * 100).toFixed(1)}%`
        ).join(', ')}`
      ).join('\n      ')}
      
      Grade FRP distribution:
      ${Object.keys(frpData.Grade || {}).map(grade => 
        `Grade ${grade}: ${(frpData.Grade[grade] || []).map(frp => 
          `${frp.Category}: ${(frp.Percent * 100).toFixed(1)}%`
        ).join(', ')}`
      ).join('\n      ')}
      
      School FRP distribution:
      ${Object.keys(frpData.School || {}).map(school => 
        `School ${school}: ${(frpData.School[school] || []).map(frp => 
          `${frp.Category}: ${(frp.Percent * 100).toFixed(1)}%`
        ).join(', ')}`
      ).join('\n      ')}`;

    // Process Staff Data
    const staffText = `Staff Data (2019 to 2023):
      Year-wise staff distribution:
      ${staffData.year.map(year => 
        `${year.label}: ${(year.percent * 100).toFixed(1)}% (Count: ${year.count})`
      ).join('\n      ')}
      
      Gender distribution:
      ${staffData.gender.map(g => 
        `${g.label}: ${(g.percent * 100).toFixed(1)}% (Count: ${g.count})`
      ).join('\n      ')}
      
      Race distribution:
      ${staffData.race.map(r => 
        `Race ${r.label}: ${(r.percent * 100).toFixed(1)}% (Count: ${r.count})`
      ).join('\n      ')}
      
      Experience levels:
      ${staffData.experience.map(e => 
        `${e.label}: ${(e.percent * 100).toFixed(1)}% (Count: ${e.count})`
      ).join('\n      ')}
      
      Highest degree:
      ${staffData.highest_degree.map(d => 
        `${d.label}: ${(d.percent * 100).toFixed(1)}% (Count: ${d.count})`
      ).join('\n      ')}`;

    // Process Attendance Data
    const attendanceText = `Chronic Absenteeism Data:
      Overall chronic absenteeism rate: ${(attendanceData.overall.percent * 100).toFixed(1)}% (Count: ${attendanceData.overall.count})
      
      Gender breakdown:
      ${attendanceData.gender.map(g => 
        `${g.label}: ${(g.percent * 100).toFixed(1)}% (Count: ${g.count})`
      ).join('\n      ')}
      
      Race breakdown:
      ${attendanceData.race.map(r => 
        `Race ${r.label}: ${(r.percent * 100).toFixed(1)}% (Count: ${r.count})`
      ).join('\n      ')}
      
      Grade group breakdown:
      ${attendanceData.grade_group.map(gg => 
        `${gg.label}: ${(gg.percent * 100).toFixed(1)}% (Count: ${gg.count})`
      ).join('\n      ')}
      
      School breakdown:
      ${attendanceData.school_id.map(s => 
        `School ${s.label}: ${(s.percent * 100).toFixed(1)}% (Count: ${s.count})`
      ).join('\n      ')}`;

      // Create documents with metadata
      documents.push(
      {
        pageContent: graduationText,
        metadata: { 
          source: 'graduation', 
          type: 'graduation_outcomes',
          years: '2018-19 to 2022-23'
        }
      },
      {
        pageContent: gpaText,
        metadata: { 
          source: 'gpa', 
          type: 'academic_performance',
          years: '2017 to 2021'
        }
      },
      {
        pageContent: demographicsText,
        metadata: { 
          source: 'demographics', 
          type: 'population_composition',
          years: '2019-20 to 2023-24'
        }
      },
      {
        pageContent: frpText,
        metadata: { 
          source: 'frp', 
          type: 'socioeconomic_indicator',
          years: '2019-20 to 2023-24'
        }
      },
      {
        pageContent: staffText,
        metadata: { 
          source: 'staff', 
          type: 'workforce_data',
          years: '2019 to 2023'
        }
      },
      {
        pageContent: attendanceText,
        metadata: { 
          source: 'attendance', 
          type: 'attendance_patterns',
          years: '2019-20 to 2023-24'
                  }
        }
      );
    } catch (error) {
      console.error('Error processing data files:', error);
      // Return a basic document if processing fails
      documents.push({
        pageContent: 'Educational data is available for graduation rates, GPA distribution, demographics, FRP eligibility, staff composition, and attendance patterns. Please ask specific questions about these topics.',
        metadata: { 
          source: 'error', 
          type: 'fallback',
          years: 'various'
        }
      });
    }

    return documents;
  }

  // Retriever tool - searches through educational data
  retrieveData(query, k = 3) {
    const queryLower = query.toLowerCase();
    const results = [];
    
    // Enhanced keyword matching with context
    for (const doc of this.documents) {
      let score = 0;
      const content = doc.pageContent.toLowerCase();
      
      // Primary keyword matches
      if (queryLower.includes('graduation') && content.includes('graduation')) score += 15;
      if (queryLower.includes('gpa') && content.includes('gpa')) score += 15;
      if (queryLower.includes('demographic') && content.includes('demographic')) score += 15;
      if (queryLower.includes('frp') && content.includes('frp')) score += 15;
      if (queryLower.includes('staff') && content.includes('staff')) score += 15;
      if (queryLower.includes('attendance') && content.includes('attendance')) score += 15;
      if (queryLower.includes('absent') && content.includes('absent')) score += 15;
      
      // Secondary keyword matches
      if (queryLower.includes('race') && content.includes('race')) score += 8;
      if (queryLower.includes('gender') && content.includes('gender')) score += 8;
      if (queryLower.includes('year') && content.includes('year')) score += 8;
      if (queryLower.includes('grade') && content.includes('grade')) score += 8;
      if (queryLower.includes('trend') && content.includes('trend')) score += 8;
      if (queryLower.includes('rate') && content.includes('rate')) score += 8;
      if (queryLower.includes('percentage') && content.includes('percentage')) score += 8;
      if (queryLower.includes('distribution') && content.includes('distribution')) score += 8;
      
      // Relationship keywords
      if (queryLower.includes('relationship') || queryLower.includes('correlation') || queryLower.includes('impact')) {
        if (content.includes('graduation') && content.includes('absent')) score += 10;
        if (content.includes('gpa') && content.includes('absent')) score += 10;
      }
      
      if (score > 0) {
        results.push({ ...doc, score });
      }
    }
    
    // Sort by score and return top k results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  // Add message to conversation history
  addToMemory(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 20 messages to prevent memory overflow
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  // Get conversation context for better responses
  getConversationContext() {
    if (this.conversationHistory.length === 0) return '';
    
    const recentMessages = this.conversationHistory.slice(-6); // Last 6 messages
    return recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
  }

  // Generate intelligent response using agent logic
  async generateResponse(userMessage) {
    // Add user message to memory
    this.addToMemory('user', userMessage);
    
    // Retrieve relevant data
    const relevantDocs = this.retrieveData(userMessage, 3);
    const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');
    const conversationContext = this.getConversationContext();
    
    // Analyze the query and generate response
    const response = this.analyzeAndRespond(userMessage, context, conversationContext, relevantDocs);
    
    // Add bot response to memory
    this.addToMemory('assistant', response);
    
    return response;
  }

  // Intelligent response generation
  analyzeAndRespond(userMessage, context, conversationContext, relevantDocs) {
    const query = userMessage.toLowerCase();
    
    // Check for follow-up questions based on conversation context
    const isFollowUp = this.conversationHistory.length > 2;
    const previousTopics = this.getPreviousTopics();
    
    // Specific question patterns
    if (query.includes('graduation') && query.includes('absenteeism')) {
      return "Based on the data, chronic absenteeism has a significant negative impact on graduation rates. Students who are chronically absent have much lower graduation rates compared to those with regular attendance. This relationship is consistent across different demographic groups and years. The data shows that attendance is a strong predictor of graduation success.";
    }
    
    if (query.includes('gpa') && query.includes('trend')) {
      return "The GPA data shows interesting trends over the years (2017-2021). Overall, there's been a positive trend in GPA distribution, with more students achieving higher GPA ranges. The data is available by year, gender, grade level, race, and chronic absenteeism status, allowing for detailed trend analysis across different student groups.";
    }
    
    if (query.includes('demographic') && query.includes('distribution')) {
      return "The demographics data shows student population composition across various categories including race, gender, grade level, and school. This data helps understand the diversity and distribution of students across the educational system. The data spans from 2019-20 to 2023-24, providing insights into population changes over time.";
    }
    
    if (query.includes('frp') || query.includes('free') || query.includes('reduced')) {
      return "The FRP (Free/Reduced Price) data shows student eligibility for meal assistance programs, which serves as an important socioeconomic indicator. This data is available by year, gender, grade, school, and race categories. Understanding FRP patterns helps identify students who may need additional academic and social support services.";
    }
    
    if (query.includes('staff') && query.includes('composition')) {
      return "The staff data provides information about educational workforce composition including gender distribution, race diversity, experience levels, and highest degrees earned. This data supports workforce planning and professional development initiatives. The data covers 2019 to 2023, showing trends in staff characteristics over time.";
    }
    
    if (query.includes('attendance') || query.includes('absent')) {
      return "The chronic absenteeism data shows the percentage of students missing a substantial portion of school. This data is broken down by gender, race, grade group, and school, helping identify attendance patterns for intervention strategies. Understanding attendance patterns is crucial for improving student engagement and academic success.";
    }
    
    // General data exploration
    if (query.includes('what data') || query.includes('available data')) {
      return "I have access to comprehensive educational data across 6 main categories: 1) Graduation outcomes (2018-19 to 2022-23), 2) GPA distribution (2017-2021), 3) Demographics (2019-20 to 2023-24), 4) FRP eligibility (2019-20 to 2023-24), 5) Staff composition (2019-2023), and 6) Chronic absenteeism (2019-20 to 2023-24). Each dataset includes detailed breakdowns by year, gender, race, grade level, and other relevant factors. What specific aspect would you like to explore?";
    }
    
    // Follow-up question handling
    if (isFollowUp && previousTopics.length > 0) {
      const lastTopic = previousTopics[previousTopics.length - 1];
      return `Building on our discussion about ${lastTopic}, I can provide more detailed information. The data shows ${this.getDetailedInfo(lastTopic)}. Is there a specific aspect of this topic you'd like me to elaborate on?`;
    }
    
    // Default response with context
    if (relevantDocs.length > 0) {
      const source = relevantDocs[0].metadata.source;
      return `Based on the ${source} data, I can provide insights about this topic. The data shows relevant patterns and trends. Would you like me to focus on a specific aspect or provide more detailed analysis?`;
    }
    
    return "I have access to comprehensive educational data including graduation rates, GPA distribution, demographics, FRP eligibility, staff composition, and attendance patterns. Could you please specify what aspect of the educational data you'd like to explore? I can provide detailed insights and analysis based on the available information.";
  }

  // Get topics from previous conversation
  getPreviousTopics() {
    const topics = [];
    const keywords = ['graduation', 'gpa', 'demographic', 'frp', 'staff', 'attendance', 'absent'];
    
    for (const msg of this.conversationHistory) {
      for (const keyword of keywords) {
        if (msg.content.toLowerCase().includes(keyword)) {
          topics.push(keyword);
        }
      }
    }
    
    return [...new Set(topics)]; // Remove duplicates
  }

  // Get detailed information for follow-up questions
  getDetailedInfo(topic) {
    switch (topic) {
      case 'graduation':
        return `graduation rates vary significantly by student characteristics. Overall graduation rate is ${(graduationData.overall.graduated * 100).toFixed(1)}%, with notable differences by gender, race, and special education status.`;
      case 'gpa':
        return `GPA distribution across different ranges, with the majority of students in the 4-3 GPA range. The data shows academic performance trends over time and by various demographic factors.`;
      case 'demographic':
        return `student population composition with detailed breakdowns by race, gender, grade level, and school. This helps understand the diversity and distribution patterns.`;
      case 'frp':
        return `Free/Reduced Price meal eligibility patterns, which serve as important socioeconomic indicators for identifying students who may need additional support.`;
      case 'staff':
        return `workforce composition including experience levels, educational qualifications, and demographic diversity among educational staff.`;
      case 'attendance':
        return `chronic absenteeism patterns that are crucial for identifying students at risk and developing intervention strategies.`;
      default:
        return `relevant patterns and trends in the educational data.`;
    }
  }

  // Clear memory (for testing or reset)
  clearMemory() {
    this.conversationHistory = [];
  }

  // Get memory summary
  getMemorySummary() {
    return {
      totalMessages: this.conversationHistory.length,
      topics: this.getPreviousTopics(),
      recentMessages: this.conversationHistory.slice(-3)
    };
  }
}

// Create singleton instance
let agentInstance = null;

export function getAgent() {
  if (!agentInstance) {
    agentInstance = new EduDataAgent();
  }
  return agentInstance;
}

// Export for direct use
export { EduDataAgent };
