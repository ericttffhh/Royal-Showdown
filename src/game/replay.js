/**
 * 戰鬥重播記錄與重放系統 (Battle Replay System)
 */

export class ReplayRecorder {
  constructor() {
    this.isRecording = false;
    this.currentReplay = null;
  }

  startRecording(matchMode, playerDeck, enemyName) {
    this.isRecording = true;
    this.currentReplay = {
      id: `rep_${Date.now()}`,
      date: new Date().toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      mode: matchMode,
      enemyName: enemyName || '電腦對手',
      deck: [...playerDeck],
      events: [],
      result: 'win',
      duration: 0
    };
  }

  recordEvent(time, type, data) {
    if (!this.isRecording || !this.currentReplay) return;
    this.currentReplay.events.push({
      time: Math.round(time * 100) / 100,
      type,
      ...data
    });
  }

  stopRecording(result, scores, totalTime) {
    if (!this.isRecording || !this.currentReplay) return null;
    this.isRecording = false;
    this.currentReplay.result = result;
    this.currentReplay.scores = scores;
    this.currentReplay.duration = Math.round(totalTime);
    return this.currentReplay;
  }
}

export const replayRecorder = new ReplayRecorder();
