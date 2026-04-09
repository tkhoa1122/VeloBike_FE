/**
 * Upload Store - Zustand store for managing file uploads
 * Tracks upload progress, queue, and state
 */

import { create } from 'zustand';
import { UploadFileData } from '../../domain/entities/Upload';

export interface UploadTask {
  id: string;
  file: UploadFileData;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  startedAt?: number;
  completedAt?: number;
  url?: string;
  retryCount: number;
}

export interface UploadState {
  // State
  tasks: Map<string, UploadTask>;
  activeUploadIds: Set<string>;
  totalProgress: number; // Overall progress across all uploads

  // Actions
  addTask: (file: UploadFileData) => string; // Returns task ID
  addMultipleTasks: (files: UploadFileData[]) => string[]; // Returns task IDs
  updateTaskProgress: (taskId: string, progress: number) => void;
  updateTaskStatus: (
    taskId: string,
    status: UploadTask['status'],
    error?: string,
    url?: string
  ) => void;
  removeTask: (taskId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  cancelTask: (taskId: string) => void;
  retryTask: (taskId: string) => void;

  // Getters
  getTask: (taskId: string) => UploadTask | undefined;
  getTasksArray: () => UploadTask[];
  getActiveTasks: () => UploadTask[];
  getFailedTasks: () => UploadTask[];
  getCompletedTasks: () => UploadTask[];
  getTotalProgress: () => number;
  isUploading: () => boolean;
}

const generateTaskId = (): string => {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate overall progress across all tasks
 */
const calculateTotalProgress = (tasks: Map<string, UploadTask>): number => {
  if (tasks.size === 0) return 0;

  const totalProgress = Array.from(tasks.values()).reduce((sum, task) => {
    return sum + task.progress;
  }, 0);

  return Math.round(totalProgress / tasks.size);
};

export const useUploadStore = create<UploadState>((set, get) => ({
  tasks: new Map(),
  activeUploadIds: new Set(),
  totalProgress: 0,

  addTask: (file: UploadFileData): string => {
    const taskId = generateTaskId();
    const task: UploadTask = {
      id: taskId,
      file,
      progress: 0,
      status: 'pending',
      retryCount: 0,
    };

    set((state) => {
      const newTasks = new Map(state.tasks);
      newTasks.set(taskId, task);
      return {
        tasks: newTasks,
        totalProgress: calculateTotalProgress(newTasks),
      };
    });

    return taskId;
  },

  addMultipleTasks: (files: UploadFileData[]): string[] => {
    const taskIds: string[] = [];

    set((state) => {
      const newTasks = new Map(state.tasks);

      files.forEach((file) => {
        const taskId = generateTaskId();
        taskIds.push(taskId);

        const task: UploadTask = {
          id: taskId,
          file,
          progress: 0,
          status: 'pending',
          retryCount: 0,
        };

        newTasks.set(taskId, task);
      });

      return {
        tasks: newTasks,
        totalProgress: calculateTotalProgress(newTasks),
      };
    });

    return taskIds;
  },

  updateTaskProgress: (taskId: string, progress: number): void => {
    set((state) => {
      const newTasks = new Map(state.tasks);
      const task = newTasks.get(taskId);

      if (task) {
        task.progress = Math.min(100, Math.max(0, progress));
        newTasks.set(taskId, task);
      }

      return {
        tasks: newTasks,
        totalProgress: calculateTotalProgress(newTasks),
      };
    });
  },

  updateTaskStatus: (taskId: string, status, error, url): void => {
    set((state) => {
      const newTasks = new Map(state.tasks);
      const newActiveIds = new Set(state.activeUploadIds);
      const task = newTasks.get(taskId);

      if (task) {
        task.status = status;
        if (error) task.error = error;
        if (url) task.url = url;

        // Update timestamps
        if (status === 'uploading' && !task.startedAt) {
          task.startedAt = Date.now();
        }
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          task.completedAt = Date.now();
          newActiveIds.delete(taskId);
        }

        newTasks.set(taskId, task);
      }

      return {
        tasks: newTasks,
        activeUploadIds: newActiveIds,
        totalProgress: calculateTotalProgress(newTasks),
      };
    });
  },

  removeTask: (taskId: string): void => {
    set((state) => {
      const newTasks = new Map(state.tasks);
      const newActiveIds = new Set(state.activeUploadIds);

      newTasks.delete(taskId);
      newActiveIds.delete(taskId);

      return {
        tasks: newTasks,
        activeUploadIds: newActiveIds,
        totalProgress: calculateTotalProgress(newTasks),
      };
    });
  },

  clearCompleted: (): void => {
    set((state) => {
      const newTasks = new Map(state.tasks);

      Array.from(newTasks.entries()).forEach(([id, task]) => {
        if (task.status === 'completed' || task.status === 'cancelled') {
          newTasks.delete(id);
        }
      });

      return {
        tasks: newTasks,
        totalProgress: calculateTotalProgress(newTasks),
      };
    });
  },

  clearAll: (): void => {
    set({
      tasks: new Map(),
      activeUploadIds: new Set(),
      totalProgress: 0,
    });
  },

  cancelTask: (taskId: string): void => {
    get().updateTaskStatus(taskId, 'cancelled', 'Đã hủy bởi người dùng');
  },

  retryTask: (taskId: string): void => {
    set((state) => {
      const newTasks = new Map(state.tasks);
      const task = newTasks.get(taskId);

      if (task && task.status === 'failed') {
        task.status = 'pending';
        task.progress = 0;
        task.error = undefined;
        task.retryCount += 1;
        newTasks.set(taskId, task);
      }

      return {
        tasks: newTasks,
        totalProgress: calculateTotalProgress(newTasks),
      };
    });
  },

  getTask: (taskId: string): UploadTask | undefined => {
    return get().tasks.get(taskId);
  },

  getTasksArray: (): UploadTask[] => {
    return Array.from(get().tasks.values());
  },

  getActiveTasks: (): UploadTask[] => {
    return Array.from(get().tasks.values()).filter((task) => task.status === 'uploading');
  },

  getFailedTasks: (): UploadTask[] => {
    return Array.from(get().tasks.values()).filter((task) => task.status === 'failed');
  },

  getCompletedTasks: (): UploadTask[] => {
    return Array.from(get().tasks.values()).filter((task) => task.status === 'completed');
  },

  getTotalProgress: (): number => {
    return get().totalProgress;
  },

  isUploading: (): boolean => {
    return Array.from(get().tasks.values()).some((task) => task.status === 'uploading' || task.status === 'pending');
  },
}));
