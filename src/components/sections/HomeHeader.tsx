import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  Cloud, 
  Zap, 
  Heart, 
  Brain, 
  Sparkles,
  Battery,
  Focus,
  TrendingUp
} from 'lucide-react';
import { MoodEntry, Profile } from '../../lib/supabase';

interface HomeHeaderProps {
  moodEntries: MoodEntry[];
  profile: Profile | null;
}

const quotes = [
  "Every small step forward is progress worth celebrating.",
  "Your neurodivergent mind is a unique gift to the world.",
  "Today is a new opportunity to work with your brain, not against it.",
  "You have everything you need within you to succeed.",
  "Progress, not perfection, is the goal.",
  "Your brain works differently, and that's your superpower.",
  "One task at a time, one breath at a time.",
  "You are exactly where you need to be right now.",
  "Your sensitivity is a strength, not a weakness.",
  "Trust the process and be gentle with yourself."
];

const moodEmojis = {
  1: '😢', 2: '😞', 3: '😕', 4: '😐', 5: '🙂',
  6: '😊', 7: '😄', 8: '😁', 9: '🤩', 10: '🥳'
};

const energyEmojis = {
  1: '😴', 2: '😪', 3: '😑', 4: '😌', 5: '🙂',
  6: '😊', 7: '😃', 8: '😆', 9: '🤸', 10: '⚡'
};

const focusEmojis = {
  1: '🌪️', 2: '😵‍💫', 3: '😵', 4: '😶‍🌫️', 5: '😐',
  6: '🙂', 7: '😌', 8: '🧘', 9: '🎯', 10: '🔥'
};

export const HomeHeader: React.FC<HomeHeaderProps> = ({ moodEntries, profile }) => {
  const latestMood = moodEntries[0];
  
  const dailyEnergyScore = useMemo(() => {
    if (moodEntries.length === 0) return 5;
    
    const today = new Date().toDateString();
    const todayEntries = moodEntries.filter(entry => 
      new Date(entry.created_at).toDateString() === today
    );
    
    if (todayEntries.length === 0) return latestMood?.energy_level || 5;
    
    return Math.round(
      todayEntries.reduce((sum, entry) => sum + entry.energy_level, 0) / todayEntries.length
    );
  }, [moodEntries, latestMood]);

  const currentMoodEmoji = latestMood ? moodEmojis[latestMood.mood_score as keyof typeof moodEmojis] : '🙂';
  const currentEnergyEmoji = energyEmojis[dailyEnergyScore as keyof typeof energyEmojis];
  
  const quoteOfTheDay = useMemo(() => {
    const today = new Date().toDateString();
    const quoteIndex = today.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % quotes.length;
    return quotes[quoteIndex];
  }, []);

  const getTimeOfDayIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return Sun;
    if (hour >= 12 && hour < 18) return Sun;
    if (hour >= 18 && hour < 22) return Cloud;
    return Moon;
  };

  const TimeIcon = getTimeOfDayIcon();

  const getHeaderTheme = () => {
    if (!latestMood) return { bg: 'from-indigo-100 to-purple-100', text: 'text-indigo-900' };
    
    const avgMood = (latestMood.mood_score + latestMood.energy_level + latestMood.focus_level) / 3;
    
    if (avgMood >= 8) return { bg: 'from-green-100 to-emerald-100', text: 'text-green-900' };
    if (avgMood >= 6) return { bg: 'from-blue-100 to-cyan-100', text: 'text-blue-900' };
    if (avgMood >= 4) return { bg: 'from-yellow-100 to-orange-100', text: 'text-orange-900' };
    return { bg: 'from-pink-100 to-red-100', text: 'text-red-900' };
  };

  const theme = getHeaderTheme();

  const getAnimationClass = () => {
    if (!latestMood) return 'mood-animation-gentle';
    
    if (latestMood.energy_level >= 8) return 'mood-animation-energetic';
    if (latestMood.mood_score >= 7) return 'mood-animation-calm';
    return 'mood-animation-gentle';
  };

  const getNeurodivergentGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (!profile?.neurodivergent_type || profile.neurodivergent_type === 'none') {
      return `${timeGreeting}!`;
    }

    const name = profile.full_name?.split(' ')[0] || 'there';
    
    switch (profile.neurodivergent_type) {
      case 'adhd':
        return `${timeGreeting}, ${name}! Ready to channel that amazing ADHD energy?`;
      case 'autism':
        return `${timeGreeting}, ${name}! Hope your day is going smoothly.`;
      case 'anxiety':
        return `${timeGreeting}, ${name}! Take a deep breath - you've got this.`;
      case 'multiple':
        return `${timeGreeting}, ${name}! Your unique mind is ready for today.`;
      default:
        return `${timeGreeting}, ${name}!`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl p-8 mb-8 border border-white/20 shadow-lg`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-4 left-4 w-32 h-32 bg-white/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-4 right-4 w-24 h-24 bg-white/15 rounded-full blur-lg"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className={`text-4xl ${getAnimationClass()}`}
            >
              <TimeIcon className={`h-8 w-8 ${theme.text}`} />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`text-2xl font-bold ${theme.text}`}
              >
                {getNeurodivergentGreeting()}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className={`${theme.text} opacity-80`}
              >
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </motion.p>
            </div>
          </div>

          {/* Current Mood Display */}
          {latestMood && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center space-x-4"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-3xl mb-1"
                >
                  {currentMoodEmoji}
                </motion.div>
                <p className={`text-xs ${theme.text} opacity-70`}>Mood</p>
              </div>
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-3xl mb-1"
                >
                  {currentEnergyEmoji}
                </motion.div>
                <p className={`text-xs ${theme.text} opacity-70`}>Energy</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quote of the Day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-6"
        >
          <div className="flex items-start space-x-3">
            <Sparkles className={`h-5 w-5 ${theme.text} mt-0.5 flex-shrink-0`} />
            <div>
              <p className={`${theme.text} font-medium italic leading-relaxed`}>
                "{quoteOfTheDay}"
              </p>
            </div>
          </div>
        </motion.div>

        {/* Daily Energy Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Battery className={`h-5 w-5 ${theme.text}`} />
              <span className={`${theme.text} font-medium`}>Daily Energy</span>
              <div className="flex items-center space-x-1">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2 + (i * 0.05) }}
                    className={`w-2 h-4 rounded-full ${
                      i < dailyEnergyScore 
                        ? 'bg-current opacity-80' 
                        : 'bg-current opacity-20'
                    }`}
                    style={{ color: 'currentColor' }}
                  />
                ))}
              </div>
              <span className={`${theme.text} font-bold`}>{dailyEnergyScore}/10</span>
            </div>
          </div>

          {/* Mood Trend Indicator */}
          {moodEntries.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 }}
              className="flex items-center space-x-2"
            >
              <TrendingUp className={`h-4 w-4 ${theme.text}`} />
              <span className={`text-sm ${theme.text} opacity-80`}>
                {moodEntries[0].mood_score >= moodEntries[1].mood_score ? 'Improving' : 'Stable'}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};