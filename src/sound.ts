import { IMediaInstance, sound } from '@pixi/sound';

export enum Sound {
    START = 'start',
    PICKUP = 'pickup',
    PUTDOWN = 'putdown',
    TAKE = 'take',
    PIECE_VALUE_9_TAKEN = 'piece_value_9_taken',
    PIECE_VALUE_5_TAKEN = 'piece_value_5_taken',
    PIECE_VALUE_3_TAKEN = 'piece_value_3_taken',
    PIECE_VALUE_1_TAKEN = 'piece_value_1_taken',
    PIECE_VALUE_9_TAKE = 'piece_value_9_take',
    PIECE_VALUE_5_TAKE = 'piece_value_5_take',
    PIECE_VALUE_3_TAKE = 'piece_value_3_take',
    PIECE_VALUE_1_TAKE = 'piece_value_1_take',
    IMPATIENCE_1_INTRO = 'impatience_1_intro',
    IMPATIENCE_1_LOOP = 'impatience_1_loop',
    IMPATIENCE_1_EXIT = 'impatience_1_exit',
    IMPATIENCE_2_INTRO = 'impatience_2_intro',
    IMPATIENCE_2_LOOP = 'impatience_2_loop',
    IMPATIENCE_2_EXIT = 'impatience_2_exit',
    IMPATIENCE_3_INTRO = 'impatience_3_intro',
    IMPATIENCE_3_LOOP = 'impatience_3_loop',
    IMPATIENCE_3_EXIT = 'impatience_3_exit',
}

export const SOUND_VARIATIONS: Map<Sound, number> = new Map([
    [Sound.START, 1],
    [Sound.PICKUP, 1],
    [Sound.PUTDOWN, 1],
    [Sound.TAKE, 1],
    [Sound.PIECE_VALUE_9_TAKEN, 1],
    [Sound.PIECE_VALUE_5_TAKEN, 1],
    [Sound.PIECE_VALUE_3_TAKEN, 1],
    [Sound.PIECE_VALUE_1_TAKEN, 1],
    [Sound.PIECE_VALUE_9_TAKE, 1],
    [Sound.PIECE_VALUE_5_TAKE, 1],
    [Sound.PIECE_VALUE_3_TAKE, 1],
    [Sound.PIECE_VALUE_1_TAKE, 1],
    [Sound.IMPATIENCE_1_INTRO, 1],
    [Sound.IMPATIENCE_1_LOOP, 2],
    [Sound.IMPATIENCE_1_EXIT, 1],
    [Sound.IMPATIENCE_2_INTRO, 1],
    [Sound.IMPATIENCE_2_LOOP, 1],
    [Sound.IMPATIENCE_2_EXIT, 1],
    [Sound.IMPATIENCE_3_INTRO, 1],
    [Sound.IMPATIENCE_3_LOOP, 1],
    [Sound.IMPATIENCE_3_EXIT, 1],
]);


export const loadSounds = () => {
    // Iterate over all sounds defined in the variations map
    for (const [soundId, variations] of SOUND_VARIATIONS.entries()) {
        for (let i = 1; i <= variations; i++) {
            sound.add(soundId + '_' + i, `assets/${soundId}_${i}.wav`);
        }
    }
};

export const playSound = (
    soundId: Sound,
    probability: number = 1,
    options: object = {}
): IMediaInstance | Promise<IMediaInstance> | null => {
    if (Math.random() >= probability) return null;

    const variations = SOUND_VARIATIONS.get(soundId)!;
    const variation = Math.floor(Math.random() * variations + 1);

    return sound.play(soundId + '_' + variation, options);
};