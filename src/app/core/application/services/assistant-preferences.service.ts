import { Injectable } from '@angular/core';

const ASSISTANT_PREFERENCES_KEY = 'tiqui.assistant.preferences';

export interface AssistantUserPreferences {
  breakReminderMinutes: number;
  weeklyBalanceThresholdMinutes: number;
  suggestedEndOvertimeThresholdMinutes: number;
}

const DEFAULT_PREFERENCES: AssistantUserPreferences = {
  breakReminderMinutes: 180,
  weeklyBalanceThresholdMinutes: 120,
  suggestedEndOvertimeThresholdMinutes: 60,
};

@Injectable({ providedIn: 'root' })
export class AssistantPreferencesService {
  getPreferences(userId: string): AssistantUserPreferences {
    if (!userId) {
      return DEFAULT_PREFERENCES;
    }

    const raw = localStorage.getItem(ASSISTANT_PREFERENCES_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, AssistantUserPreferences>;
      const current = parsed[userId];
      if (!current) {
        return DEFAULT_PREFERENCES;
      }

      return {
        breakReminderMinutes: this.clamp(current.breakReminderMinutes, 60, 360, DEFAULT_PREFERENCES.breakReminderMinutes),
        weeklyBalanceThresholdMinutes: this.clamp(current.weeklyBalanceThresholdMinutes, 30, 480, DEFAULT_PREFERENCES.weeklyBalanceThresholdMinutes),
        suggestedEndOvertimeThresholdMinutes: this.clamp(current.suggestedEndOvertimeThresholdMinutes, 30, 240, DEFAULT_PREFERENCES.suggestedEndOvertimeThresholdMinutes),
      };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  setPreferences(userId: string, prefs: Partial<AssistantUserPreferences>): void {
    if (!userId) {
      return;
    }

    const raw = localStorage.getItem(ASSISTANT_PREFERENCES_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, AssistantUserPreferences>) : {};
    const base = this.getPreferences(userId);

    parsed[userId] = {
      breakReminderMinutes: this.clamp(prefs.breakReminderMinutes, 60, 360, base.breakReminderMinutes),
      weeklyBalanceThresholdMinutes: this.clamp(
        prefs.weeklyBalanceThresholdMinutes,
        30,
        480,
        base.weeklyBalanceThresholdMinutes,
      ),
      suggestedEndOvertimeThresholdMinutes: this.clamp(
        prefs.suggestedEndOvertimeThresholdMinutes,
        30,
        240,
        base.suggestedEndOvertimeThresholdMinutes,
      ),
    };

    localStorage.setItem(ASSISTANT_PREFERENCES_KEY, JSON.stringify(parsed));
  }

  private clamp(value: number | undefined, min: number, max: number, fallback: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, Math.round(value)));
  }
}
