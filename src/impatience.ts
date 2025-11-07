import { IMediaInstance } from '@pixi/sound';
import { Sound, playSound } from './sound';

export class ImpatienceStateMachine {
    private state: 'idle' | 'waiting' | 'intro' | 'loop' | 'exit' = 'idle';
    private waitMin: number;
    private waitMax: number;
    private currentTimeout: ReturnType<typeof setTimeout> | null = null;
    private currentSound: IMediaInstance | null = null;
    private variation: number = 1;

    constructor(waitMin = 5000, waitMax = 10000) {
        this.waitMin = waitMin;
        this.waitMax = waitMax;
    }

    public onMove(): void {
        if (['idle', 'waiting'].includes(this.state)) {
            this.transitionTo('waiting');
        } else if (['intro', 'loop'].includes(this.state)) {
            this.transitionTo('exit');
        }
    }
    private transitionTo(newState: typeof this.state): void {
        this.cleanup();
        console.log(`${this.state} -> ${newState}`);
        this.state = newState;

        switch (newState) {
            case 'idle':
                break;
            case 'waiting': {
                const randomWait = this.waitMin + Math.random() * (this.waitMax - this.waitMin);
                this.currentTimeout = setTimeout(() => this.transitionTo('intro'), randomWait);
                break;
            }
            case 'intro':
                this.variation = Math.floor(Math.random() * 3) + 1;
                const introSound = `impatience_${this.variation}_intro` as Sound;
                this.playSound(introSound, false, () => this.transitionTo('loop'));
                break;
            case 'loop':
                const loopSound = `impatience_${this.variation}_loop` as Sound;
                this.playSound(loopSound, true);
                break;
            case 'exit':
                const exitSound = `impatience_${this.variation}_exit` as Sound;
                this.playSound(exitSound, false, () => this.transitionTo('waiting'));
                break;
        }
    }

    private cleanup(): void {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        if (this.currentSound) {
            this.currentSound.stop();
            this.currentSound = null;
        }
    }

    private playSound(soundId: Sound, loop = false, complete?: () => void): void {
        const instance = playSound(soundId, 1, { loop, complete });
        if (instance instanceof Promise) {
            instance.then(sound => {
                this.currentSound = sound;
            });
        } else if (instance) {
            this.currentSound = instance;
        }
    }
}