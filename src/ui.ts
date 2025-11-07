import { Container, Graphics, Text } from 'pixi.js';
import { Button, Input } from '@pixi/ui';
import { BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_RADIUS, BUTTON_BORDER_WIDTH, BUTTON_FONT_SIZE } from './constants';

export const createButton = (text: string): Button => {
    const buttonView = new Container();
    const buttonBg = new Graphics()
        .roundRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_RADIUS)
        .fill('white')
        .stroke({ width: BUTTON_BORDER_WIDTH, color: 0 });
    const buttonText = new Text({
        text,
        style: {
            fill: 0,
            fontSize: BUTTON_FONT_SIZE,
            fontWeight: "bold"
        }
    });

    buttonText.anchor.set(0.5);
    buttonText.x = buttonBg.width / 2;
    buttonText.y = buttonBg.height / 2;

    buttonView.addChild(buttonBg, buttonText);
    return new Button(buttonView);
};

export const createInput = (placeholder: string, screenWidth: number, screenHeight: number): Input => {
    const input = new Input({
        bg: new Graphics()
            .roundRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_RADIUS)
            .fill('white')
            .stroke({ width: BUTTON_BORDER_WIDTH, color: 0 }),
        textStyle: {
            fill: 0,
            fontSize: BUTTON_FONT_SIZE,
            fontWeight: 'bold',
        },
        align: "center",
        placeholder,
        value: '',
        cleanOnFocus: true,
    });

    input.x = screenWidth / 2 - input.width / 2;
    input.y = screenHeight / 2 + 2 * input.height / 2;

    return input;
};
