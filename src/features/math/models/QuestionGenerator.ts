import { randomInt, shuffle } from '@/utils';
import { Question } from '../types';

export class QuestionGenerator {
	generate(difficulty: number): Question {
		switch (difficulty) {
			case 1:
				return this.generateDifficulty1();

			case 2:
				return this.generateDifficulty2();

			case 3:
				return this.generateDifficulty3();

			case 4:
				return this.generateDifficulty4();

			default:
				return this.generateDifficulty1();
		}
	}

	private generateDifficulty1(): Question {
		const useAddition = Math.random() < 0.5;

		let a = randomInt(1, 20);
		let b = randomInt(1, 20);

		let answer: number;
		let expression: string;

		if (useAddition) {
			answer = a + b;
			expression = `${a} + ${b}`;
		} else {
			if (a < b) {
				[a, b] = [b, a];
			}

			answer = a - b;
			expression = `${a} - ${b}`;
		}

		return {
			expression,
			answer,
			options: this.generateOptions(answer),
			difficulty: 1,
		};
	}

	private generateDifficulty2(): Question {
		const useAddition = Math.random() < 0.5;

		let a = randomInt(1, 50);
		let b = randomInt(1, 50);

		let answer: number;
		let expression: string;

		if (useAddition) {
			answer = a + b;
			expression = `${a} + ${b}`;
		} else {
			if (a < b) {
				[a, b] = [b, a];
			}

			answer = a - b;
			expression = `${a} - ${b}`;
		}

		return {
			expression,
			answer,
			options: this.generateOptions(answer),
			difficulty: 2,
		};
	}

	private generateDifficulty3(): Question {
		const operation = randomInt(0, 2);

		let a = randomInt(1, 100);
		let b = randomInt(1, 100);

		let answer: number;
		let expression: string;

		switch (operation) {
			case 0:
				answer = a + b;
				expression = `${a} + ${b}`;
				break;

			case 1:
				if (a < b) {
					[a, b] = [b, a];
				}

				answer = a - b;
				expression = `${a} - ${b}`;
				break;

			default:
				a = randomInt(2, 12);
				b = randomInt(2, 12);

				answer = a * b;
				expression = `${a} × ${b}`;
				break;
		}

		return {
			expression,
			answer,
			options: this.generateOptions(answer),
			difficulty: 3,
		};
	}

	private generateDifficulty4(): Question {
		const operation = randomInt(0, 2);

		let a = randomInt(1, 200);
		let b = randomInt(1, 200);

		let answer: number;
		let expression: string;

		switch (operation) {
			case 0:
				answer = a + b;
				expression = `${a} + ${b}`;
				break;

			case 1:
				if (a < b) {
					[a, b] = [b, a];
				}

				answer = a - b;
				expression = `${a} - ${b}`;
				break;

			default:
				a = randomInt(5, 20);
				b = randomInt(2, 15);

				answer = a * b;
				expression = `${a} × ${b}`;
				break;
		}

		return {
			expression,
			answer,
			options: this.generateOptions(answer),
			difficulty: 4,
		};
	}

	private generateOptions(answer: number): number[] {
		const options = new Set<number>();

		options.add(answer);

		while (options.size < 4) {
			const offset = randomInt(-5, 5);

			if (offset === 0) {
				continue;
			}

			const option = answer + offset;

			if (option >= 0) {
				options.add(option);
			}
		}

		return shuffle([...options]);
	}
}
