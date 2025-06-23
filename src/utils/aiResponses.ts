import { useAICoach } from '../hooks/useAICoach';

// Enhanced AI responses that now integrate with Gemini
export const getAIResponse = async (userInput: string, context?: any): Promise<string> => {
  // This function is now deprecated in favor of the AI Coach hook
  // Keeping for backward compatibility
  const input = userInput.toLowerCase();
  
  // Overwhelmed responses
  if (input.includes('overwhelmed') || input.includes('stressed') || input.includes('anxious')) {
    return "I can hear that you're feeling overwhelmed right now. Let's take this one step at a time. First, take a deep breath with me. What's the most important thing you need to focus on today?";
  }
  
  // Procrastination responses
  if (input.includes('procrastinating') || input.includes('avoiding') || input.includes('putting off')) {
    return "Procrastination is so common, especially for neurodivergent minds. You're not broken - your brain just works differently. What's one tiny step you could take right now? Even 2 minutes counts.";
  }
  
  // Starting task responses
  if (input.includes('start') || input.includes('begin') || input.includes('getting started')) {
    return "Starting is often the hardest part! Let's make this easier. Can you tell me what task you're trying to start? I'll help you break it into smaller, manageable pieces.";
  }
  
  // Focus/concentration responses
  if (input.includes('focus') || input.includes('concentrate') || input.includes('distracted')) {
    return "I understand how hard it can be to maintain focus. Your brain is working perfectly - it just needs the right support. What's pulling your attention away right now?";
  }
  
  // To-do/task management responses
  if (input.includes('to-do') || input.includes('todo') || input.includes('tasks') || input.includes('list')) {
    return "Let's organize your tasks in a way that works with your brain, not against it. What are the main things on your mind right now? I'll help you prioritize based on your energy and mood.";
  }
  
  // Motivation responses
  if (input.includes('motivation') || input.includes('energy') || input.includes('tired')) {
    return "Your energy levels are valid and important. Let's work with where you are right now, not where you think you should be. What feels manageable for you today?";
  }
  
  // Time management responses
  if (input.includes('time') || input.includes('deadline') || input.includes('schedule')) {
    return "Time can feel tricky for neurodivergent minds. Let's create a flexible structure that supports you. How much time do you realistically have, and what feels urgent versus important?";
  }
  
  // Default supportive response
  return "I'm here to support you exactly as you are. Your neurodivergent mind is not something to fix - it's something to understand and work with. What would be most helpful for you right now?";
};

// Quick action responses for preset buttons - now enhanced with AI
export const quickActionResponses = {
  overwhelmed: "I hear you. When everything feels like too much, we start small. Take three deep breaths with me, then tell me one thing that's weighing on your mind the most.",
  
  startTask: "Starting is brave! Let's make this task feel less intimidating. What's the task, and what's the very first tiny step you could take? Even opening a document counts as progress.",
  
  procrastinating: "Procrastination isn't laziness - it's often your brain protecting you from something that feels overwhelming. What's making this task feel hard to start?",
  
  breakDown: "Perfect! Breaking things down is one of the best strategies for neurodivergent minds. Tell me about your to-do list, and I'll help you organize it in a brain-friendly way."
};