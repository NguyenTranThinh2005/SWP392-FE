import { authService } from './authService';
import { seriesService } from './seriesService';
import { chapterService } from './chapterService';
import { taskService } from './taskService';
import { manuscriptService } from './manuscriptService';
import { userService } from './userService';
import { systemService } from './systemService';
import { voteService } from './voteService';
import { notificationService } from './notificationService';
import { reviewService } from './reviewService';

/**
 * Centrally manages all API services for MangaHub.
 * Allows easy logging, debugging, token handling, and global loading interception.
 */
export const APIManager = {
  auth: authService,
  series: seriesService,
  chapter: chapterService,
  task: taskService,
  manuscript: manuscriptService,
  user: userService,
  system: systemService,
  vote: voteService,
  notification: notificationService,
  review: reviewService,
};

export default APIManager;
export type APIManagerType = typeof APIManager;
