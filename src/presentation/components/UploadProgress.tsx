
/**
 * Upload Progress Component
 * Displays individual upload progress and status
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RotateCcw, X } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, RADIUS } from '../../config/theme';
import { UploadTask } from '../stores/uploadStore';

interface UploadProgressItemProps {
  task: UploadTask;
  onCancel?: () => void;
  onRetry?: () => void;
  onRemove?: () => void;
}

const getStatusColor = (status: UploadTask['status']): string => {
  switch (status) {
    case 'uploading':
      return COLORS.primary;
    case 'completed':
      return COLORS.success;
    case 'failed':
      return COLORS.error;
    case 'cancelled':
      return COLORS.warning;
    default:
      return COLORS.textSecondary;
  }
};

const getStatusLabel = (status: UploadTask['status']): string => {
  switch (status) {
    case 'pending':
      return 'Đang chờ...';
    case 'uploading':
      return 'Đang upload...';
    case 'completed':
      return 'Hoàn tất';
    case 'failed':
      return 'Thất bại';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

export const UploadProgressItem: React.FC<UploadProgressItemProps> = ({
  task,
  onCancel,
  onRetry,
  onRemove,
}) => {
  const statusColor = getStatusColor(task.status);
  const fileName = task.file.name.split('/').pop() || task.file.name;
  const truncatedName = fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.fileName}>{truncatedName}</Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {getStatusLabel(task.status)}
          </Text>
        </View>

        <View style={styles.actions}>
          {task.status === 'uploading' && (
            <TouchableOpacity onPress={onCancel} hitSlop={5}>
              <X size={18} color={COLORS.error} />
            </TouchableOpacity>
          )}
          {task.status === 'failed' && (
            <TouchableOpacity onPress={onRetry} hitSlop={5}>
              <RotateCcw size={18} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {(task.status === 'completed' || task.status === 'cancelled') && (
            <TouchableOpacity onPress={onRemove} hitSlop={5}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(task.progress, 100)}%`,
              backgroundColor: statusColor,
            },
          ]}
        />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.progress}>{task.progress}%</Text>

        {task.status === 'failed' && (
          <Text style={styles.error}>{task.error || 'Lỗi không xác định'}</Text>
        )}

        {task.status === 'completed' && task.url && (
          <Text style={styles.url} numberOfLines={1}>
            {task.url}
          </Text>
        )}

        {task.retryCount > 0 && task.status === 'failed' && (
          <Text style={styles.retryCount}>Thử lại: {task.retryCount}</Text>
        )}
      </View>
    </View>
  );
};

interface UploadProgressListProps {
  tasks: UploadTask[];
  onCancel?: (taskId: string) => void;
  onRetry?: (taskId: string) => void;
  onRemove?: (taskId: string) => void;
}

export const UploadProgressList: React.FC<UploadProgressListProps> = ({
  tasks,
  onCancel,
  onRetry,
  onRemove,
}) => {
  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có file nào</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {tasks.map((task) => (
        <UploadProgressItem
          key={task.id}
          task={task}
          onCancel={() => onCancel?.(task.id)}
          onRetry={() => onRetry?.(task.id)}
          onRemove={() => onRemove?.(task.id)}
        />
      ))}
    </View>
  );
};

interface UploadProgressOverlayProps {
  visible: boolean;
  progress: number; // 0-100
  message?: string;
  onCancel?: () => void;
}

export const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({
  visible,
  progress,
  message = 'Uploading...',
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.overlayContent}>
        <Text style={styles.overlayMessage}>{message}</Text>

        <View style={styles.overlayProgressContainer}>
          <View
            style={[
              styles.overlayProgressBar,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.overlayPercentage}>{Math.round(progress)}%</Text>

        {onCancel && (
          <TouchableOpacity style={styles.overlayCancelButton} onPress={onCancel}>
            <Text style={styles.overlayCancelText}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // UploadProgressItem styles
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  fileName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  status: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: RADIUS.sm,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progress: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  error: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    flex: 1,
    marginLeft: SPACING.sm,
  },
  url: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    flex: 1,
    marginLeft: SPACING.sm,
  },
  retryCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    marginLeft: SPACING.sm,
  },

  // UploadProgressList styles
  emptyContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  listContainer: {
    width: '100%',
  },

  // UploadProgressOverlay styles
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  overlayMessage: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  overlayProgressContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  overlayProgressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  overlayPercentage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  overlayCancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  overlayCancelText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});

export default UploadProgressItem;
