import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTimerStore } from '../stores/useTimerStore';
import { useTaskStore } from '../stores/useTaskStore';
import CountdownCircle from '../components/timer/CountdownCircle';
import TimerControls from '../components/timer/TimerControls';
import BreakReminder from '../components/timer/BreakReminder';
import { formatSeconds, getDurationMinutes } from '../utils/time';
import { startAmbientSound, stopAmbientSound, AMBIENT_SOUNDS } from '../services/ambientSound';
import type { SoundType } from '../services/ambientSound';

export default function FocusTimerPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [ambientSound, setAmbientSound] = useState<SoundType>('none');
  const { tasks, startTask: startTaskAction } = useTaskStore();
  const {
    activeTaskId, isRunning, isPaused, remainingSeconds, totalDurationSeconds,
    startTimer, pauseTimer, resumeTimer, resetTimer, tick, showBreakReminder,
  } = useTimerStore();

  const task = tasks.find((t) => t.id === Number(taskId));

  // Initialize timer
  useEffect(() => {
    if (task && !activeTaskId) {
      const durationMinutes = getDurationMinutes(task.startTime, task.endTime);
      startTaskAction(task.id!);
      startTimer(task.id!, durationMinutes * 60);
    }
  }, [task, activeTaskId]);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Handle visibility change for background/foreground
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isRunning) {
        // Timer continues with stored timestamps
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning]);

  const handleSoundChange = (type: SoundType) => {
    setAmbientSound(type);
    if (type === 'none') {
      stopAmbientSound();
    } else {
      startAmbientSound(type);
    }
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => { stopAmbientSound(); };
  }, []);

  const handleComplete = useCallback(() => {
    stopAmbientSound();
    useTimerStore.getState().completeTimer();
    navigate('/');
  }, [navigate]);

  const handleBack = () => {
    if (isRunning) {
      pauseTimer();
    }
    navigate('/');
  };

  if (!task) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-primary-900 text-white">
        <p>任务不存在</p>
        <button className="mt-4 text-primary-300 underline" onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    );
  }

  const progress = totalDurationSeconds > 0
    ? (totalDurationSeconds - remainingSeconds) / totalDurationSeconds
    : 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-primary-800 to-primary-950 text-white">
      {/* Back button */}
      <button
        className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        style={{ top: 'max(env(safe-area-inset-top, 0px) + 8px, 16px)' }}
        onClick={handleBack}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Task Name */}
        <h1 className="text-xl font-semibold text-center mb-2 opacity-90">{task.name}</h1>
        <p className="text-sm text-white/60 mb-8">{task.startTime} - {task.endTime}</p>

        {/* Countdown */}
        <CountdownCircle
          progress={progress}
          remainingSeconds={remainingSeconds}
          totalSeconds={totalDurationSeconds}
          isRunning={isRunning}
        />

        {/* Timer Display */}
        <div className="mt-8 font-mono text-5xl font-bold tracking-wider">
          {formatSeconds(remainingSeconds)}
        </div>

        {/* Status */}
        <div className="mt-4 text-sm text-white/50">
          {isPaused ? '已暂停' : isRunning ? '专注中...' : '准备开始'}
        </div>

        {/* Ambient Sound Selector */}
        <div className="mt-6 w-full max-w-xs">
          <p className="text-xs text-white/40 mb-2 text-center">环境音</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {AMBIENT_SOUNDS.map((s) => (
              <button
                key={s.type}
                className={`px-2.5 py-1.5 rounded-full text-xs transition-all ${
                  ambientSound === s.type
                    ? 'bg-white/20 text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/10'
                }`}
                onClick={() => handleSoundChange(s.type)}
                title={s.label}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs mt-8 bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-white/60 rounded-full transition-all duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="pb-8 px-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 32px, 32px)' }}>
        <TimerControls
          isRunning={isRunning}
          isPaused={isPaused}
          onPlay={isPaused ? resumeTimer : () => startTimer(task.id!, task.durationMinutes * 60)}
          onPause={pauseTimer}
          onReset={resetTimer}
          onComplete={handleComplete}
        />
      </div>

      {/* Break Reminder */}
      <BreakReminder
        isOpen={showBreakReminder}
        onDismiss={() => useTimerStore.getState().dismissBreakReminder()}
      />
    </div>
  );
}
