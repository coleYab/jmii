import { BoardState } from '../models/CreativeProfile/BoardState';
import type { IBoardState as BoardStateType } from '../types/widgets';

export class BoardStateService {
  // Create or update board state for a user
  static async saveUserBoardState(userId: string, state: BoardStateType, metadata?: any) {
    return await BoardState.findOneAndUpdate(
      { userId },
      { 
        state,
        lastModified: new Date(),
        metadata
      },
      { upsert: true, new: true }
    );
  }

  // Get board state for a user
  static async getUserBoardState(userId: string) {
    return await BoardState.findOne({ userId });
  }

  // Get public board states
  static async getPublicBoardStates(limit = 10, skip = 0) {
    return await BoardState.find({ isPublic: true })
      .sort({ lastModified: -1 })
      .skip(skip)
      .limit(limit);
  }

  // Delete board state
  static async deleteBoardState(userId: string) {
    return await BoardState.deleteOne({ userId });
  }
}